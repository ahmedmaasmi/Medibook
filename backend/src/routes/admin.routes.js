import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { User, Doctor, Appointment } from '../models/index.js';

const router = express.Router();

// Middleware to ensure admin access
router.use(authenticate, authorize('admin'));

// Get dashboard stats
router.get('/stats', async (req, res, next) => {
    try {
        const totalUsers = await User.count();
        const totalDoctors = await Doctor.count();
        const totalAppointments = await Appointment.count();
        const pendingAppointments = await Appointment.count({ where: { status: 'pending' } });

        res.json({
            success: true,
            data: {
                totalUsers,
                totalDoctors,
                totalAppointments,
                pendingAppointments
            }
        });
    } catch (error) {
        next(error);
    }
});

// Get all users with pagination
router.get('/users', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await User.findAndCountAll({
            attributes: { exclude: ['password'] },
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: {
                users: rows,
                pagination: {
                    total: count,
                    page,
                    pages: Math.ceil(count / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

// Update user role or status
router.patch('/users/:id', async (req, res, next) => {
    try {
        const { role, isActive } = req.body;
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (role) user.role = role;
        if (typeof isActive === 'boolean') user.isActive = isActive;

        await user.save();

        res.json({
            success: true,
            data: { user: user.toJSON() }
        });
    } catch (error) {
        next(error);
    }
});

// Get all appointments
router.get('/appointments', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await Appointment.findAndCountAll({
            include: [
                { model: User, as: 'client', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Doctor, as: 'doctor', include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }] }
            ],
            limit,
            offset,
            order: [['appointmentDate', 'DESC']]
        });

        res.json({
            success: true,
            data: {
                appointments: rows,
                pagination: {
                    total: count,
                    page,
                    pages: Math.ceil(count / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

export default router;
