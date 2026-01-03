import { Doctor, User } from '../models/index.js';
import { callOpenRouter } from './ai.service.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Sanitizes input string to remove control characters and limit length
 */
const sanitizeInput = (text) => {
    if (!text) return '';
    // Remove control characters and limit to 500 characters
    return text.replace(/[\x00-\x1F\x7F]/g, "").substring(0, 500);
};

/**
 * Gets all unique specializations from active doctors
 */
const getAvailableSpecialties = async () => {
    const doctors = await Doctor.findAll({
        attributes: ['specialization'],
        include: [{
            model: User,
            as: 'user',
            where: { isActive: true },
            attributes: []
        }],
        raw: true
    });
    
    const specialties = [...new Set(doctors.map(d => d.specialization))];
    return specialties;
};

/**
 * Analyzes symptoms using AI and maps to a specialty
 */
export const analyzeSymptom = async ({ message, userId }) => {
    const sanitizedMessage = sanitizeInput(message);
    const specialties = await getAvailableSpecialties();
    
    const systemPrompt = `You are a medical symptom analyzer. Your goal is to extract the primary symptom, normalize it, and classify it into one of the available medical specialties.

Available Specialties:
${specialties.length > 0 ? specialties.join(', ') : 'General Practice'}

Rules:
1. Respond ONLY with a valid JSON object.
2. No markdown, no explanations, no other text.
3. If the message is not medical or unrelated, return "Unknown" for specialty and low confidence.
4. If symptoms are ambiguous, return your best guess with lower confidence.
5. If the correct specialty is not in the list, suggest "General Practice" or the closest match from the list.

Expected JSON format:
{
  "symptom": "original primary symptom",
  "normalized_symptom": "standard medical name",
  "specialty": "one of the available specialties or General Practice",
  "confidence": 0.95
}`;

    try {
        const response = await callOpenRouter([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: sanitizedMessage },
        ], { 
            temperature: 0.1, 
            response_format: { type: "json_object" } 
        });

        const data = await response.json();
        const responseText = data.choices[0]?.message?.content || '';
        
        let result;
        try {
            // Try to parse JSON from the response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            result = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
        } catch (e) {
            console.error('Failed to parse AI response as JSON:', responseText);
            throw new AppError('AI response format error', 500);
        }

        // Validate required fields
        const requiredFields = ['symptom', 'normalized_symptom', 'specialty', 'confidence'];
        for (const field of requiredFields) {
            if (result[field] === undefined) {
                throw new AppError(`AI response missing field: ${field}`, 500);
            }
        }

        // Final normalization
        result.confidence = parseFloat(result.confidence);
        if (isNaN(result.confidence)) result.confidence = 0;

        return result;
    } catch (error) {
        console.error('Symptom analysis error:', error);
        if (error instanceof AppError) throw error;
        throw new AppError('Failed to analyze symptoms', 500);
    }
};

export default {
    analyzeSymptom
};
