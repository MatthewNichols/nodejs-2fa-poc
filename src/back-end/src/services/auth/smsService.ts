import { PrismaClient } from '@prisma/client';
import { createSmsService } from '../sms/smsServiceFactory';

const prisma = new PrismaClient();
const smsService = createSmsService();

// Code expires after 10 minutes
const CODE_EXPIRY_MINUTES = 10;

/**
 * SMS-based 2FA Service
 *
 * Generates and verifies SMS codes for two-factor authentication.
 * Uses the abstracted SMS service for sending messages.
 */
export class Sms2FAService {
  /**
   * Generate and send a verification code via SMS
   */
  async sendVerificationCode(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.phoneNumber) {
      throw new Error('User has no phone number configured');
    }

    // Generate 6-digit code
    const code = this.generateCode();

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + CODE_EXPIRY_MINUTES);

    // Invalidate any existing unused codes
    await prisma.smsCode.updateMany({
      where: {
        userId,
        used: false,
      },
      data: {
        used: true,
      },
    });

    // Store new code
    await prisma.smsCode.create({
      data: {
        userId,
        code,
        expiresAt,
      },
    });

    // Send via SMS
    await smsService.sendVerificationCode(user.phoneNumber, code);
  }

  /**
   * Verify an SMS code
   */
  async verifyCode(userId: string, code: string): Promise<boolean> {
    // Find valid, unused code
    const smsCode = await prisma.smsCode.findFirst({
      where: {
        userId,
        code,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!smsCode) {
      return false;
    }

    // Mark code as used
    await prisma.smsCode.update({
      where: { id: smsCode.id },
      data: { used: true },
    });

    return true;
  }

  /**
   * Enable SMS 2FA for a user
   */
  async enableSms2FA(userId: string, verificationCode: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.phoneNumber) {
      throw new Error('User has no phone number configured');
    }

    // Verify the code
    const isValid = await this.verifyCode(userId, verificationCode);

    if (!isValid) {
      throw new Error('Invalid or expired verification code');
    }

    // Enable SMS 2FA
    await prisma.user.update({
      where: { id: userId },
      data: { smsEnabled: true },
    });
  }

  /**
   * Disable SMS 2FA for a user
   */
  async disableSms2FA(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { smsEnabled: false },
    });

    // Clean up unused codes
    await prisma.smsCode.deleteMany({
      where: { userId },
    });
  }

  /**
   * Generate a 6-digit verification code
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Clean up expired codes (can be called periodically)
   */
  async cleanupExpiredCodes(): Promise<void> {
    await prisma.smsCode.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}

export const sms2FAService = new Sms2FAService();
