import express, { Application, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Load environment variables FIRST before any other imports that use process.env
dotenv.config();

import { connectDatabase } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestIdMiddleware } from './middleware/requestId';
import { checkMaintenanceMode } from './middleware/maintenance';
import { sessionTracker } from './middleware/sessionTracker';
import routes from './routes';
import { initEmailService } from './services/emailService';
import momoService from './services/momoService';

// Trigger restart

// Create Express app
const app: Application = express();

// Environment variables
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const API_PREFIX = process.env.API_PREFIX || '/api';
const API_VERSION = process.env.API_VERSION || 'v1';
const SHOULD_EXIT_ON_FATAL = NODE_ENV === 'production';
const CORS_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:4200')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middleware
app.use(requestIdMiddleware); // Request ID tracking (must be first)
app.set('trust proxy', 1); // Required when running behind Render/Reverse Proxy
app.use(helmet()); // Security headers
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server calls and non-browser clients with no origin.
    if (!origin) {
      callback(null, true);
      return;
    }

    if (CORS_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }

    // Keep local development flexible for varying localhost ports.
    if (NODE_ENV !== 'production' && /^http:\/\/localhost:\d+$/.test(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(compression()); // Compress responses
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies with size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies with size limit
app.use(cookieParser()); // Parse cookies for session tracking
app.use(sessionTracker); // Session-based visit tracking for ML

// Logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

// Readiness check endpoint (used by reverse proxy / orchestrator)
app.get('/readyz', (_req: Request, res: Response) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  if (!databaseConnected) {
    return res.status(503).json({
      status: 'error',
      message: 'Service not ready',
      checks: {
        database: 'disconnected'
      },
      timestamp: new Date().toISOString()
    });
  }

  return res.status(200).json({
    status: 'success',
    message: 'Service is ready',
    checks: {
      database: 'connected'
    },
    timestamp: new Date().toISOString()
  });
});

// Maintenance mode check (before routes)
app.use(checkMaintenanceMode);

// API routes
app.use(`${API_PREFIX}/${API_VERSION}`, routes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Database connection and server start
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Initialize email service
    await initEmailService();

    // Initialize MOMO service
    momoService.init();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🌱 Ponsai Backend Server Running                    ║
║                                                            ║
║   Environment: ${NODE_ENV.padEnd(42)}║
║   Port:        ${String(PORT).padEnd(42)}║
║   API:         http://localhost:${PORT}${API_PREFIX}/${API_VERSION}${' '.repeat(15)}║
║   Health:      http://localhost:${PORT}/health${' '.repeat(20)}║
║                                                            ║
║   Database:    Connected ✓                                ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error: any) {
    console.error('\n💀 ========== SERVER STARTUP FAILED ==========' );
    console.error('💥 Error:', error);
    if (error instanceof Error) {
      console.error('📄 Stack Trace:');
      console.error(error.stack);
      console.error('📦 Error Name:', error.name);
      console.error('📦 Error Message:', error.message);
    }
    console.error('💀 ===========================================\n');
    if (SHOULD_EXIT_ON_FATAL) {
      process.exit(1);
    }
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('\n🔴 ========== UNHANDLED REJECTION ==========' );
  console.error('📍 Promise:', promise);
  console.error('💥 Reason:', reason);
  if (reason instanceof Error) {
    console.error('📄 Stack Trace:');
    console.error(reason.stack);
    console.error('📦 Error Name:', reason.name);
    console.error('📦 Error Message:', reason.message);
    if ((reason as any).code) console.error('📦 Error Code:', (reason as any).code);
    if ((reason as any).response) console.error('📦 HTTP Response:', (reason as any).response?.data);
  } else {
    console.error('📦 Raw Rejection Value:', JSON.stringify(reason, null, 2));
  }
  console.error('🔴 =========================================\n');
  if (SHOULD_EXIT_ON_FATAL) {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('\n🔴 ========== UNCAUGHT EXCEPTION ==========' );
  console.error('💥 Error:', err.message);
  console.error('📄 Stack Trace:');
  console.error(err.stack);
  console.error('📦 Error Name:', err.name);
  console.error('📦 Error Message:', err.message);
  if ((err as any).code) console.error('📦 Error Code:', (err as any).code);
  if ((err as any).errno) console.error('📦 Error Errno:', (err as any).errno);
  if ((err as any).syscall) console.error('📦 Syscall:', (err as any).syscall);
  console.error('🔴 ========================================\n');
  if (SHOULD_EXIT_ON_FATAL) {
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close();
  process.exit(0);
});

// Start the server
startServer();

export default app;
