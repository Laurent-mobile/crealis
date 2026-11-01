//backend/src/config/database.js 
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// Configuration pour Supabase via pgbouncer
const sequelize = new Sequelize(
  process.env.DB_NAME || 'postgres',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'Crealis2025!',
  {
    host: 'aws-0-eu-west-1.pooler.supabase.com',
    port: 6543,  // Utiliser le port 6543 pour pgbouncer
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      freezeTableName: true,  // Évite la pluralisation automatique
      underscored: false       // Garde les noms tels quels
    }
  }
);

const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully (Supabase)');

    await sequelize.sync({ alter: false });
    console.log('✅ Models synchronized');

    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

module.exports = { sequelize, initDatabase };
