//backend/src/models/Product.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  costPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  category: {
    type: DataTypes.STRING
  },
  subCategory: {
    type: DataTypes.STRING
  },
  brand: {
    type: DataTypes.STRING
  },
  sku: {
    type: DataTypes.STRING,
    unique: true
  },
  barcode: {
    type: DataTypes.STRING,
    unique: true
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  minStockAlert: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  maxStockAlert: {
    type: DataTypes.INTEGER,
    defaultValue: 500
  },
  reorderPoint: {
    type: DataTypes.INTEGER,
    defaultValue: 20
  },
  reorderQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 50
  },
  unit: {
    type: DataTypes.STRING,
    defaultValue: 'pièce'
  },
  weight: {
    type: DataTypes.DECIMAL(10, 2)
  },
  taxRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  margin: {
    type: DataTypes.DECIMAL(5, 2)
  },
  hasPromotion: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  promotionPrice: {
    type: DataTypes.DECIMAL(10, 2)
  },
  promotionStartDate: {
    type: DataTypes.DATE
  },
  promotionEndDate: {
    type: DataTypes.DATE
  },
  promotionPercent: {
    type: DataTypes.DECIMAL(5, 2)
  },
  imageUrl: {
    type: DataTypes.TEXT
  },
  imageUrls: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: []
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  lastStockUpdate: {
    type: DataTypes.DATE
  },
  supplier: {
    type: DataTypes.STRING
  },
  supplierContact: {
    type: DataTypes.STRING
  },
  location: {
    type: DataTypes.STRING
  },
  expiryDate: {
    type: DataTypes.DATE
  },
  batchNumber: {
    type: DataTypes.STRING
  },
  alertSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastAlertDate: {
    type: DataTypes.DATE
  }
}, {
  timestamps: true
});

// Méthodes
Product.prototype.isLowStock = function () {
  return this.stock <= this.minStockAlert;
};

Product.prototype.isOverstock = function () {
  return this.stock >= this.maxStockAlert;
};

Product.prototype.needsReorder = function () {
  return this.stock <= this.reorderPoint;
};

Product.prototype.getRecommendedOrder = function () {
  if (this.stock <= this.reorderPoint) {
    return this.reorderQuantity;
  }
  return 0;
};

Product.prototype.getPotentialProfit = function () {
  return (this.price - this.costPrice) * this.stock;
};

module.exports = Product;
