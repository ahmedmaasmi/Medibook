import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Doctor = sequelize.define('Doctor', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
            model: 'Users',
            key: 'id',
        },
    },
    specialization: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    licenseNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    consultationFee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    yearsOfExperience: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    googleCalendarConnected: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    googleCalendarToken: {
        type: DataTypes.JSON,
        allowNull: true,
    },
}, {
    timestamps: true,
});

export default Doctor;
