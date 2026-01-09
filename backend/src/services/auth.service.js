import { User, Doctor } from '../models/index.js';
import { generateToken } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const register = async (userData) => {
    const { email, password, firstName, lastName, phone, role } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        throw new AppError('User with this email already exists', 400);
    }

    // Create user
    const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        phone,
        role: role || 'client',
    });

    // If registering as doctor, create doctor profile
    if (role === 'doctor' && userData.doctorInfo) {
        await Doctor.create({
            userId: user.id,
            specialization: userData.doctorInfo.specialization,
            licenseNumber: userData.doctorInfo.licenseNumber,
            bio: userData.doctorInfo.bio,
            consultationFee: userData.doctorInfo.consultationFee,
            yearsOfExperience: userData.doctorInfo.yearsOfExperience,
        });
    }

    const token = generateToken(user.id);

    return {
        user: user.toJSON(),
        token,
    };
};

export const login = async (email, password) => {
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
    }

    // Check if user is active
    if (!user.isActive) {
        throw new AppError('Account is deactivated', 401);
    }

    const token = generateToken(user.id);

    // Get doctor profile if applicable
    let doctorProfile = null;
    if (user.role === 'doctor') {
        doctorProfile = await Doctor.findOne({ where: { userId: user.id } });
    }

    return {
        user: user.toJSON(),
        doctorProfile,
        token,
    };
};

export const getProfile = async (userId) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    let doctorProfile = null;
    if (user.role === 'doctor') {
        doctorProfile = await Doctor.findOne({ where: { userId: user.id } });
    }

    return {
        user: user.toJSON(),
        doctorProfile,
    };
};

export const refreshToken = async (userId) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Check if user is active
    if (!user.isActive) {
        throw new AppError('Account is deactivated', 401);
    }

    const token = generateToken(user.id);

    // Get doctor profile if applicable
    let doctorProfile = null;
    if (user.role === 'doctor') {
        doctorProfile = await Doctor.findOne({ where: { userId: user.id } });
    }

    return {
        user: user.toJSON(),
        doctorProfile,
        token,
    };
};

export default { register, login, getProfile, refreshToken };
