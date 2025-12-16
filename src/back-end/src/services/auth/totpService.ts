import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { TotpSetupResponse } from '../../types';

const prisma = new PrismaClient();

/**
 * TOTP (Time-based One-Time Password) Service
 *
 * Handles TOTP 2FA setup, verification, and management.
 * Uses otplib for TOTP generation/verification.
 */
export class TotpService {
  /**
   * Generate TOTP secret and QR code for user setup
   */
  async setupTotp(userId: string, userEmail: string): Promise<TotpSetupResponse> {
    // Generate a new secret
    const secret = authenticator.generateSecret();

    // Generate OTP auth URL for QR code
    const otpauthUrl = authenticator.keyuri(userEmail, '2FA POC App', secret);

    // Generate QR code as data URL
    const qrCode = await qrcode.toDataURL(otpauthUrl);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes(6);
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => bcrypt.hash(code, 10))
    );

    // Store TOTP secret (will replace if exists)
    await prisma.totpSecret.upsert({
      where: { userId },
      create: {
        userId,
        secret,
        backupCodes: hashedBackupCodes,
      },
      update: {
        secret,
        backupCodes: hashedBackupCodes,
      },
    });

    return {
      secret,
      qrCode,
      backupCodes, // Return plain codes to user (only shown once)
    };
  }

  /**
   * Verify TOTP code and enable TOTP for user
   */
  async verifyAndEnable(userId: string, code: string): Promise<boolean> {
    const totpSecret = await prisma.totpSecret.findUnique({
      where: { userId },
    });

    if (!totpSecret) {
      throw new Error('TOTP not set up for this user');
    }

    // Verify the code
    const isValid = authenticator.verify({
      token: code,
      secret: totpSecret.secret,
    });

    if (!isValid) {
      throw new Error('Invalid verification code');
    }

    // Enable TOTP for the user
    await prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: true },
    });

    return true;
  }

  /**
   * Verify TOTP code during login
   */
  async verifyCode(userId: string, code: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { totpSecret: true },
    });

    if (!user || !user.totpEnabled || !user.totpSecret) {
      return false;
    }

    // First try verifying as TOTP code
    const isValidTotp = authenticator.verify({
      token: code,
      secret: user.totpSecret.secret,
    });

    if (isValidTotp) {
      return true;
    }

    // If TOTP fails, check backup codes
    return await this.verifyBackupCode(user.totpSecret.backupCodes, code);
  }

  /**
   * Disable TOTP for a user
   */
  async disableTotp(userId: string): Promise<void> {
    await prisma.$transaction([
      prisma.totpSecret.deleteMany({
        where: { userId },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { totpEnabled: false },
      }),
    ]);
  }

  /**
   * Generate random backup codes
   */
  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-digit backup code
      const code = Math.floor(10000000 + Math.random() * 90000000).toString();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Verify a backup code
   */
  private async verifyBackupCode(hashedCodes: string[], code: string): Promise<boolean> {
    for (const hashedCode of hashedCodes) {
      const isMatch = await bcrypt.compare(code, hashedCode);
      if (isMatch) {
        return true;
      }
    }
    return false;
  }
}

export const totpService = new TotpService();
