//backend/src/models/POSDevice.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const POSDevice = sequelize.define('POSDevice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  deviceId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  model: {
    type: DataTypes.STRING
  },
  serialNumber: {
    type: DataTypes.STRING,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
    defaultValue: 'active'
  },
  lastSync: {
    type: DataTypes.DATE
  },
  firmwareVersion: {
    type: DataTypes.STRING
  },
  location: {
    type: DataTypes.STRING
  }
}, {
  timestamps: true
});

module.exports = POSDevice;
