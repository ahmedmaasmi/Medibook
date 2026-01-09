import config from '../../config/index.js';

export const generateEmbedding = async (text) => {
    if (!config.openRouter.apiKey) {
        throw new Error('OPENROUTER_API_KEY is not configured.');
    }

    if (!text || typeof text !== 'string') {
        throw new Error('Text is required for embedding generation.');
    }

    // Clean text: remove newlines and excessive whitespace
    const cleanText = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();

    if (!cleanText) {
        throw new Error('Text is empty after cleanup.');
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${config.openRouter.apiKey}`,
                "HTTP-Referer": "https://medibook.example.com",
                "X-Title": "MediBook AI Assistant",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: config.openRouter.embeddingModel,
                input: cleanText,
                provider: {
                    data_collection: "deny"
                }
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        const data = await response.json();
        
        // OpenRouter/OpenAI response format: { data: [{ embedding: [...] }] }
        if (!data.data || !data.data[0] || !data.data[0].embedding) {
            throw new Error('Invalid response format from embedding API');
        }

        return data.data[0].embedding;
    } catch (error) {
        console.error('Embedding generation error:', error);
        throw error;
    }
};

export default {
    generateEmbedding
};
