import azure.functions as func
import json
import logging
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import google.generativeai as genai
import time
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception

app = func.FunctionApp()

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
DATABASE_URL = os.environ.get('DATABASE_URL')
MAX_DEQUEUE_COUNT = 5
PROCESSING_TIMEOUT_MINUTES = 10
GEMINI_RATE_LIMIT_DELAY = 15

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


# ── DB ──────────────────────────────────────────────

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

def claim_post_for_processing(cursor, post_id: int):
    """PROCESSING 점유 - 원자적 UPDATE + RETURNING으로 중복 처리 방지
    이미 처리 중/완료된 포스트는 None 반환
    PROCESSING 상태가 10분 이상 지난 경우(stale) 재점유
    """
    cursor.execute(
        '''UPDATE "posts" SET "summaryStatus" = 'PROCESSING', "processingStartedAt" = NOW()
           WHERE id = %s AND (
               "summaryStatus" NOT IN ('PROCESSING', 'COMPLETED')
               OR (
                   "summaryStatus" = 'PROCESSING'
                   AND "processingStartedAt" < NOW() - (%s * INTERVAL '1 minute')
               )
           )
           RETURNING id, title, content''',
        (post_id, PROCESSING_TIMEOUT_MINUTES)
    )
    return cursor.fetchone()

def update_post_status(cursor, post_id: int, status: str, summary: str = None):
    cursor.execute(
        'UPDATE "posts" SET summary = %s, "summaryStatus" = %s, "processingStartedAt" = NULL WHERE id = %s',
        (summary, status, post_id)
    )


# ── Gemini ──────────────────────────────────────────

@retry(
    retry=retry_if_exception(lambda e: '503' in str(e)),
    wait=wait_fixed(3),
    stop=stop_after_attempt(2),
    before_sleep=lambda _: logging.warning('[SummaryWorker] Gemini 503 일시 오류, 3초 후 재시도')
)
def generate_post_summary(title: str, content: str) -> str:
    """503 일시 오류 시 3초 후 1회 재시도
    429 rate limit은 큐 레벨(visibilityTimeout 90초)에서 처리
    """
    model = genai.GenerativeModel('gemini-2.5-flash')

    prompt = f"""다음 학습 포스트를 2-3문장으로 요약해주세요:

제목: {title}
내용: {content}

핵심 내용과 배운 점을 중심으로 간단명료하게 요약해주세요. 마크다운 형식은 사용하지 마세요."""

    response = model.generate_content(prompt)

    if not response.text:
        raise Exception('Empty response from Gemini')

    return response.text


# ── Queue Worker ─────────────────────────────────────

@app.queue_trigger(
    arg_name="msg",
    queue_name="summary-queue",
    connection="AzureWebJobsStorage"
)
def summary_worker(msg: func.QueueMessage) -> None:
    start_time = time.time()
    post_id = None

    try:
        post_id = json.loads(msg.get_body().decode('utf-8'))['postId']
        logging.info(f'[SummaryWorker] 시작: postId={post_id}, dequeueCount={msg.dequeue_count}')

        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        try:
            post = claim_post_for_processing(cursor, post_id)
            conn.commit()

            if not post:
                logging.info(f'[SummaryWorker] 처리 불필요(이미 처리 중이거나 완료됨): postId={post_id}')
                return

            logging.info(f'[SummaryWorker] Gemini 호출 중: postId={post_id}')
            summary = generate_post_summary(post['title'], post['content'])

            update_post_status(cursor, post_id, 'COMPLETED', summary)
            conn.commit()

            duration = (time.time() - start_time) * 1000
            logging.info(f'[SummaryWorker] 완료: postId={post_id}, duration={duration:.0f}ms')

            time.sleep(GEMINI_RATE_LIMIT_DELAY)

        finally:
            cursor.close()
            conn.close()

    except Exception as error:
        duration = (time.time() - start_time) * 1000
        logging.error(f'[SummaryWorker] 실패: duration={duration:.0f}ms, error={str(error)}')

        if post_id is None:
            raise error

        is_final_attempt = msg.dequeue_count >= MAX_DEQUEUE_COUNT
        new_status = 'FAILED' if is_final_attempt else 'PENDING'

        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            update_post_status(cursor, post_id, new_status)
            conn.commit()
            cursor.close()
            conn.close()

            if is_final_attempt:
                logging.error(f'[SummaryWorker] 최종 실패 확정: postId={post_id}')
            else:
                logging.warning(f'[SummaryWorker] PENDING 복원 후 재시도 예정: postId={post_id}, dequeueCount={msg.dequeue_count}/{MAX_DEQUEUE_COUNT}')
        except Exception as update_error:
            logging.error(f'[SummaryWorker] 상태 업데이트 실패: {str(update_error)}')

        raise error
