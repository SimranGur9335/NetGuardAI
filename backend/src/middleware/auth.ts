import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { sendError } from '../utils/apiResponse';
import { AuthUser, UserRole } from '../models';

// Extend Express Request to include user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(authService: AuthService) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const token = authHeader.split(' ')[1];
      const user = authService.verifyToken(token);
      req.user = user;
      next();
    } catch {
      sendError(res, 'UNAUTHORIZED', 'Invalid or expired token', 401);
    }
  };
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, 'FORBIDDEN', 'Insufficient permissions', 403);
      return;
    }

    next();
  };
}
