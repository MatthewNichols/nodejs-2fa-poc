import { Request, Response, NextFunction } from 'express';

/**
 * Authentication Middleware
 *
 * INTEGRATION NOTE:
 * - isAuthenticated: Checks if user is logged in (via Passport session)
 * - require2FAVerified: Ensures 2FA has been completed if enabled
 * - Use both together for protected routes that require full authentication
 */

/**
 * Ensure user is authenticated via Passport
 */
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.status(401).json({
    success: false,
    error: 'Not authenticated',
  });
}

/**
 * Ensure 2FA verification is complete (if enabled)
 *
 * IMPORTANT: This should be used AFTER isAuthenticated
 * It checks if the user has 2FA enabled and if so, whether it's been verified
 */
export function require2FAVerified(req: Request, res: Response, next: NextFunction) {
  // If session indicates 2FA is required but not verified
  if (req.session.requires2FA && !req.session.twoFactorVerified) {
    return res.status(403).json({
      success: false,
      error: '2FA verification required',
      requires2FA: true,
    });
  }

  next();
}

/**
 * Combined middleware for routes requiring full authentication including 2FA
 * Use this on protected routes that need complete auth
 */
export const requireFullAuth = [isAuthenticated, require2FAVerified];
