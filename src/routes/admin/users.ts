import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { db } from '../../utils/database';
import { AdminUser, AdminRole } from '../../types';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { hashPassword } from '../../utils/password';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Admin user validation schema
const adminUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.nativeEnum(AdminRole),
  isActive: z.boolean().optional()
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.nativeEnum(AdminRole).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional()
});

/**
 * GET /api/admin/users
 * Get all admin users (only for Super Admin)
 */
router.get('/', authorize(AdminRole.SUPER_ADMIN), (_req: Request, res: Response) => {
  try {
    const users = db.getAll('adminUsers');

    // Remove passwords from response
    const usersWithoutPasswords = users.map((user: AdminUser) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json({ users: usersWithoutPasswords });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/admin/users/:id
 * Get single admin user
 */
router.get('/:id', authorize(AdminRole.SUPER_ADMIN), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = db.getById('adminUsers', id) as AdminUser;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * POST /api/admin/users
 * Create new admin user (only for Super Admin)
 */
router.post('/', authorize(AdminRole.SUPER_ADMIN), validate(adminUserSchema), async (req: Request, res: Response) => {
  try {
    const data = req.body;

    // Check if email already exists
    const existingUser = db.getBy('adminUsers', 'email', data.email)[0];
    if (existingUser) {
      res.status(400).json({ error: 'Email already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    const newUser: AdminUser = {
      id: uuidv4(),
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.create('adminUsers', newUser);

    // Remove password from response
    const { password, ...userWithoutPassword } = newUser;

    res.status(201).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update admin user (only for Super Admin)
 */
router.put('/:id', authorize(AdminRole.SUPER_ADMIN), validate(updateUserSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existingUser = db.getById('adminUsers', id) as AdminUser;

    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if email is being changed and if it already exists
    if (updates.email && updates.email !== existingUser.email) {
      const emailExists = db.getBy('adminUsers', 'email', updates.email)[0];
      if (emailExists) {
        res.status(400).json({ error: 'Email already exists' });
        return;
      }
    }

    // Hash password if it's being updated
    if (updates.password) {
      updates.password = await hashPassword(updates.password);
    }

    updates.updatedAt = new Date().toISOString();

    const updatedUser = db.update('adminUsers', id, updates);

    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;

    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete admin user (only for Super Admin)
 */
router.delete('/:id', authorize(AdminRole.SUPER_ADMIN), (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    const currentUser = (req as any).user;
    if (currentUser.id === id) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }

    const deleted = db.delete('adminUsers', id);

    if (!deleted) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
