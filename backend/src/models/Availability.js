import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Availability = sequelize.define('Availability', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    doctorId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Doctors',
            key: 'id',
        },
    },
    dayOfWeek: {
        type: DataTypes.INTEGER, // 0 = Sunday, 6 = Saturday
        allowNull: false,
        validate: {
            min: 0,
            max: 6,
        },
    },
    startTime: {
        type: DataTypes.TIME,
        allowNull: false,
    },
    endTime: {
        type: DataTypes.TIME,
        allowNull: false,
    },
    slotDuration: {
        type: DataTypes.INTEGER, // Duration in minutes
        allowNull: false,
        defaultValue: 30,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    timestamps: true,
    validate: {
        endAfterStart() {
            if (this.startTime >= this.endTime) {
                throw new Error('End time must be after start time');
            }
        },
    },
});

export default Availability;
