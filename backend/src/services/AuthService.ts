import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthUser, LoginResponse, UserRole } from '../models';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * AuthService
 * Handles authentication using JWT tokens.
 * Uses environment-based admin credentials for development.
 * Password is hashed before comparison — never stored in plaintext.
 */
export class AuthService {
  private readonly tokenExpiry = '24h';

  constructor(
    private adminEmail: string,
    private adminPasswordHash: string
  ) {}

  async login(email: string, password: string): Promise<LoginResponse> {
    // Validate credentials against environment-based admin account
    if (email !== this.adminEmail) {
      throw new Error('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(password, this.adminPasswordHash);
    if (!passwordValid) {
      throw new Error('Invalid email or password');
    }

    const user: AuthUser = {
      id: 'admin-001',
      email: this.adminEmail,
      role: UserRole.ADMIN,
    };

    const token = this.generateToken(user);

    logger.info('User logged in', { email: user.email, role: user.role });

    return { token, user };
  }

  verifyToken(token: string): AuthUser {
    try {
      const payload = jwt.verify(token, config.jwtSecret) as {
        userId: string;
        email: string;
        role: UserRole;
      };

      return {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
      };
    } catch {
      throw new Error('Invalid or expired token');
    }
  }

  private generateToken(user: AuthUser): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      config.jwtSecret,
      { expiresIn: this.tokenExpiry }
    );
  }
}
