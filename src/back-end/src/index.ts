import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import session from 'express-session';
import cors from 'cors';
import passport from './config/passport';
import authRoutes from './routes/auth';
import twoFactorRoutes from './routes/twoFactor';
import profileRoutes from './routes/profile';

/**
 * Express Application Entry Point
 *
 * INTEGRATION NOTE:
 * - CORS enabled for frontend (http://localhost:5173)
 * - Express sessions with PostgreSQL store
 * - Passport.js initialized for authentication
 * - All routes prefixed with /api
 */

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration for local development
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Session configuration
// NOTE: For production, use connect-pg-simple for PostgreSQL session store
// For this POC, using memory store is acceptable
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/profile', profileRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Backend server running on http://localhost:${PORT}
📋 Environment: ${process.env.NODE_ENV || 'development'}
🔐 Session secret: ${process.env.SESSION_SECRET ? 'configured' : 'using default (change in production!)'}
📞 Twilio: ${process.env.TWILIO_ACCOUNT_SID ? 'configured' : 'not configured'}
  `);
});

export default app;
