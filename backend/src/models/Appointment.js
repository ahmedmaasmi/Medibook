import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Appointment = sequelize.define('Appointment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    clientId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id',
        },
    },
    doctorId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Doctors',
            key: 'id',
        },
    },
    appointmentDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    startTime: {
        type: DataTypes.TIME,
        allowNull: false,
    },
    endTime: {
        type: DataTypes.TIME,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
        defaultValue: 'pending',
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    googleEventId: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    bookedVia: {
        type: DataTypes.ENUM('web', 'mobile', 'voice'),
        defaultValue: 'web',
    },
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['doctorId', 'appointmentDate', 'startTime'],
            name: 'unique_appointment_slot',
        },
    ],
});

export default Appointment;
