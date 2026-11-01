//backend/src/models/WarehouseStock.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WarehouseStock = sequelize.define('WarehouseStock', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    warehouseId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    productId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    minStock: {
        type: DataTypes.INTEGER,
        defaultValue: 10
    },
    maxStock: {
        type: DataTypes.INTEGER,
        defaultValue: 1000
    },
    reorderPoint: {
        type: DataTypes.INTEGER,
        defaultValue: 50
    },
    location: {
        type: DataTypes.STRING,
        comment: "Emplacement dans l'entrepôt"
    }
}, {
    timestamps: true
});

module.exports = WarehouseStock;
