import { Sequelize } from 'sequelize';
import config from './index.js';

const sequelize = new Sequelize(config.database.url, {
    dialect: 'postgres',
    logging: config.nodeEnv === 'development' ? console.log : false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
});

export const connectDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');

        // Initialize pgvector extension and embeddings table
        try {
            await sequelize.query('CREATE EXTENSION IF NOT EXISTS vector;');
            await sequelize.query(`
                CREATE TABLE IF NOT EXISTS doctor_embeddings (
                    doctor_id UUID PRIMARY KEY,
                    embedding vector(1536),
                    content_hash TEXT,
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
            `);
            console.log('✅ Vector extension and embeddings table initialized.');
        } catch (dbError) {
            console.warn('⚠️  Failed to initialize vector extension or table. You may need superuser permissions or manual setup.', dbError.message);
        }

        // Sync models in development
        if (config.nodeEnv === 'development') {
            await sequelize.sync({ alter: true });
            console.log('✅ Database models synchronized.');
        }
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        process.exit(1);
    }
};

export default sequelize;
