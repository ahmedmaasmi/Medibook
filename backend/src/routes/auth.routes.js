import express from 'express';
import { body, validationResult } from 'express-validator';
import authService from '../services/auth.service.js';
import { authenticate } from '../middleware/auth.js';

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

// Register
router.post('/register',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 6 }),
        body('firstName').notEmpty().trim(),
        body('lastName').notEmpty().trim(),
        body('role').optional().isIn(['client', 'doctor']),
    ],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const result = await authService.register(req.body);
            res.status(201).json({
                success: true,
                message: 'Registration successful',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
);

// Login
router.post('/login',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty(),
    ],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);
            res.json({
                success: true,
                message: 'Login successful',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
);

// Get current user profile
router.get('/me', authenticate, async (req, res, next) => {
    try {
        const result = await authService.getProfile(req.user.id);
        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
});

// Verify token
router.get('/verify', authenticate, (req, res) => {
    res.json({
        success: true,
        message: 'Token is valid',
        data: { user: req.user.toJSON() },
    });
});

export default router;
