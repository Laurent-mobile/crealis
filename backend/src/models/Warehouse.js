//backend/src/models/Warehouse.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Warehouse = sequelize.define('Warehouse', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Entrepôt Principal CREALIS'
    },
    code: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('main', 'regional', 'local'),
        defaultValue: 'main'
    },
    address: {
        type: DataTypes.TEXT
    },
    city: {
        type: DataTypes.STRING,
        defaultValue: 'Ouagadougou'
    },
    country: {
        type: DataTypes.STRING,
        defaultValue: 'Burkina Faso'
    },
    phone: {
        type: DataTypes.STRING
    },
    email: {
        type: DataTypes.STRING
    },
    manager: {
        type: DataTypes.STRING
    },
    capacity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Capacité maximale en unités'
    },
    currentStock: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Stock actuel total'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: true
});

module.exports = Warehouse;
