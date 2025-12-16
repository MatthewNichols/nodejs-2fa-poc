import { Router } from 'express';
import { requireFullAuth } from '../middleware/auth';
import { authService } from '../services/auth/authService';
import { UpdateProfileDTO, ApiResponse } from '../types';

const router = Router();

/**
 * Profile Routes
 *
 * Manage user profile information
 */

/**
 * Get user profile
 */
router.get('/', requireFullAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const profile = await authService.getUserProfile(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found',
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: profile,
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get profile',
    } as ApiResponse);
  }
});

/**
 * Update user profile
 */
router.put('/', requireFullAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const data: UpdateProfileDTO = req.body;

    // Validate phone number format if provided
    if (data.phoneNumber && !isValidPhoneNumber(data.phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Use E.164 format (e.g., +15551234567)',
      } as ApiResponse);
    }

    const updatedProfile = await authService.updateProfile(userId, {
      phoneNumber: data.phoneNumber,
      bio: data.bio,
    });

    res.json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully',
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update profile',
    } as ApiResponse);
  }
});

/**
 * Basic phone number validation (E.164 format)
 */
function isValidPhoneNumber(phone: string): boolean {
  // E.164 format: +[country code][number]
  // Example: +15551234567
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

export default router;
