import { Router } from 'express';
import passport from '../config/passport';
import { authService } from '../services/auth/authService';
import { totpService } from '../services/auth/totpService';
import { sms2FAService } from '../services/auth/smsService';
import { isAuthenticated } from '../middleware/auth';
import { RegisterDTO, LoginDTO, Verify2FADTO, ApiResponse } from '../types';

const router = Router();

/**
 * Authentication Routes
 *
 * INTEGRATION NOTE:
 * Login flow with 2FA:
 * 1. POST /login - Returns {requires2FA: true} if 2FA enabled
 * 2. POST /verify-2fa - Verify TOTP or SMS code
 * 3. After verification, session.twoFactorVerified = true
 */

// Register new user
router.post('/register', async (req, res) => {
  try {
    const data: RegisterDTO = req.body;

    // Validate required fields
    if (!data.email || !data.username || !data.password) {
      return res.status(400).json({
        success: false,
        error: 'Email, username, and password are required',
      } as ApiResponse);
    }

    const user = await authService.registerUser(data);

    res.status(201).json({
      success: true,
      data: user,
      message: 'User registered successfully',
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Registration failed',
    } as ApiResponse);
  }
});

// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', async (err: any, user: any, info: any) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Authentication error',
      } as ApiResponse);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: info?.message || 'Invalid credentials',
      } as ApiResponse);
    }

    // Get full user details to check 2FA status
    const fullUser = await authService.findById(user.id);

    if (!fullUser) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
    }

    // Check if user has any 2FA method enabled
    const requires2FA = fullUser.totpEnabled || fullUser.smsEnabled;

    if (requires2FA) {
      // Store pending user ID in session
      req.session.pendingUserId = user.id;
      req.session.requires2FA = true;
      req.session.twoFactorVerified = false;

      // If SMS is enabled, send code automatically
      if (fullUser.smsEnabled) {
        try {
          await sms2FAService.sendVerificationCode(user.id);
        } catch (error) {
          console.error('Failed to send SMS code:', error);
        }
      }

      return res.json({
        success: true,
        data: {
          requires2FA: true,
          methods: {
            totp: fullUser.totpEnabled,
            sms: fullUser.smsEnabled,
          },
        },
        message: '2FA verification required',
      } as ApiResponse);
    }

    // No 2FA required, establish session
    req.login(user, (loginErr) => {
      if (loginErr) {
        return res.status(500).json({
          success: false,
          error: 'Login error',
        } as ApiResponse);
      }

      req.session.twoFactorVerified = true;

      res.json({
        success: true,
        data: {
          user: {
            id: fullUser.id,
            username: fullUser.username,
            email: fullUser.email,
          },
          requires2FA: false,
        },
        message: 'Login successful',
      } as ApiResponse);
    });
  })(req, res, next);
});

// Verify 2FA code
router.post('/verify-2fa', async (req, res) => {
  try {
    const { code, method }: Verify2FADTO = req.body;

    if (!req.session.pendingUserId || !req.session.requires2FA) {
      return res.status(400).json({
        success: false,
        error: 'No pending 2FA verification',
      } as ApiResponse);
    }

    const userId = req.session.pendingUserId;
    let isValid = false;

    // Verify based on method
    if (method === '2fa-totp') {
      isValid = await totpService.verifyCode(userId, code);
    } else if (method === '2fa-sms') {
      isValid = await sms2FAService.verifyCode(userId, code);
    }

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid verification code',
      } as ApiResponse);
    }

    // Get user data
    const user = await authService.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
    }

    // Establish session
    req.login({ id: user.id, username: user.username }, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: 'Login error',
        } as ApiResponse);
      }

      // Mark 2FA as verified
      req.session.twoFactorVerified = true;
      delete req.session.pendingUserId;
      delete req.session.requires2FA;

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
          },
        },
        message: '2FA verification successful',
      } as ApiResponse);
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '2FA verification failed',
    } as ApiResponse);
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Logout failed',
      } as ApiResponse);
    }

    req.session.destroy((sessionErr) => {
      if (sessionErr) {
        return res.status(500).json({
          success: false,
          error: 'Session destruction failed',
        } as ApiResponse);
      }

      res.json({
        success: true,
        message: 'Logged out successfully',
      } as ApiResponse);
    });
  });
});

// Get current user
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const profile = await authService.getUserProfile(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: profile,
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user',
    } as ApiResponse);
  }
});

export default router;
