import express from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { Doctor, User, Availability } from '../models/index.js';
import { upsertDoctorEmbedding } from '../services/rag/doctorRag.service.js';

const router = express.Router();

// Get all doctors (public)
router.get('/', async (req, res, next) => {
    try {
        const { specialization } = req.query;

        const where = {};
        if (specialization) {
            where.specialization = specialization;
        }

        const doctors = await Doctor.findAll({
            where,
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName', 'email'],
            }],
        });

        res.json({
            success: true,
            data: { doctors },
        });
    } catch (error) {
        next(error);
    }
});

// Get doctor by ID
router.get('/:id', async (req, res, next) => {
    try {
        const doctor = await Doctor.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'email'],
                },
                {
                    model: Availability,
                    as: 'availabilities',
                },
            ],
        });

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found',
            });
        }

        res.json({
            success: true,
            data: { doctor },
        });
    } catch (error) {
        next(error);
    }
});

// Update doctor profile (doctors only)
router.put('/profile',
    authenticate,
    authorize('doctor'),
    [
        body('specialization').optional().isString(),
        body('bio').optional().isString(),
        body('consultationFee').optional().isNumeric(),
        body('yearsOfExperience').optional().isInt(),
    ],
    async (req, res, next) => {
        try {
            const doctor = await Doctor.findOne({ where: { userId: req.user.id } });

            if (!doctor) {
                return res.status(404).json({
                    success: false,
                    message: 'Doctor profile not found',
                });
            }

            await doctor.update(req.body);

            // Trigger embedding update
            // We don't await this to keep response fast, but logging errors is important.
            upsertDoctorEmbedding(doctor.id).catch(err => {
                console.error(`Background embedding update failed for doctor ${doctor.id}:`, err);
            });

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: { doctor },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Add/update availability (doctors only)
router.post('/availability',
    authenticate,
    authorize('doctor'),
    [
        body('dayOfWeek').isInt({ min: 0, max: 6 }),
        body('startTime').matches(/^\d{2}:\d{2}(:\d{2})?$/),
        body('endTime').matches(/^\d{2}:\d{2}(:\d{2})?$/),
        body('slotDuration').optional().isInt({ min: 15, max: 120 }),
    ],
    async (req, res, next) => {
        try {
            const doctor = await Doctor.findOne({ where: { userId: req.user.id } });

            if (!doctor) {
                return res.status(404).json({
                    success: false,
                    message: 'Doctor profile not found',
                });
            }

            const { dayOfWeek, startTime, endTime, slotDuration } = req.body;

            // Check if availability already exists for this day
            let availability = await Availability.findOne({
                where: { doctorId: doctor.id, dayOfWeek },
            });

            if (availability) {
                await availability.update({ startTime, endTime, slotDuration });
            } else {
                availability = await Availability.create({
                    doctorId: doctor.id,
                    dayOfWeek,
                    startTime,
                    endTime,
                    slotDuration: slotDuration || 30,
                });
            }

            res.json({
                success: true,
                message: 'Availability updated successfully',
                data: { availability },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Get doctor's availability
router.get('/:id/availability', async (req, res, next) => {
    try {
        const availabilities = await Availability.findAll({
            where: { doctorId: req.params.id, isActive: true },
            order: [['dayOfWeek', 'ASC']],
        });

        res.json({
            success: true,
            data: { availabilities },
        });
    } catch (error) {
        next(error);
    }
});

// Delete availability
router.delete('/availability/:id',
    authenticate,
    authorize('doctor'),
    async (req, res, next) => {
        try {
            const doctor = await Doctor.findOne({ where: { userId: req.user.id } });

            const availability = await Availability.findOne({
                where: { id: req.params.id, doctorId: doctor.id },
            });

            if (!availability) {
                return res.status(404).json({
                    success: false,
                    message: 'Availability not found',
                });
            }

            await availability.destroy();

            res.json({
                success: true,
                message: 'Availability deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
