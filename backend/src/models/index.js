//backend/src/models/index.js
const User = require('./User');
const Merchant = require('./Merchant');
const Customer = require('./Customer');
const Transaction = require('./Transaction');
const Product = require('./Product');
const POSDevice = require('./POSDevice');
const Warehouse = require('./Warehouse');
const StockMovement = require('./StockMovement');
const WarehouseStock = require('./WarehouseStock');
const Campaign = require('./Campaign');
const PlatformConfig = require('./PlatformConfig');

// Relations existantes...
User.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });
Merchant.hasMany(User, { foreignKey: 'merchantId', as: 'users' });

Merchant.hasMany(POSDevice, { foreignKey: 'merchantId', as: 'posDevices' });
POSDevice.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });

Customer.hasMany(Transaction, { foreignKey: 'customerId', as: 'transactions' });
Transaction.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Merchant.hasMany(Transaction, { foreignKey: 'merchantId', as: 'transactions' });
Transaction.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });

Product.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });
Merchant.hasMany(Product, { foreignKey: 'merchantId', as: 'products' });

User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Warehouse.hasMany(StockMovement, { foreignKey: 'sourceWarehouseId', as: 'outgoingMovements' });
Warehouse.hasMany(StockMovement, { foreignKey: 'destinationWarehouseId', as: 'incomingMovements' });
StockMovement.belongsTo(Warehouse, { foreignKey: 'sourceWarehouseId', as: 'sourceWarehouse' });
StockMovement.belongsTo(Warehouse, { foreignKey: 'destinationWarehouseId', as: 'destinationWarehouse' });
StockMovement.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Product.hasMany(StockMovement, { foreignKey: 'productId', as: 'stockMovements' });
StockMovement.belongsTo(Merchant, { foreignKey: 'destinationMerchantId', as: 'merchant' });
Merchant.hasMany(StockMovement, { foreignKey: 'destinationMerchantId', as: 'supplies' });
WarehouseStock.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });
WarehouseStock.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Warehouse.hasMany(WarehouseStock, { foreignKey: 'warehouseId', as: 'stocks' });
Product.hasMany(WarehouseStock, { foreignKey: 'productId', as: 'warehouseStocks' });

// Nouvelles relations
Campaign.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Campaign, { foreignKey: 'createdBy', as: 'campaigns' });

module.exports = {
  User,
  Merchant,
  Customer,
  Transaction,
  Product,
  POSDevice,
  Warehouse,
  StockMovement,
  WarehouseStock,
  Campaign,
  PlatformConfig
};
