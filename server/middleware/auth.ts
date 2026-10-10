import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { dbQuery } from '../db.js';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'citizen' | 'admin';
  mobile: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mobile: user.mobile,
    },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    
    // Server-side check that user still exists in database
    const rows = await dbQuery<AuthUser>(
      'SELECT id, name, email, mobile, role FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!rows || rows.length === 0) {
      res.status(401).json({
        success: false,
        message: 'Invalid session: User account does not exist or was removed.',
      });
      return;
    }

    req.user = rows[0];
    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.',
    });
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Access restricted: Administrator privileges required to perform this action.',
    });
    return;
  }

  next();
}

export function requireCitizenOrAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
    return;
  }
  next();
}
