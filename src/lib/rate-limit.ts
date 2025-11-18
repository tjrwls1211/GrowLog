type RateLimitEntry = {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 
const MAX_REQUESTS = 10

export function checkRateLimit(userId: number): { success: boolean; remaining: number; resetTime: number } {
  const key = `user:${userId}`
  const now = Date.now()

  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetTime) {
    const resetTime = now + RATE_LIMIT_WINDOW_MS
    rateLimitMap.set(key, { count: 1, resetTime })
    return { success: true, remaining: MAX_REQUESTS - 1, resetTime }
  }

  if (entry.count >= MAX_REQUESTS) {
    return { success: false, remaining: 0, resetTime: entry.resetTime }
  }

  entry.count += 1
  rateLimitMap.set(key, entry)

  return { success: true, remaining: MAX_REQUESTS - entry.count, resetTime: entry.resetTime }
}

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, RATE_LIMIT_WINDOW_MS)
