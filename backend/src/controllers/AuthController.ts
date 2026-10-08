import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class AuthController {
  constructor(private authService: AuthService) {}

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        sendError(res, 'VALIDATION_ERROR', 'Email and password are required', 400);
        return;
      }

      const result = await this.authService.login(email, password);
      sendSuccess(res, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      sendError(res, 'AUTH_ERROR', message, 401);
    }
  }

  async me(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Not authenticated', 401);
        return;
      }
      sendSuccess(res, { user: req.user });
    } catch (error) {
      sendError(res, 'AUTH_ERROR', 'Failed to get user info', 500);
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    // JWT tokens are stateless — client discards the token
    sendSuccess(res, { message: 'Logged out successfully' });
  }
}
