import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new ratelimiter, that allows 10 requests per 10 seconds
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || "",
    token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

// Helper to disable rate limiting if env vars are missing (e.g. local dev without redis)
const isRedisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

export async function rateLimit(identifier: string, limit: number = 10, window: any = "10 s") {
    if (!isRedisConfigured) {
        console.warn("Rate Limiting disabled: Missing UPSTASH_REDIS_REST_URL/TOKEN");
        return { success: true, limit, remaining: limit, reset: 0 };
    }

    const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, window),
        analytics: true,
        prefix: "@upstash/ratelimit",
    });

    return await ratelimit.limit(identifier);
}
