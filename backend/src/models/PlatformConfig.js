//backend/src/models/PlatformConfig.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PlatformConfig = sequelize.define('PlatformConfig', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    platform: {
        type: DataTypes.ENUM('pos_screen', 'led_screen', 'push_notification'),
        allowNull: false
    },
    settings: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: true
});

module.exports = PlatformConfig;
