//backend/src/models/StockMovement.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StockMovement = sequelize.define('StockMovement', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    movementId: {
        type: DataTypes.STRING,
        unique: true
    },
    type: {
        type: DataTypes.ENUM('inbound', 'outbound', 'transfer', 'adjustment', 'loss'),
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    previousStock: {
        type: DataTypes.INTEGER
    },
    newStock: {
        type: DataTypes.INTEGER
    },
    reason: {
        type: DataTypes.TEXT
    },
    reference: {
        type: DataTypes.STRING
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
        defaultValue: 'pending'
    },
    productId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    sourceWarehouseId: {
        type: DataTypes.UUID,
        comment: 'Pour les transferts'
    },
    destinationWarehouseId: {
        type: DataTypes.UUID,
        comment: 'Pour les transferts'
    },
    destinationMerchantId: {
        type: DataTypes.UUID,
        comment: 'Pour les approvisionnements commerçants'
    },
    userId: {
        type: DataTypes.UUID
    }
}, {
    timestamps: true
});

module.exports = StockMovement;
