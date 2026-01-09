import symptomAnalyzer from './symptomAnalyzer.service.js';
import doctorRagService from './rag/doctorRag.service.js';
import appointmentService from './appointment.service.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Recommend a doctor based on patient case description.
 */
export const recommendDoctor = async ({ message, userId, date, time }) => {
    // 1. Analyze symptoms to get specialty
    const analysis = await symptomAnalyzer.analyzeSymptom({ message, userId });
    const { specialty, confidence } = analysis;

    console.log(`Symptom analysis: ${specialty} (confidence: ${confidence})`);

    // 2. Search doctors using RAG
    // If confidence is high (> 0.7), filter by specialty. 
    // Otherwise search globally but maybe boost specialty matches?
    // For simplicity, strict filter if confidence is high, broad search if not.
    // However, user might describe "back pain" (Orthopedics) but RAG might match a general practitioner description better if Orthopedics is missing.
    // Let's pass specialty as a filter only if it's not "General Practice" or "Unknown".
    
    let filterSpecialty = null;
    if (confidence > 0.6 && specialty !== 'General Practice' && specialty !== 'Unknown') {
        filterSpecialty = specialty;
    }

    let candidates = await doctorRagService.searchDoctorsByCase(message, { 
        limit: 5, 
        filterSpecialty 
    });

    // Fallback: If strict filtering yielded no results, try broad search
    if (candidates.length === 0 && filterSpecialty) {
        console.log('No doctors found with strict specialty filter. Falling back to broad search.');
        candidates = await doctorRagService.searchDoctorsByCase(message, { limit: 5 });
    }

    if (candidates.length === 0) {
        throw new AppError('No suitable doctors found.', 404);
    }

    // Map raw DB results to clean objects
    const formattedCandidates = candidates.map(c => ({
        id: c.id,
        specialization: c.specialization,
        bio: c.bio,
        consultationFee: c.consultationFee,
        yearsOfExperience: c.yearsOfExperience,
        user: {
            id: c.userId,
            firstName: c.firstName,
            lastName: c.lastName,
            email: c.email
        },
        matchScore: (1 - (c.distance || 0)).toFixed(2) // Convert distance to similarity score approx
    }));

    const bestDoctor = formattedCandidates[0];
    const alternatives = formattedCandidates.slice(1);

    // 3. Check availability if date/time provided
    let availabilityInfo = {};

    if (date) {
        if (time) {
            // Check specific slot
            const endTime = addMinutes(time + ':00', 30); // Default 30 min
            const isAvailable = await appointmentService.checkAvailability(
                bestDoctor.id, 
                date, 
                time + ':00', 
                endTime
            );
            availabilityInfo = { isAvailable, proposedTime: time, proposedDate: date };
        } else {
            // Get available slots for that date
            const slots = await appointmentService.getAvailableSlots(bestDoctor.id, date);
            availabilityInfo = { slots: slots.slice(0, 5) }; // Return top 5 slots
        }
    } else {
        // No date provided, maybe just return general info or next available (not implemented yet for "next available")
        // We'll leave slots empty, frontend will ask for date.
    }

    return {
        recommendedDoctor: bestDoctor,
        alternatives,
        analysis: {
            symptom: analysis.symptom,
            specialty: analysis.specialty,
            confidence: analysis.confidence
        },
        availability: availabilityInfo
    };
};

// Helper to add minutes (duplicated from appointment.service.js, could be util)
function addMinutes(time, minutes) {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}:00`;
}

export default {
    recommendDoctor
};
