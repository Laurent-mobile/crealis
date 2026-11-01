//backend/src/model/campaign.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Campaign = sequelize.define('Campaign', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    type: {
        type: DataTypes.ENUM('banner', 'video', 'notification'),
        defaultValue: 'banner'
    },
    duration: {
        type: DataTypes.INTEGER,
        defaultValue: 30
    },
    budget: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    spent: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    targetAudience: {
        type: DataTypes.ENUM('all', 'vip', 'new', 'inactive'),
        defaultValue: 'all'
    },
    startDate: {
        type: DataTypes.DATE
    },
    endDate: {
        type: DataTypes.DATE
    },
    mediaUrl: {
        type: DataTypes.TEXT
    },
    discountPercent: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0
    },
    productId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'paused', 'ended', 'scheduled'),
        defaultValue: 'scheduled'
    },
    impressions: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    clicks: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    conversions: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    createdBy: {
        type: DataTypes.UUID
    }
}, {
    timestamps: true
});

module.exports = Campaign;
