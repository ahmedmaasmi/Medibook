import authRoutes from './auth.routes.js';
import appointmentRoutes from './appointment.routes.js';
import doctorRoutes from './doctor.routes.js';
import voiceRoutes from './voice.routes.js';
import calendarRoutes from './calendar.routes.js';
import chatRoutes from './chat.routes.js';
import aiRoutes from './ai.routes.js';

export const setupRoutes = (app) => {
    app.use('/api/auth', authRoutes);
    app.use('/api/appointments', appointmentRoutes);
    app.use('/api/doctors', doctorRoutes);
    app.use('/api/voice', voiceRoutes);
    app.use('/api/calendar', calendarRoutes);
    app.use('/api/chat', chatRoutes);
    app.use('/api/ai', aiRoutes);

    // Health check
    app.get('/api/health', (req, res) => {
        res.json({
            success: true,
            message: 'Doctor Appointment API is running',
            timestamp: new Date().toISOString(),
        });
    });
};

export default setupRoutes;
