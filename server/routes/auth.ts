import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { dbQuery, dbExecute } from '../db.js';
import { generateToken, authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const loginLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15, // max 15 attempts
  message: 'Too many login attempts. Please wait a few moments before trying again.',
});

// Citizen Registration
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, mobile, password } = req.body;

    // Server-side input validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: 'Full name is required and must be at least 2 characters long.',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim().toLowerCase())) {
      res.status(400).json({
        success: false,
        message: 'A valid email address is required.',
      });
      return;
    }

    const mobileClean = typeof mobile === 'string' ? mobile.trim() : '';
    if (!mobileClean || mobileClean.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Valid contact mobile number is required.',
      });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
      return;
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Check duplicate email
    const existing = await dbQuery<{ id: number }>(
      'SELECT id FROM users WHERE email = ?',
      [sanitizedEmail]
    );

    if (existing && existing.length > 0) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please log in instead.',
      });
      return;
    }

    // Secure password hashing
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Save citizen to database
    const insertResult = await dbExecute(
      `INSERT INTO users (name, email, mobile, password_hash, role) VALUES (?, ?, ?, ?, 'citizen')`,
      [name.trim(), sanitizedEmail, mobileClean, passwordHash]
    );

    const userProfile = {
      id: insertResult.insertId,
      name: name.trim(),
      email: sanitizedEmail,
      mobile: mobileClean,
      role: 'citizen' as const,
    };

    const token = generateToken(userProfile);

    res.status(201).json({
      success: true,
      message: 'Citizen registration completed successfully.',
      token,
      user: userProfile,
    });
  } catch (err: any) {
    console.error('[Auth Register Error]:', err);
    res.status(500).json({
      success: false,
      message: 'An error occurred during account registration. Please try again.',
    });
  }
});

// Citizen & Admin Login
router.post('/login', loginLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
      return;
    }

    const sanitizedEmail = String(email).trim().toLowerCase();

    const rows = await dbQuery<{
      id: number;
      name: string;
      email: string;
      mobile: string;
      password_hash: string;
      role: 'citizen' | 'admin';
    }>('SELECT id, name, email, mobile, password_hash, role FROM users WHERE email = ?', [
      sanitizedEmail,
    ]);

    if (!rows || rows.length === 0) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please verify your credentials.',
      });
      return;
    }

    const user = rows[0];
    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please verify your credentials.',
      });
      return;
    }

    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
    };

    const token = generateToken(userProfile);

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: userProfile,
    });
  } catch (err: any) {
    console.error('[Auth Login Error]:', err);
    res.status(500).json({
      success: false,
      message: 'Authentication service temporarily unavailable.',
    });
  }
});

// Get Current User Profile
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  res.json({
    success: true,
    user: req.user,
  });
});

// Logout
router.post('/logout', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});

export default router;
