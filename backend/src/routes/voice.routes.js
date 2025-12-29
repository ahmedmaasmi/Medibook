import express from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import aiService from '../services/ai.service.js';

const router = express.Router();

// Process voice command
router.post('/process',
    authenticate,
    [
        body('transcript').notEmpty().isString(),
    ],
    async (req, res, next) => {
        try {
            const { transcript } = req.body;

            const result = await aiService.processVoiceCommand(transcript, req.user.id);

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
);

// Extract intent only (for debugging/testing)
router.post('/extract-intent',
    authenticate,
    [
        body('transcript').notEmpty().isString(),
    ],
    async (req, res, next) => {
        try {
            const { transcript } = req.body;

            const intent = await aiService.extractIntent(transcript);

            res.json({
                success: true,
                data: { intent },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Generate AI response
router.post('/generate-response',
    authenticate,
    [
        body('context').notEmpty().isString(),
        body('data').optional().isObject(),
    ],
    async (req, res, next) => {
        try {
            const { context, data } = req.body;

            const response = await aiService.generateVoiceResponse(context, data || {});

            res.json({
                success: true,
                data: { response },
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
