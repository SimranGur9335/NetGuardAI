import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'netguard-dev-secret-change-in-production',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@netguard.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin',
};
