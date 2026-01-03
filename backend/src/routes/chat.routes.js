import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import chatService from '../services/chat.service.js';
import { aiRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array(),
        });
    }
    next();
};

/**
 * POST /api/chat/message
 * Main chat endpoint for the web interface
 */
router.post('/message',
    authenticate,
    aiRateLimit({ max: 50 }), // Higher limit for chat
    [
        body('message').notEmpty().isString().trim().isLength({ max: 500 }),
        body('stream').optional().isBoolean(),
    ],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { message, stream } = req.body;
            const userId = req.user.id;

            if (stream) {
                // Set headers for SSE
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');

                const onToken = (token) => {
                    res.write(`data: ${JSON.stringify({ token })}\n\n`);
                };

                const result = await chatService.processChatMessage({ 
                    message, 
                    userId, 
                    onToken 
                });
                
                res.write(`data: ${JSON.stringify({ final: true, ...result })}\n\n`);
                res.end();
            } else {
                const result = await chatService.processChatMessage({ 
                    message, 
                    userId 
                });

                res.json({
                    success: true,
                    data: result,
                });
            }
        } catch (error) {
            console.error('Chat endpoint error:', error);
            next(error);
        }
    }
);

export default router;
