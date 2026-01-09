import crypto from 'crypto';
import sequelize from '../../config/database.js';
import { Doctor, User } from '../../models/index.js';
import { generateEmbedding } from './embeddings.service.js';

/**
 * Build a text representation of the doctor profile for embedding.
 */
export const buildDoctorProfileText = (doctor) => {
    const user = doctor.user || {};
    const parts = [
        `Doctor Name: Dr. ${user.firstName} ${user.lastName}`,
        `Specialization: ${doctor.specialization}`,
        `Bio: ${doctor.bio || 'No bio available.'}`,
        `Experience: ${doctor.yearsOfExperience || 0} years`,
        `Consultation Fee: $${doctor.consultationFee || 0}`,
    ];
    return parts.join('. ');
};

/**
 * Compute SHA256 hash of text to detect changes.
 */
const computeHash = (text) => {
    return crypto.createHash('sha256').update(text).digest('hex');
};

/**
 * Generate (or update) embedding for a single doctor.
 * Skips if content hasn't changed.
 */
export const upsertDoctorEmbedding = async (doctorId) => {
    try {
        const doctor = await Doctor.findByPk(doctorId, {
            include: [{ model: User, as: 'user' }]
        });

        if (!doctor) {
            console.warn(`Doctor ${doctorId} not found for indexing.`);
            return false;
        }

        if (!doctor.user.isActive) {
            // Remove embedding if doctor is inactive? 
            // For now, we just skip updating. Or we could delete. 
            // Let's delete to be safe so they don't show up in search.
            await sequelize.query('DELETE FROM doctor_embeddings WHERE doctor_id = :id', {
                replacements: { id: doctorId }
            });
            return true;
        }

        const text = buildDoctorProfileText(doctor);
        const newHash = computeHash(text);

        // Check existing
        const [existing] = await sequelize.query(
            'SELECT content_hash FROM doctor_embeddings WHERE doctor_id = :id',
            {
                replacements: { id: doctorId },
                type: sequelize.QueryTypes.SELECT
            }
        );

        if (existing && existing.content_hash === newHash) {
            // No change
            return false;
        }

        // Generate embedding
        console.log(`Generating embedding for Dr. ${doctor.user.lastName}...`);
        const embedding = await generateEmbedding(text);
        
        // Format embedding for pgvector: string "[0.1, 0.2, ...]"
        const embeddingVector = JSON.stringify(embedding);

        // Upsert
        await sequelize.query(`
            INSERT INTO doctor_embeddings (doctor_id, embedding, content_hash, updated_at)
            VALUES (:id, :embedding, :hash, NOW())
            ON CONFLICT (doctor_id) 
            DO UPDATE SET 
                embedding = EXCLUDED.embedding,
                content_hash = EXCLUDED.content_hash,
                updated_at = NOW();
        `, {
            replacements: {
                id: doctorId,
                embedding: embeddingVector,
                hash: newHash
            }
        });

        console.log(`Updated embedding for Dr. ${doctor.user.lastName}`);
        return true;

    } catch (error) {
        console.error(`Error indexing doctor ${doctorId}:`, error);
        throw error;
    }
};

/**
 * Search doctors using vector similarity.
 * @param {string} queryText - Patient symptom/query
 * @param {object} options - { limit: 5, filterSpecialty: string }
 */
export const searchDoctorsByCase = async (queryText, options = {}) => {
    const { limit = 5, filterSpecialty } = options;

    const queryEmbedding = await generateEmbedding(queryText);
    const vectorStr = JSON.stringify(queryEmbedding);

    // SQL to find nearest neighbors
    // We join with Doctors and Users to return full objects and filter by active status/specialty
    // Note: <-> is the Euclidean distance operator in pgvector. Order by distance ASC = most similar.
    // Cosine distance is <=>
    
    // We'll use cosine distance (<=>) as it's standard for OpenAI embeddings.
    
    let whereClause = `u."isActive" = true`;
    const replacements = { vector: vectorStr, limit };

    if (filterSpecialty) {
        whereClause += ` AND d."specialization" ILIKE :specialty`;
        replacements.specialty = filterSpecialty;
    }

    const sql = `
        SELECT 
            d.id, 
            d."userId", 
            d.specialization, 
            d.bio, 
            d."consultationFee", 
            d."yearsOfExperience",
            u."firstName", 
            u."lastName",
            u.email,
            (de.embedding <=> :vector) as distance
        FROM doctor_embeddings de
        JOIN "Doctors" d ON de.doctor_id = d.id
        JOIN "Users" u ON d."userId" = u.id
        WHERE ${whereClause}
        ORDER BY distance ASC
        LIMIT :limit;
    `;

    const results = await sequelize.query(sql, {
        replacements,
        type: sequelize.QueryTypes.SELECT
    });

    return results;
};

export default {
    upsertDoctorEmbedding,
    searchDoctorsByCase
};
