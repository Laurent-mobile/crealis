//backend/src/models/Transaction.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  transactionId: {
    type: DataTypes.STRING,
    unique: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('purchase', 'recharge', 'cashback', 'withdrawal', 'refund'),
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.ENUM('nfc_card', 'qr_code', 'mobile_money', 'cash'),
    allowNull: false
  },
  mobileMoneyProvider: {
    type: DataTypes.ENUM('orange_money', 'wave', 'moov_money', 'telecel_money')
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  pointsEarned: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  description: {
    type: DataTypes.TEXT
  },
  reference: {
    type: DataTypes.STRING
  },
  userId: {  // ← AJOUTER CETTE LIGNE
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Transaction;
