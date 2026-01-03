import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import symptomAnalyzer from '../services/symptomAnalyzer.service.js';
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
 * POST /api/ai/analyze-symptom
 * Internal/Debug endpoint for testing symptom analysis
 */
router.post('/analyze-symptom',
    authenticate,
    aiRateLimit({ max: 20 }),
    [
        body('message').notEmpty().isString().trim().isLength({ max: 500 }),
    ],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { message } = req.body;
            const userId = req.user.id;

            const result = await symptomAnalyzer.analyzeSymptom({ 
                message, 
                userId 
            });

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
