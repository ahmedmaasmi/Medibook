import { OpenRouter } from '@openrouter/sdk';
import config from '../config/index.js';
import { Doctor, User, Availability } from '../models/index.js';
import appointmentService from './appointment.service.js';
import { Op } from 'sequelize';

const openrouter = new OpenRouter({
    apiKey: config.openRouter.apiKey,
});

// Extract appointment intent from voice transcript
export const extractIntent = async (transcript) => {
    const systemPrompt = `You are an AI assistant for a doctor appointment booking system.
Extract the following information from the user's voice input:
- intent: one of "book", "reschedule", "cancel", "check_availability", "list_appointments", or "unknown"
- doctorName: the name of the doctor mentioned (if any)
- date: the date mentioned in YYYY-MM-DD format (if any). Today is ${new Date().toISOString().split('T')[0]}
- time: the time mentioned in HH:MM format (24-hour) (if any)
- reason: the reason for the appointment (if any)

Respond ONLY with a valid JSON object, no other text.
Example: {"intent": "book", "doctorName": "Smith", "date": "2024-01-15", "time": "14:00", "reason": "checkup"}`;

    try {
        const completion = await openrouter.chat.completions.create({
            model: config.openRouter.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: transcript },
            ],
            temperature: 0.1,
            max_tokens: 500,
        });

        const responseText = completion.choices[0]?.message?.content || '';

        // Parse JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return { intent: 'unknown' };
    } catch (error) {
        console.error('AI intent extraction error:', error);
        return { intent: 'unknown', error: error.message };
    }
};

// Find doctor by name (fuzzy search)
export const findDoctor = async (doctorName) => {
    if (!doctorName) return null;

    const doctors = await Doctor.findAll({
        include: [{
            model: User,
            as: 'user',
            where: {
                [Op.or]: [
                    { firstName: { [Op.iLike]: `%${doctorName}%` } },
                    { lastName: { [Op.iLike]: `%${doctorName}%` } },
                ],
            },
            attributes: ['id', 'firstName', 'lastName', 'email'],
        }],
    });

    return doctors.length > 0 ? doctors[0] : null;
};

// Process voice command and execute appropriate action
export const processVoiceCommand = async (transcript, userId) => {
    // Extract intent from transcript
    const intent = await extractIntent(transcript);

    let response = {
        success: false,
        intent: intent.intent,
        message: '',
        data: null,
    };

    switch (intent.intent) {
        case 'book': {
            // Find doctor
            const doctor = await findDoctor(intent.doctorName);
            if (!doctor) {
                response.message = intent.doctorName
                    ? `I couldn't find a doctor named ${intent.doctorName}. Please try again.`
                    : 'Please specify which doctor you would like to see.';
                break;
            }

            // Check if we have date and time
            if (!intent.date || !intent.time) {
                response.message = 'Please specify the date and time for your appointment.';
                response.data = { doctor };
                break;
            }

            // Calculate end time (30 min appointment)
            const endTime = addMinutes(intent.time + ':00', 30);

            // Check availability
            const isAvailable = await appointmentService.checkAvailability(
                doctor.id,
                intent.date,
                intent.time + ':00',
                endTime
            );

            if (!isAvailable) {
                // Get available slots
                const slots = await appointmentService.getAvailableSlots(doctor.id, intent.date);
                response.message = `That time slot is not available. ${slots.length > 0
                    ? `Available times: ${slots.slice(0, 3).map(s => s.startTime.slice(0, 5)).join(', ')}`
                    : 'No slots available on that date.'
                    }`;
                response.data = { slots };
                break;
            }

            // Book the appointment
            const appointment = await appointmentService.bookAppointment({
                clientId: userId,
                doctorId: doctor.id,
                appointmentDate: intent.date,
                startTime: intent.time + ':00',
                endTime,
                reason: intent.reason,
                bookedVia: 'voice',
            });

            response.success = true;
            response.message = `Great! Your appointment with Dr. ${doctor.user.lastName} is confirmed for ${intent.date} at ${intent.time}.`;
            response.data = { appointment };
            break;
        }

        case 'check_availability': {
            const doctor = await findDoctor(intent.doctorName);
            if (!doctor) {
                response.message = 'Please specify which doctor you want to check availability for.';
                break;
            }

            const date = intent.date || new Date().toISOString().split('T')[0];
            const slots = await appointmentService.getAvailableSlots(doctor.id, date);

            response.success = true;
            response.message = slots.length > 0
                ? `Dr. ${doctor.user.lastName} has ${slots.length} available slots on ${date}.`
                : `Dr. ${doctor.user.lastName} has no available slots on ${date}.`;
            response.data = { slots, doctor };
            break;
        }

        case 'list_appointments': {
            const appointments = await appointmentService.getAppointments(userId, 'client', {
                fromDate: new Date().toISOString().split('T')[0],
            });

            response.success = true;
            response.message = appointments.length > 0
                ? `You have ${appointments.length} upcoming appointments.`
                : 'You have no upcoming appointments.';
            response.data = { appointments };
            break;
        }

        case 'cancel': {
            response.message = 'To cancel an appointment, please go to your appointments list.';
            break;
        }

        case 'reschedule': {
            response.message = 'To reschedule an appointment, please go to your appointments list.';
            break;
        }

        default:
            response.message = "I'm sorry, I didn't understand that. You can say things like 'Book an appointment with Dr. Smith tomorrow at 2pm'.";
    }

    return response;
};

// Generate voice response using AI
export const generateVoiceResponse = async (context, data) => {
    try {
        const completion = await openrouter.chat.completions.create({
            model: config.openRouter.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are a friendly medical appointment assistant. Generate a brief, natural spoken response based on the context. Keep responses under 2 sentences.',
                },
                {
                    role: 'user',
                    content: `Context: ${context}\nData: ${JSON.stringify(data)}`,
                },
            ],
            temperature: 0.7,
            max_tokens: 150,
        });

        return completion.choices[0]?.message?.content || context;
    } catch (error) {
        console.error('Voice response generation error:', error);
        return context;
    }
};

// Helper function
function addMinutes(time, minutes) {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}:00`;
}

export default {
    extractIntent,
    findDoctor,
    processVoiceCommand,
    generateVoiceResponse,
};
