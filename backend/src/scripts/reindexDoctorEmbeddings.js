import { connectDatabase } from '../config/database.js';
import { Doctor } from '../models/index.js';
import { upsertDoctorEmbedding } from '../services/rag/doctorRag.service.js';

const reindexDoctors = async () => {
    try {
        console.log('🔄 Starting doctor embedding reindexing...');
        await connectDatabase();

        const doctors = await Doctor.findAll({ attributes: ['id'] });
        console.log(`Found ${doctors.length} doctors.`);

        let updated = 0;
        let errors = 0;

        for (const doctor of doctors) {
            try {
                const changed = await upsertDoctorEmbedding(doctor.id);
                if (changed) updated++;
            } catch (err) {
                console.error(`❌ Failed to index doctor ${doctor.id}:`, err.message);
                errors++;
            }
        }

        console.log('✅ Reindexing complete.');
        console.log(`Updated: ${updated}`);
        console.log(`Skipped (unchanged): ${doctors.length - updated - errors}`);
        console.log(`Errors: ${errors}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Reindexing failed:', error);
        process.exit(1);
    }
};

reindexDoctors();
