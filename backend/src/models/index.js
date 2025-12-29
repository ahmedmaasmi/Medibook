import User from './User.js';
import Doctor from './Doctor.js';
import Availability from './Availability.js';
import Appointment from './Appointment.js';

// User - Doctor relationship (1:1)
User.hasOne(Doctor, { foreignKey: 'userId', as: 'doctorProfile' });
Doctor.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Doctor - Availability relationship (1:M)
Doctor.hasMany(Availability, { foreignKey: 'doctorId', as: 'availabilities' });
Availability.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });

// Doctor - Appointment relationship (1:M)
Doctor.hasMany(Appointment, { foreignKey: 'doctorId', as: 'appointments' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });

// User (Client) - Appointment relationship (1:M)
User.hasMany(Appointment, { foreignKey: 'clientId', as: 'clientAppointments' });
Appointment.belongsTo(User, { foreignKey: 'clientId', as: 'client' });

export {
    User,
    Doctor,
    Availability,
    Appointment,
};
