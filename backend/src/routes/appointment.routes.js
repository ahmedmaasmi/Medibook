import express from 'express';
import { body, query } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import appointmentService from '../services/appointment.service.js';
import { Doctor } from '../models/index.js';

const router = express.Router();

// Get available slots for a doctor on a specific date
router.get('/slots/:doctorId',
    authenticate,
    async (req, res, next) => {
        try {
            const { doctorId } = req.params;
            const { date } = req.query;

            if (!date) {
                return res.status(400).json({
                    success: false,
                    message: 'Date parameter is required',
                });
            }

            const slots = await appointmentService.getAvailableSlots(doctorId, date);
            res.json({
                success: true,
                data: { slots },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Book an appointment (clients only)
router.post('/',
    authenticate,
    authorize('client'),
    [
        body('doctorId').isUUID(),
        body('appointmentDate').isDate(),
        body('startTime').matches(/^\d{2}:\d{2}(:\d{2})?$/),
        body('endTime').matches(/^\d{2}:\d{2}(:\d{2})?$/),
        body('reason').optional().isString(),
    ],
    async (req, res, next) => {
        try {
            const appointment = await appointmentService.bookAppointment({
                ...req.body,
                clientId: req.user.id,
            });

            res.status(201).json({
                success: true,
                message: 'Appointment booked successfully',
                data: { appointment },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Get user's appointments
router.get('/',
    authenticate,
    async (req, res, next) => {
        try {
            const { status, fromDate, toDate } = req.query;

            const appointments = await appointmentService.getAppointments(
                req.user.id,
                req.user.role,
                { status, fromDate, toDate }
            );

            res.json({
                success: true,
                data: { appointments },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Cancel appointment
router.patch('/:id/cancel',
    authenticate,
    async (req, res, next) => {
        try {
            const appointment = await appointmentService.cancelAppointment(
                req.params.id,
                req.user.id,
                req.user.role
            );

            res.json({
                success: true,
                message: 'Appointment cancelled successfully',
                data: { appointment },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Reschedule appointment
router.patch('/:id/reschedule',
    authenticate,
    [
        body('appointmentDate').isDate(),
        body('startTime').matches(/^\d{2}:\d{2}(:\d{2})?$/),
        body('endTime').matches(/^\d{2}:\d{2}(:\d{2})?$/),
    ],
    async (req, res, next) => {
        try {
            const { appointmentDate, startTime, endTime } = req.body;

            const appointment = await appointmentService.rescheduleAppointment(
                req.params.id,
                appointmentDate,
                startTime,
                endTime,
                req.user.id,
                req.user.role
            );

            res.json({
                success: true,
                message: 'Appointment rescheduled successfully',
                data: { appointment },
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
