-- CREALIS MARKET Database Initialization
-- PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS "Users" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    role VARCHAR(50) DEFAULT 'customer',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des commerçants
CREATE TABLE IF NOT EXISTS "Merchants" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "businessName" VARCHAR(255) NOT NULL,
    "registrationNumber" VARCHAR(100) UNIQUE,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Burkina Faso',
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    "subscriptionPlan" VARCHAR(50) DEFAULT 'basic',
    "subscriptionStatus" VARCHAR(50) DEFAULT 'trial',
    "subscriptionEndDate" TIMESTAMP,
    "isVerified" BOOLEAN DEFAULT false,
    "commissionRate" DECIMAL(5,2) DEFAULT 2.5,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des clients
CREATE TABLE IF NOT EXISTS "Customers" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "phoneNumber" VARCHAR(50) UNIQUE NOT NULL,
    "nfcCardNumber" VARCHAR(100) UNIQUE,
    "loyaltyPoints" INTEGER DEFAULT 0,
    "totalSpent" DECIMAL(10,2) DEFAULT 0,
    "vipLevel" VARCHAR(20) DEFAULT 'bronze',
    "walletBalance" DECIMAL(10,2) DEFAULT 0,
    "birthDate" DATE,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des transactions
CREATE TABLE IF NOT EXISTS "Transactions" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "transactionId" VARCHAR(100) UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(50) NOT NULL,
    "paymentMethod" VARCHAR(50) NOT NULL,
    "mobileMoneyProvider" VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    "pointsEarned" INTEGER DEFAULT 0,
    description TEXT,
    reference VARCHAR(255),
    "customerId" UUID REFERENCES "Customers"(id),
    "merchantId" UUID REFERENCES "Merchants"(id),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des produits
CREATE TABLE IF NOT EXISTS "Products" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    stock INTEGER DEFAULT 0,
    barcode VARCHAR(100) UNIQUE,
    "hasPromotion" BOOLEAN DEFAULT false,
    "promotionPercent" DECIMAL(5,2),
    "imageUrl" TEXT,
    "merchantId" UUID REFERENCES "Merchants"(id),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des terminaux POS
CREATE TABLE IF NOT EXISTS "POSDevices" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "deviceId" VARCHAR(100) UNIQUE NOT NULL,
    model VARCHAR(100),
    "serialNumber" VARCHAR(100) UNIQUE,
    status VARCHAR(50) DEFAULT 'active',
    "lastSync" TIMESTAMP,
    "firmwareVersion" VARCHAR(50),
    location VARCHAR(255),
    "merchantId" UUID REFERENCES "Merchants"(id),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_transactions_customer ON "Transactions"("customerId");
CREATE INDEX idx_transactions_merchant ON "Transactions"("merchantId");
CREATE INDEX idx_products_merchant ON "Products"("merchantId");
CREATE INDEX idx_customers_phone ON "Customers"("phoneNumber");
CREATE INDEX idx_customers_nfc ON "Customers"("nfcCardNumber");

-- Insertion d'un admin par défaut
INSERT INTO "Users" (email, password, "firstName", "lastName", phone, role)
VALUES ('admin@crealis.com', '$2a$10$rQ5sXQ5XQ5XQ5XQ5XQ5XQ5u', 'Admin', 'CREALIS', '+22600000000', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insertion d'un commerçant test
INSERT INTO "Merchants" ("businessName", phone, email, city, "subscriptionPlan", "subscriptionStatus", "isVerified")
VALUES ('Supermarket Test', '+22670123456', 'test@supermarket.com', 'Ouagadougou', 'premium', 'active', true)
ON CONFLICT DO NOTHING;
