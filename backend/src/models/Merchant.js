//backend/src/models/Merchant.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Merchant = sequelize.define('Merchant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  businessName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  registrationNumber: {
    type: DataTypes.STRING,
    unique: true
  },
  address: {
    type: DataTypes.TEXT
  },
  city: {
    type: DataTypes.STRING
  },
  country: {
    type: DataTypes.STRING,
    defaultValue: 'Burkina Faso'
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    validate: { isEmail: true }
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8)
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8)
  },
  subscriptionPlan: {
    type: DataTypes.ENUM('basic', 'premium', 'enterprise'),
    defaultValue: 'basic'
  },
  subscriptionStatus: {
    type: DataTypes.ENUM('active', 'inactive', 'trial'),
    defaultValue: 'trial'
  },
  subscriptionEndDate: {
    type: DataTypes.DATE
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  commissionRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 2.5
  }
}, {
  timestamps: true,
  tableName: 'Merchants',  // ← Ajoutez cette ligne
  freezeTableName: true
});

module.exports = Merchant;
