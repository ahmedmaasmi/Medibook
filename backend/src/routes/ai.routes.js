import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { authenticate } from '../middleware/auth.js';
import symptomAnalyzer from '../services/symptomAnalyzer.service.js';
import aiService from '../services/ai.service.js';
import doctorMatchingService from '../services/doctorMatching.service.js';
import appointmentService from '../services/appointment.service.js';
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

/**
 * POST /api/ai/process
 * Process voice commands
 */
router.post('/process',
    authenticate,
    [
        body('transcript').notEmpty().isString(),
        body('stream').optional().isBoolean(),
    ],
    async (req, res, next) => {
        try {
            const { transcript, stream } = req.body;

            if (stream) {
                // Set headers for streaming
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');

                const onToken = (token) => {
                    res.write(`data: ${JSON.stringify({ token })}\n\n`);
                };

                const result = await aiService.processVoiceCommand(transcript, req.user.id, onToken);
                
                res.write(`data: ${JSON.stringify({ final: true, ...result })}\n\n`);
                res.end();
            } else {
                const result = await aiService.processVoiceCommand(transcript, req.user.id);

                res.json({
                    success: true,
                    data: result,
                });
            }
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/ai/extract-intent
 */
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

/**
 * POST /api/ai/generate-response
 */
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

/**
 * POST /api/ai/recommend-doctor
 * RAG-based doctor recommendation and appointment proposal.
 */
router.post('/recommend-doctor',
    authenticate,
    aiRateLimit({ max: 20 }),
    [
        body('message').notEmpty().isString().trim(),
        body('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
        body('time').optional().matches(/^\d{2}:\d{2}$/),
    ],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { message, date, time } = req.body;
            const userId = req.user.id;

            const result = await doctorMatchingService.recommendDoctor({
                message,
                userId,
                date,
                time
            });

            // Generate proposal token
            const payload = {
                userId,
                doctorId: result.recommendedDoctor.id,
                reason: message, // or sanitized symptom
                // If specific slot proposed and available, include it
                appointmentDate: (date && result.availability?.isAvailable) ? date : undefined,
                startTime: (time && result.availability?.isAvailable) ? time + ':00' : undefined,
                endTime: (time && result.availability?.isAvailable) ? addMinutes(time + ':00', 30) : undefined,
                type: 'appointment_proposal'
            };

            const token = jwt.sign(payload, config.jwt.secret, { expiresIn: '15m' });

            res.json({
                success: true,
                data: {
                    ...result,
                    proposalToken: token
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/ai/confirm-booking
 * Confirm and book an appointment from a proposal.
 */
router.post('/confirm-booking',
    authenticate,
    [
        body('proposalToken').notEmpty().isString(),
        body('confirm').equals('true'),
        body('selectedSlot').optional().isObject(), // { date, startTime } if not in token
    ],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { proposalToken, selectedSlot } = req.body;
            const userId = req.user.id;

            // Verify token
            let decoded;
            try {
                decoded = jwt.verify(proposalToken, config.jwt.secret);
            } catch (err) {
                return res.status(400).json({ success: false, message: 'Invalid or expired proposal token.' });
            }

            if (decoded.type !== 'appointment_proposal' || decoded.userId !== userId) {
                return res.status(403).json({ success: false, message: 'Invalid proposal token.' });
            }

            // Determine final booking details
            const doctorId = decoded.doctorId;
            const reason = decoded.reason;
            let date = decoded.appointmentDate;
            let startTime = decoded.startTime;
            let endTime = decoded.endTime;

            // If not in token, check selectedSlot
            if (!date || !startTime) {
                if (!selectedSlot || !selectedSlot.date || !selectedSlot.startTime) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Date and time are required to confirm booking.' 
                    });
                }
                date = selectedSlot.date;
                startTime = selectedSlot.startTime;
                // Calculate end time
                endTime = addMinutes(startTime, 30);
            }

            // Attempt booking
            const appointment = await appointmentService.bookAppointment({
                clientId: userId,
                doctorId,
                appointmentDate: date,
                startTime,
                endTime,
                reason,
                bookedVia: 'ai_rag'
            });

            res.json({
                success: true,
                message: 'Appointment confirmed successfully.',
                data: { appointment }
            });

        } catch (error) {
            next(error);
        }
    }
);

// Helper to add minutes (duplicated, should be util)
function addMinutes(time, minutes) {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}:00`;
}

export default router;
