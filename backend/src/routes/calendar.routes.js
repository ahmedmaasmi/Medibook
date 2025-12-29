import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import calendarService from '../services/calendar.service.js';
import { Doctor } from '../models/index.js';

const router = express.Router();

// Get Google Calendar authorization URL (doctors only)
router.get('/auth-url',
    authenticate,
    authorize('doctor'),
    async (req, res, next) => {
        try {
            const doctor = await Doctor.findOne({ where: { userId: req.user.id } });

            if (!doctor) {
                return res.status(404).json({
                    success: false,
                    message: 'Doctor profile not found',
                });
            }

            const authUrl = calendarService.getAuthUrl(doctor.id);

            res.json({
                success: true,
                data: { authUrl },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Handle OAuth2 callback
router.get('/callback', async (req, res, next) => {
    try {
        const { code, state: doctorId } = req.query;

        if (!code || !doctorId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid callback parameters',
            });
        }

        await calendarService.handleCallback(code, doctorId);

        // Redirect to frontend success page
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/doctor/calendar?connected=true`);
    } catch (error) {
        next(error);
    }
});

// Get calendar connection status
router.get('/status',
    authenticate,
    authorize('doctor'),
    async (req, res, next) => {
        try {
            const doctor = await Doctor.findOne({ where: { userId: req.user.id } });

            if (!doctor) {
                return res.status(404).json({
                    success: false,
                    message: 'Doctor profile not found',
                });
            }

            res.json({
                success: true,
                data: {
                    connected: doctor.googleCalendarConnected,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Disconnect Google Calendar
router.post('/disconnect',
    authenticate,
    authorize('doctor'),
    async (req, res, next) => {
        try {
            const doctor = await Doctor.findOne({ where: { userId: req.user.id } });

            if (!doctor) {
                return res.status(404).json({
                    success: false,
                    message: 'Doctor profile not found',
                });
            }

            await calendarService.disconnect(doctor.id);

            res.json({
                success: true,
                message: 'Google Calendar disconnected successfully',
            });
        } catch (error) {
            next(error);
        }
    }
);

// Get calendar events (for sync verification)
router.get('/events',
    authenticate,
    authorize('doctor'),
    async (req, res, next) => {
        try {
            const doctor = await Doctor.findOne({ where: { userId: req.user.id } });

            if (!doctor || !doctor.googleCalendarConnected) {
                return res.status(400).json({
                    success: false,
                    message: 'Google Calendar not connected',
                });
            }

            const { timeMin, timeMax } = req.query;
            const events = await calendarService.getCalendarEvents(
                doctor.googleCalendarToken,
                timeMin || new Date().toISOString(),
                timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            );

            res.json({
                success: true,
                data: { events },
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
