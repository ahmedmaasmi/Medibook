// Simple in-memory rate limiter for AI endpoints
const rateLimits = new Map();

/**
 * AI Rate Limiter Middleware
 * Default: 10 requests per hour per user
 */
export const aiRateLimit = (options = {}) => {
    const { 
        windowMs = 60 * 60 * 1000, // 1 hour 
        max = 20, // 20 requests per window
        message = 'Too many AI requests, please try again later.'
    } = options;

    return (req, res, next) => {
        const userId = req.user?.id || req.ip;
        const now = Date.now();
        
        if (!rateLimits.has(userId)) {
            rateLimits.set(userId, {
                count: 1,
                resetTime: now + windowMs
            });
            return next();
        }

        const limitData = rateLimits.get(userId);

        // Reset if window expired
        if (now > limitData.resetTime) {
            limitData.count = 1;
            limitData.resetTime = now + windowMs;
            return next();
        }

        // Increment count
        limitData.count++;

        if (limitData.count > max) {
            return res.status(429).json({
                success: false,
                message
            });
        }

        next();
    };
};

export default aiRateLimit;
