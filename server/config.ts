import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'smart_civic_super_secure_jwt_token_2026_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // MySQL Configuration
  db: {
    host: process.env.DB_HOST || '',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smart_civic',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 5000,
  },
  
  // Storage paths
  uploadsDir: path.join(rootDir, 'uploads'),
  sqliteDataDir: path.join(rootDir, 'data'),
  sqliteFile: path.join(rootDir, 'data', 'smart_civic.sqlite'),
  
  // App info
  appName: 'Smart Civic Complaint System',
  ownerName: 'Anish Kumar Singh',
};
