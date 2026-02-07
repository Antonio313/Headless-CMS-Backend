import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../utils/database';
import { generateToken } from '../../utils/jwt';
import { comparePassword } from '../../utils/password';
import { validate } from '../../middleware/validation';
import { AdminUser } from '../../types';

const router = Router();

// Validation schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

/**
 * POST /api/admin/auth/login
 * Admin login
 */
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = db.getBy('adminUsers', 'email', email)[0] as AdminUser;

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(403).json({ error: 'Account is disabled' });
      return;
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate token
    const token = generateToken(user);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/admin/auth/me
 * Get current user (requires authentication)
 */
router.get('/me', (_req: Request, res: Response) => {
  try {
    // This route would typically use the authenticate middleware
    // For now, return a placeholder
    res.json({ message: 'Add authenticate middleware to this route' });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;
