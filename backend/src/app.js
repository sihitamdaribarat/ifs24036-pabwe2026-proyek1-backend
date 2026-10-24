import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import authRoutes from './modules/auth/routes.js';
import habitRoutes from './modules/habits/routes.js';
import postRoutes from './modules/posts/routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { sendError } from './utils/response.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../../frontend/dist');

const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// CORS — allow local dev + Vercel deployment
const allowedOrigins = [
  config.corsOrigin,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://ifs24036-pabwe2026-proyek1.vercel.app',
];
app.use(cors({
  origin: (origin, cb) => {
    // Allow same-origin requests (no Origin header) and allowed origins
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
  credentials: true,
}));

// Body parser & Cookie parser
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Non-sensitive request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/health') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount API v1
const apiV1 = express.Router();
apiV1.use(authRoutes);
apiV1.use(habitRoutes);
apiV1.use(postRoutes);

app.use('/api/v1', apiV1);

// Serve frontend static files if available
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 404 Not Found
app.use((req, res) => {
  sendError(res, 'NOT_FOUND', `Rute ${req.method} ${req.originalUrl} tidak ditemukan.`, null, 404);
});

// Error handling middleware
app.use(errorHandler);

export default app;
