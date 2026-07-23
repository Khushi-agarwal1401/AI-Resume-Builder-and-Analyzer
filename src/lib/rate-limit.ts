import Redis from "ioredis";

let redisClient: Redis | null = null;

function getRedis(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false,
        lazyConnect: true,
      });
    } else {
      // Fallback: create a local Redis client (for dev without Redis)
      redisClient = new Redis({
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379", 10),
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        lazyConnect: true,
      });
    }
  }
  return redisClient;
}

/**
 * In-memory fallback for rate limiting when Redis is unavailable.
 * Uses a simple sliding window stored in a Map.
 */
const memoryStore = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimitInMemory(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const windowKey = `ratelimit:${key}:${Math.floor(now / windowMs)}`;
  const entry = memoryStore.get(windowKey);

  if (!entry || now > entry.expiresAt) {
    memoryStore.set(windowKey, { count: 1, expiresAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Check if a request is within rate limits.
 * Uses Redis sliding window counter with an in-memory fallback.
 * Falls back to in-memory rate limiting (still restrictive) if Redis is unreachable.
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<boolean> {
  if (maxRequests >= 9999) return true; // Unlimited

  try {
    const redis = getRedis();
    const now = Date.now();
    const windowKey = `ratelimit:${key}:${Math.floor(now / windowMs)}`;

    const count = await redis.incr(windowKey);
    if (count === 1) {
      await redis.pexpire(windowKey, windowMs);
    }
    return count <= maxRequests;
  } catch {
    // Redis unreachable — fall back to in-memory rate limiting.
    // This is still restrictive (not permissive) to prevent abuse.
    return checkRateLimitInMemory(key, maxRequests, windowMs);
  }
}

/**
 * Get rate limit headers for the response.
 */
export async function getRateLimitHeaders(key: string, maxRequests: number) {
  try {
    const redis = getRedis();
    const now = Date.now();
    const windowMs = 60000;
    const windowKey = `ratelimit:${key}:${Math.floor(now / windowMs)}`;

    const current = parseInt((await redis.get(windowKey)) || "0", 10);
    const ttl = await redis.pttl(windowKey);

    return {
      "X-RateLimit-Limit": String(maxRequests),
      "X-RateLimit-Remaining": String(Math.max(0, maxRequests - current)),
      "X-RateLimit-Reset": String(ttl > 0 ? now + ttl : now + windowMs),
    };
  } catch {
    return {
      "X-RateLimit-Limit": String(maxRequests),
      "X-RateLimit-Remaining": String(maxRequests),
      "X-RateLimit-Reset": String(Date.now() + 60000),
    };
  }
}
