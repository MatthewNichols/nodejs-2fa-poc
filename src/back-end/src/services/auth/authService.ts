import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { RegisterDTO, UserProfile } from '../../types';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

/**
 * Authentication Service
 *
 * Handles user registration, password verification, and user lookups.
 */
export class AuthService {
  /**
   * Register a new user
   */
  async registerUser(data: RegisterDTO): Promise<UserProfile> {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === data.email) {
        throw new Error('Email already registered');
      }
      if (existingUser.username === data.username) {
        throw new Error('Username already taken');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        phoneNumber: data.phoneNumber || null,
      },
    });

    return this.mapUserToProfile(user);
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string) {
    return await prisma.user.findUnique({
      where: { username },
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Verify password
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    return this.mapUserToProfile(user);
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: { phoneNumber?: string; bio?: string }
  ): Promise<UserProfile> {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.mapUserToProfile(user);
  }

  /**
   * Map database user to profile (excludes password)
   */
  private mapUserToProfile(user: {
    id: string;
    email: string;
    username: string;
    phoneNumber: string | null;
    bio: string | null;
    totpEnabled: boolean;
    smsEnabled: boolean;
    createdAt: Date;
  }): UserProfile {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      phoneNumber: user.phoneNumber,
      bio: user.bio,
      totpEnabled: user.totpEnabled,
      smsEnabled: user.smsEnabled,
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();
