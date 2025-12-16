import { Router } from 'express';
import { requireFullAuth } from '../middleware/auth';
import { totpService } from '../services/auth/totpService';
import { sms2FAService } from '../services/auth/smsService';
import { authService } from '../services/auth/authService';
import { ApiResponse } from '../types';

const router = Router();

/**
 * 2FA Management Routes
 *
 * INTEGRATION NOTE:
 * These routes allow users to enable/disable TOTP and SMS 2FA.
 * All routes require full authentication (including 2FA if already enabled).
 */

// ============ TOTP Routes ============

/**
 * Initialize TOTP setup
 * Returns QR code and backup codes for user to configure authenticator app
 */
router.post('/totp/setup', requireFullAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const user = await authService.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
    }

    const setupData = await totpService.setupTotp(userId, user.email);

    res.json({
      success: true,
      data: setupData,
      message: 'TOTP setup initialized. Scan QR code and verify.',
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to setup TOTP',
    } as ApiResponse);
  }
});

/**
 * Verify TOTP code and enable TOTP 2FA
 */
router.post('/totp/verify', requireFullAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Verification code required',
      } as ApiResponse);
    }

    await totpService.verifyAndEnable(userId, code);

    res.json({
      success: true,
      message: 'TOTP 2FA enabled successfully',
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'TOTP verification failed',
    } as ApiResponse);
  }
});

/**
 * Disable TOTP 2FA
 */
router.delete('/totp', requireFullAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;

    await totpService.disableTotp(userId);

    res.json({
      success: true,
      message: 'TOTP 2FA disabled successfully',
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to disable TOTP',
    } as ApiResponse);
  }
});

// ============ SMS Routes ============

/**
 * Send SMS verification code to enable SMS 2FA
 */
router.post('/sms/setup', requireFullAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const user = await authService.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
    }

    if (!user.phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number required. Please update your profile first.',
      } as ApiResponse);
    }

    await sms2FAService.sendVerificationCode(userId);

    res.json({
      success: true,
      message: 'Verification code sent to your phone',
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send verification code',
    } as ApiResponse);
  }
});

/**
 * Verify SMS code and enable SMS 2FA
 */
router.post('/sms/verify', requireFullAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Verification code required',
      } as ApiResponse);
    }

    await sms2FAService.enableSms2FA(userId, code);

    res.json({
      success: true,
      message: 'SMS 2FA enabled successfully',
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'SMS verification failed',
    } as ApiResponse);
  }
});

/**
 * Resend SMS code (during login or setup)
 */
router.post('/sms/resend', async (req, res) => {
  try {
    // Check if user is in 2FA verification state (during login)
    if (req.session.pendingUserId) {
      await sms2FAService.sendVerificationCode(req.session.pendingUserId);
      return res.json({
        success: true,
        message: 'Verification code resent',
      } as ApiResponse);
    }

    // Or user is authenticated and wants to resend for setup
    if (req.isAuthenticated()) {
      const userId = (req.user as any).id;
      await sms2FAService.sendVerificationCode(userId);
      return res.json({
        success: true,
        message: 'Verification code resent',
      } as ApiResponse);
    }

    res.status(400).json({
      success: false,
      error: 'No active verification session',
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to resend code',
    } as ApiResponse);
  }
});

/**
 * Disable SMS 2FA
 */
router.delete('/sms', requireFullAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;

    await sms2FAService.disableSms2FA(userId);

    res.json({
      success: true,
      message: 'SMS 2FA disabled successfully',
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to disable SMS 2FA',
    } as ApiResponse);
  }
});

export default router;
