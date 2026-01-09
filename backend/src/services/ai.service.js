import config from '../config/index.js';
import { Doctor, User, Availability } from '../models/index.js';
import appointmentService from './appointment.service.js';
import { Op } from 'sequelize';

// Helper for OpenRouter API calls using fetch following the requested template
export const callOpenRouter = async (messages, options = {}) => {
    if (!config.openRouter.apiKey) {
        throw new Error('OPENROUTER_API_KEY is not configured. Please set it in your environment variables.');
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${config.openRouter.apiKey}`,
            "HTTP-Referer": "https://medibook.example.com", // Optional site URL
            "X-Title": "MediBook AI Assistant", // Optional site title
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: config.openRouter.model,
            messages,
            ...options
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw new Error(error.error?.message || 'OpenRouter API error');
    }

    return response;
};

// Extract appointment intent from voice transcript
export const extractIntent = async (transcript) => {
    const today = new Date().toISOString().split('T')[0];
    const systemPrompt = `You are an AI assistant for a doctor appointment booking system.
Extract the following information from the user's voice input:
- intent: one of "book", "reschedule", "cancel", "check_availability", "list_appointments", "check_symptoms", or "unknown"
- doctorName: the name of the doctor mentioned (if any)
- date: the date mentioned in YYYY-MM-DD format (if any). Today is ${today}. If no specific date is mentioned but time is mentioned, set date to null and the system will handle finding the next available date.
- time: the time mentioned in HH:MM format (24-hour) (if any). Be flexible with time formats (2pm, 14:00, 2 PM, etc.)
- reason: the reason for the appointment or symptoms described (if any)

IMPORTANT: If user mentions a time (like "2pm", "3:00", "at 4", etc.) but no specific date, still extract the time and set intent to "book" if they want to book an appointment.

Respond ONLY with a valid JSON object, no other text.
Example: {"intent": "book", "doctorName": "Smith", "date": "2024-01-15", "time": "14:00", "reason": "checkup"}
Example: {"intent": "book", "doctorName": null, "date": null, "time": "15:00", "reason": "headache"}`;

    try {
        const response = await callOpenRouter([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: transcript },
        ], { temperature: 0.1, max_tokens: 500 });

        const data = await response.json();
        const responseText = data.choices[0]?.message?.content || '';

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
export const processVoiceCommand = async (transcript, userId, onToken = null) => {
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
                if (onToken) onToken(response.message);
                break;
            }

            // Handle booking logic
            let appointmentDate, startTime, endTime;

            if (intent.date && intent.time) {
                // Both date and time provided - use them directly
                appointmentDate = intent.date;
                startTime = intent.time + ':00';
                endTime = addMinutes(startTime, 30);

                // Check availability
                const isAvailable = await appointmentService.checkAvailability(
                    doctor.id,
                    appointmentDate,
                    startTime,
                    endTime
                );

                if (!isAvailable) {
                    // Get available slots
                    const slots = await appointmentService.getAvailableSlots(doctor.id, appointmentDate);
                    response.message = `That time slot is not available. ${slots.length > 0
                        ? `Available times: ${slots.slice(0, 3).map(s => s.startTime.slice(0, 5)).join(', ')}`
                        : 'No slots available on that date.'
                        }`;
                    response.data = { slots };
                    if (onToken) onToken(response.message);
                    break;
                }
            } else if (intent.time) {
                // Only time provided - find next available slot
                const nextSlot = await findNextAvailableSlot(doctor.id, intent.time + ':00');

                if (!nextSlot) {
                    response.message = `I couldn't find any available slots near ${intent.time} for Dr. ${doctor.user.lastName} in the next week. Please try a different time or contact the doctor directly.`;
                    if (onToken) onToken(response.message);
                    break;
                }

                appointmentDate = nextSlot.date;
                startTime = nextSlot.startTime;
                endTime = nextSlot.endTime;

                // Inform user about the slot we found
                const timeDiff = nextSlot.minutesDiff || 0;
                const timeMessage = timeDiff === 0
                    ? `at your preferred time ${intent.time}`
                    : `at ${nextSlot.startTime.slice(0, 5)} (closest to your preferred time ${intent.time})`;
            } else {
                // No time provided - ask for it
                response.message = 'Please specify the time for your appointment.';
                response.data = { doctor };
                if (onToken) onToken(response.message);
                break;
            }

            // Book the appointment
            const appointment = await appointmentService.bookAppointment({
                clientId: userId,
                doctorId: doctor.id,
                appointmentDate,
                startTime,
                endTime,
                reason: intent.reason,
                bookedVia: 'voice',
            });

            response.success = true;
            const formattedTime = startTime.slice(0, 5);
            response.message = `Great! Your appointment with Dr. ${doctor.user.lastName} is confirmed for ${appointmentDate} at ${formattedTime}.`;
            response.data = { appointment };
            if (onToken) onToken(response.message);
            break;
        }

        case 'check_availability': {
            const doctor = await findDoctor(intent.doctorName);
            if (!doctor) {
                response.message = 'Please specify which doctor you want to check availability for.';
                if (onToken) onToken(response.message);
                break;
            }

            const date = intent.date || new Date().toISOString().split('T')[0];
            const slots = await appointmentService.getAvailableSlots(doctor.id, date);

            response.success = true;
            response.message = slots.length > 0
                ? `Dr. ${doctor.user.lastName} has ${slots.length} available slots on ${date}.`
                : `Dr. ${doctor.user.lastName} has no available slots on ${date}.`;
            response.data = { slots, doctor };
            if (onToken) onToken(response.message);
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
            if (onToken) onToken(response.message);
            break;
        }

        case 'check_symptoms': {
            // For now, provide a general AI response for symptoms
            const context = `The user is describing these symptoms: ${intent.reason || transcript}. Provide a brief assessment and recommend a specialization if appropriate.`;
            if (onToken) {
                await streamVoiceResponse(context, {}, onToken);
                response.success = true;
                // We don't set response.message here as it's been streamed
            } else {
                const aiResponse = await generateVoiceResponse(context, {});
                response.success = true;
                response.message = aiResponse;
            }
            break;
        }

        case 'cancel': {
            response.message = 'To cancel an appointment, please go to your appointments list.';
            if (onToken) onToken(response.message);
            break;
        }

        case 'reschedule': {
            response.message = 'To reschedule an appointment, please go to your appointments list.';
            if (onToken) onToken(response.message);
            break;
        }

        default:
            response.message = "I'm sorry, I didn't understand that. You can say things like 'Book an appointment with Dr. Smith tomorrow at 2pm'.";
            if (onToken) onToken(response.message);
    }

    return response;
};

// Generate voice response using AI
export const generateVoiceResponse = async (context, data) => {
    try {
        const response = await callOpenRouter([
            {
                role: 'system',
                content: 'You are a friendly medical appointment assistant. Generate a brief, natural spoken response based on the context. Keep responses under 2 sentences.',
            },
            {
                role: 'user',
                content: `Context: ${context}\nData: ${JSON.stringify(data)}`,
            },
        ], { temperature: 0.7, max_tokens: 150 });

        const result = await response.json();
        return result.choices[0]?.message?.content || context;
    } catch (error) {
        console.error('Voice response generation error:', error);
        return context;
    }
};

// Find next available date and time slot for a doctor
export const findNextAvailableSlot = async (doctorId, preferredTime, maxDaysAhead = 7) => {
    const today = new Date();

    for (let daysAhead = 0; daysAhead < maxDaysAhead; daysAhead++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + daysAhead);
        const dateString = checkDate.toISOString().split('T')[0];

        // Skip weekends if doctor doesn't work weekends (we'll check availability)
        const availableSlots = await appointmentService.getAvailableSlots(doctorId, dateString);

        if (availableSlots.length === 0) continue;

        // Find the closest available slot to the preferred time
        const preferredTimeMinutes = timeToMinutes(preferredTime);

        // Sort slots by proximity to preferred time
        const sortedSlots = availableSlots
            .map(slot => ({
                ...slot,
                minutesDiff: Math.abs(timeToMinutes(slot.startTime) - preferredTimeMinutes)
            }))
            .sort((a, b) => a.minutesDiff - b.minutesDiff);

        // Return the closest slot (within 2 hours)
        const bestSlot = sortedSlots.find(slot => slot.minutesDiff <= 120); // 2 hours = 120 minutes
        if (bestSlot) {
            return {
                date: dateString,
                startTime: bestSlot.startTime,
                endTime: bestSlot.endTime,
                originalPreferredTime: preferredTime
            };
        }

        // If no slot within 2 hours, take the earliest available slot
        return {
            date: dateString,
            startTime: sortedSlots[0].startTime,
            endTime: sortedSlots[0].endTime,
            originalPreferredTime: preferredTime
        };
    }

    return null; // No available slots found
};

// Helper function to convert time string to minutes
function timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

// Helper function to add minutes to time string
function addMinutes(time, minutes) {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}:00`;
}

// Generate streaming voice response using AI
export const streamVoiceResponse = async (context, data, onToken) => {
    try {
        const response = await callOpenRouter([
            {
                role: 'system',
                content: 'You are a friendly medical appointment assistant. Generate a brief, natural spoken response based on the context. Keep responses under 3 sentences.',
            },
            {
                role: 'user',
                content: `Context: ${context}\nData: ${JSON.stringify(data)}`,
            },
        ], {
            temperature: 0.7,
            max_tokens: 500,
            stream: true,
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;

                if (trimmedLine.startsWith('data: ')) {
                    try {
                        const json = JSON.parse(trimmedLine.slice(6));
                        const token = json.choices[0]?.delta?.content || '';
                        if (token) {
                            onToken(token);
                        }
                    } catch (e) {
                        // Partial JSON or other error
                    }
                }
            }
        }
    } catch (error) {
        console.error('Voice response streaming error:', error);
        throw error;
    }
};

export default {
    extractIntent,
    findDoctor,
    findNextAvailableSlot,
    processVoiceCommand,
    generateVoiceResponse,
    streamVoiceResponse,
};
