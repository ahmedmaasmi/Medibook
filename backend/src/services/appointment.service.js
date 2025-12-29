import { Op } from 'sequelize';
import { Appointment, Doctor, User, Availability } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import calendarService from './calendar.service.js';

// Check if a time slot is available
export const checkAvailability = async (doctorId, date, startTime, endTime) => {
    // Check if doctor exists
    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
        throw new AppError('Doctor not found', 404);
    }

    // Check for existing appointments at the same time
    const existingAppointment = await Appointment.findOne({
        where: {
            doctorId,
            appointmentDate: date,
            status: { [Op.notIn]: ['cancelled'] },
            [Op.or]: [
                {
                    startTime: { [Op.lt]: endTime },
                    endTime: { [Op.gt]: startTime },
                },
            ],
        },
    });

    return !existingAppointment;
};

// Get available slots for a doctor on a specific date
export const getAvailableSlots = async (doctorId, date) => {
    const doctor = await Doctor.findByPk(doctorId, {
        include: [{ model: Availability, as: 'availabilities' }],
    });

    if (!doctor) {
        throw new AppError('Doctor not found', 404);
    }

    const dayOfWeek = new Date(date).getDay();
    const availability = doctor.availabilities.find(
        (a) => a.dayOfWeek === dayOfWeek && a.isActive
    );

    if (!availability) {
        return [];
    }

    // Get existing appointments for the day
    const existingAppointments = await Appointment.findAll({
        where: {
            doctorId,
            appointmentDate: date,
            status: { [Op.notIn]: ['cancelled'] },
        },
    });

    // Generate time slots
    const slots = [];
    const slotDuration = availability.slotDuration;
    let currentTime = availability.startTime;
    const endTime = availability.endTime;

    while (currentTime < endTime) {
        const slotEnd = addMinutes(currentTime, slotDuration);

        // Check if slot is available
        const isBooked = existingAppointments.some((apt) => {
            return (
                apt.startTime < slotEnd && apt.endTime > currentTime
            );
        });

        if (!isBooked && slotEnd <= endTime) {
            slots.push({
                startTime: currentTime,
                endTime: slotEnd,
                available: true,
            });
        }

        currentTime = slotEnd;
    }

    return slots;
};

// Book an appointment
export const bookAppointment = async (appointmentData) => {
    const { clientId, doctorId, appointmentDate, startTime, endTime, reason, bookedVia } = appointmentData;

    // Check availability
    const isAvailable = await checkAvailability(doctorId, appointmentDate, startTime, endTime);
    if (!isAvailable) {
        throw new AppError('This time slot is not available', 400);
    }

    // Create appointment
    const appointment = await Appointment.create({
        clientId,
        doctorId,
        appointmentDate,
        startTime,
        endTime,
        reason,
        bookedVia: bookedVia || 'web',
        status: 'confirmed',
    });

    // Sync with Google Calendar if connected
    const doctor = await Doctor.findByPk(doctorId, {
        include: [{ model: User, as: 'user' }],
    });

    if (doctor.googleCalendarConnected && doctor.googleCalendarToken) {
        try {
            const client = await User.findByPk(clientId);
            const eventId = await calendarService.createCalendarEvent(
                doctor.googleCalendarToken,
                appointment,
                doctor,
                client
            );
            if (eventId) {
                await appointment.update({ googleEventId: eventId });
            }
        } catch (error) {
            console.error('Failed to sync with Google Calendar:', error);
        }
    }

    return appointment;
};

// Get appointments for a user (client or doctor)
export const getAppointments = async (userId, role, filters = {}) => {
    const where = {};

    if (role === 'client') {
        where.clientId = userId;
    } else if (role === 'doctor') {
        const doctor = await Doctor.findOne({ where: { userId } });
        if (!doctor) {
            throw new AppError('Doctor profile not found', 404);
        }
        where.doctorId = doctor.id;
    }

    if (filters.status) {
        where.status = filters.status;
    }

    if (filters.fromDate) {
        where.appointmentDate = { [Op.gte]: filters.fromDate };
    }

    if (filters.toDate) {
        where.appointmentDate = {
            ...where.appointmentDate,
            [Op.lte]: filters.toDate
        };
    }

    const appointments = await Appointment.findAll({
        where,
        include: [
            {
                model: Doctor,
                as: 'doctor',
                include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }]
            },
            {
                model: User,
                as: 'client',
                attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
            },
        ],
        order: [['appointmentDate', 'ASC'], ['startTime', 'ASC']],
    });

    return appointments;
};

// Cancel appointment
export const cancelAppointment = async (appointmentId, userId, role) => {
    const appointment = await Appointment.findByPk(appointmentId);

    if (!appointment) {
        throw new AppError('Appointment not found', 404);
    }

    // Check authorization
    if (role === 'client' && appointment.clientId !== userId) {
        throw new AppError('Not authorized to cancel this appointment', 403);
    }

    if (role === 'doctor') {
        const doctor = await Doctor.findOne({ where: { userId } });
        if (!doctor || appointment.doctorId !== doctor.id) {
            throw new AppError('Not authorized to cancel this appointment', 403);
        }
    }

    await appointment.update({ status: 'cancelled' });

    // Remove from Google Calendar if synced
    if (appointment.googleEventId) {
        const doctor = await Doctor.findByPk(appointment.doctorId);
        if (doctor.googleCalendarToken) {
            try {
                await calendarService.deleteCalendarEvent(
                    doctor.googleCalendarToken,
                    appointment.googleEventId
                );
            } catch (error) {
                console.error('Failed to remove from Google Calendar:', error);
            }
        }
    }

    return appointment;
};

// Reschedule appointment
export const rescheduleAppointment = async (appointmentId, newDate, newStartTime, newEndTime, userId, role) => {
    const appointment = await Appointment.findByPk(appointmentId);

    if (!appointment) {
        throw new AppError('Appointment not found', 404);
    }

    // Check authorization
    if (role === 'client' && appointment.clientId !== userId) {
        throw new AppError('Not authorized to reschedule this appointment', 403);
    }

    // Check new slot availability
    const isAvailable = await checkAvailability(
        appointment.doctorId,
        newDate,
        newStartTime,
        newEndTime
    );

    if (!isAvailable) {
        throw new AppError('New time slot is not available', 400);
    }

    await appointment.update({
        appointmentDate: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
    });

    return appointment;
};

// Helper function to add minutes to time string
function addMinutes(time, minutes) {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}:00`;
}

export default {
    checkAvailability,
    getAvailableSlots,
    bookAppointment,
    getAppointments,
    cancelAppointment,
    rescheduleAppointment,
};
