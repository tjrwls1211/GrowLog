import azure.functions as func
import json
import logging
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import google.generativeai as genai
import time

app = func.FunctionApp()

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
DATABASE_URL = os.environ.get('DATABASE_URL')
GEMINI_TIMEOUT_MS = 30000 

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def get_db_connection():
    """PostgreSQL 연결 생성"""
    return psycopg2.connect(DATABASE_URL)

def generate_post_summary(title: str, content: str) -> str:
    """Gemini API를 사용해서 포스트 요약 생성"""
    model = genai.GenerativeModel('gemini-2.5-flash')

    prompt = f"""다음 학습 포스트를 2-3문장으로 요약해주세요:

제목: {title}
내용: {content}

핵심 내용과 배운 점을 중심으로 간단명료하게 요약해주세요. 마크다운 형식은 사용하지 마세요."""

    response = model.generate_content(prompt)

    if not response.text:
        raise Exception('Empty response from Gemini')

    return response.text

@app.queue_trigger(
    arg_name="msg",
    queue_name="summary-queue",
    connection="AzureWebJobsStorage"
)
def summary_worker(msg: func.QueueMessage) -> None:
    """Queue에서 메시지를 받아 요약 생성"""
    start_time = time.time()

    try:
        message_body = msg.get_body().decode('utf-8')
        message = json.loads(message_body)
        post_id = message['postId']

        logging.info(f'[SummaryWorker] 시작: postId={post_id}')

        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        try:
            cursor.execute(
                '''SELECT id, title, content, "summaryStatus"
                   FROM "posts"
                   WHERE id = %s''',
                (post_id,)
            )
            post = cursor.fetchone()

            if not post:
                logging.error(f'[SummaryWorker] Post not found: postId={post_id}')
                return

            if post['summaryStatus'] == 'COMPLETED':
                logging.info(f'[SummaryWorker] 이미 완료됨: postId={post_id}')
                return

            cursor.execute(
                'UPDATE "posts" SET "summaryStatus" = %s WHERE id = %s',
                ('PROCESSING', post_id)
            )
            conn.commit()

            logging.info(f'[SummaryWorker] Gemini 호출 중: postId={post_id}')
            summary = generate_post_summary(post['title'], post['content'])

            cursor.execute(
                'UPDATE "posts" SET summary = %s, "summaryStatus" = %s WHERE id = %s',
                (summary, 'COMPLETED', post_id)
            )
            conn.commit()

            duration = (time.time() - start_time) * 1000
            logging.info(f'[SummaryWorker] 완료: postId={post_id}, duration={duration:.0f}ms')

        finally:
            cursor.close()
            conn.close()

    except Exception as error:
        duration = (time.time() - start_time) * 1000
        error_message = str(error)
        logging.error(f'[SummaryWorker] 실패: duration={duration:.0f}ms, error={error_message}')

        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            message = json.loads(msg.get_body().decode('utf-8'))
            cursor.execute(
                'UPDATE "posts" SET "summaryStatus" = %s WHERE id = %s',
                ('FAILED', message['postId'])
            )
            conn.commit()
            cursor.close()
            conn.close()
        except Exception as update_error:
            logging.error(f'[SummaryWorker] 상태 업데이트 실패: {str(update_error)}')

        raise error
