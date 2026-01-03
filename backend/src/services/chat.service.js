import aiService from './ai.service.js';
import symptomAnalyzer from './symptomAnalyzer.service.js';
import { Doctor, User } from '../models/index.js';

/**
 * Main orchestration for chat messages
 */
export const processChatMessage = async ({ message, userId, onToken = null }) => {
    // 1. Extract intent using existing logic
    const intent = await aiService.extractIntent(message);
    
    // Default response structure
    let response = {
        success: true,
        bot_message: '',
        suggested_specialty: null,
        doctors: [],
        intent: intent.intent
    };

    // 2. Handle based on intent
    if (intent.intent === 'check_symptoms' || (intent.intent === 'unknown' && message.length > 10)) {
        // Run deep symptom analysis
        const analysis = await symptomAnalyzer.analyzeSymptom({ message, userId });
        
        const CONFIDENCE_THRESHOLD = 0.7;
        
        if (analysis.confidence < CONFIDENCE_THRESHOLD || analysis.specialty === 'Unknown') {
            response.bot_message = "I couldn't quite determine the specific medical concern. Could you describe your symptoms in a bit more detail? For example, where is the pain, how long has it lasted, and are there any other symptoms?";
            if (onToken) onToken(response.bot_message);
        } else {
            // Found a specialty!
            response.suggested_specialty = analysis.specialty;
            
            // Find doctors for this specialty
            const doctors = await Doctor.findAll({
                where: { specialization: analysis.specialty },
                include: [{
                    model: User,
                    as: 'user',
                    where: { isActive: true },
                    attributes: ['id', 'firstName', 'lastName', 'email']
                }],
                limit: 5
            });
            
            response.doctors = doctors;
            response.bot_message = `Based on your symptoms, it sounds like you might benefit from seeing a ${analysis.specialty} specialist. I found ${doctors.length} available doctor${doctors.length === 1 ? '' : 's'} for you. Would you like to see their availability?`;
            
            if (onToken) {
                // Stream the message in chunks to simulate typing
                const words = response.bot_message.split(' ');
                for (let i = 0; i < words.length; i++) {
                    onToken(words[i] + (i === words.length - 1 ? '' : ' '));
                    // Small delay to make it feel natural
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }
        }
        
        return response;
    }

    // 3. Fallback to existing voice command logic for other intents (book, cancel, etc.)
    // Note: processVoiceCommand expects transcript, userId, and optional onToken
    const voiceResult = await aiService.processVoiceCommand(message, userId, onToken);
    
    return {
        ...voiceResult,
        bot_message: voiceResult.message, // Map to our standard key
    };
};

export default {
    processChatMessage
};
