import sequelize from '../config/database.js';
import { User, Doctor, Availability } from '../models/index.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const seedDatabase = async () => {
    try {
        console.log('🔄 Starting database seeding...');

        // Connect and sync database
        await sequelize.authenticate();
        console.log('✅ Connected to database.');

        // Clear existing data (optional, but good for a fresh seed)
        // Order matters because of foreign key constraints
        await Availability.destroy({ where: {}, truncate: { cascade: true } });
        await Doctor.destroy({ where: {}, truncate: { cascade: true } });
        await User.destroy({ where: {}, truncate: { cascade: true } });
        console.log('🗑️ Existing data cleared.');

        // Read seed data from JSON
        const seedDataPath = join(__dirname, 'seedData.json');
        const seedData = JSON.parse(readFileSync(seedDataPath, 'utf8'));

        // Seed Users
        const createdUsers = [];
        for (const userData of seedData.users) {
            const user = await User.create(userData);
            createdUsers.push(user);
            console.log(`👤 User created: ${user.email}`);
        }

        // Seed Doctors
        const createdDoctors = [];
        for (const doctorData of seedData.doctors) {
            const user = createdUsers.find(u => u.email === doctorData.userEmail);
            if (user) {
                const { userEmail, ...doctorDetails } = doctorData;
                const doctor = await Doctor.create({
                    ...doctorDetails,
                    userId: user.id
                });
                createdDoctors.push({ doctor, userEmail });
                console.log(`👨‍⚕️ Doctor profile created for: ${userEmail}`);
            }
        }

        // Seed Availabilities
        for (const availData of seedData.availabilities) {
            const doctorInfo = createdDoctors.find(d => d.userEmail === availData.doctorEmail);
            if (doctorInfo) {
                const { doctorEmail, ...availDetails } = availData;
                await Availability.create({
                    ...availDetails,
                    doctorId: doctorInfo.doctor.id
                });
                console.log(`📅 Availability added for: ${doctorEmail} on day ${availData.dayOfWeek}`);
            }
        }

        console.log('✅ Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedDatabase();
