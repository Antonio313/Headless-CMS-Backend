import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../utils/database';
import { generateCustomerToken } from '../../utils/jwt';
import { hashPassword, comparePassword } from '../../utils/password';
import { validate } from '../../middleware/validation';
import { authenticateCustomer } from '../../middleware/auth';
import { Customer, Wishlist, Lead } from '../../types';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
});

/**
 * POST /api/customer/auth/register
 */
router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Check if email already exists
    const existing = db.getBy('customers', 'email', email)[0];
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    // Also check admin users to prevent overlap
    const adminWithEmail = db.getBy('adminUsers', 'email', email)[0];
    if (adminWithEmail) {
      res.status(409).json({ error: 'This email is already in use' });
      return;
    }

    const hashedPw = await hashPassword(password);
    const now = new Date().toISOString();

    const customer: Customer = {
      id: uuidv4(),
      email,
      password: hashedPw,
      firstName,
      lastName,
      phone,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    db.create('customers', customer);

    // Retroactively link existing wishlists/leads by email
    const existingWishlists = db.getAll('wishlists').filter(
      (w: Wishlist) => w.email === email && !w.customerId
    );
    existingWishlists.forEach((w: Wishlist) => {
      db.update('wishlists', w.id, { customerId: customer.id });
    });

    const existingLeads = db.getAll('leads').filter(
      (l: Lead) => l.email === email && !l.customerId
    );
    existingLeads.forEach((l: Lead) => {
      db.update('leads', l.id, { customerId: customer.id });
    });

    const token = generateCustomerToken(customer);

    const { password: _, ...customerWithoutPassword } = customer;

    res.status(201).json({
      token,
      customer: customerWithoutPassword
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/customer/auth/login
 */
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const customer = db.getBy('customers', 'email', email)[0] as Customer;

    if (!customer) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!customer.isActive) {
      res.status(403).json({ error: 'Account is disabled' });
      return;
    }

    const isPasswordValid = await comparePassword(password, customer.password);

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Update last login
    db.update('customers', customer.id, { lastLoginAt: new Date().toISOString() });

    const token = generateCustomerToken(customer);

    const { password: _, ...customerWithoutPassword } = customer;

    res.json({
      token,
      customer: customerWithoutPassword
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/customer/auth/me
 */
router.get('/me', authenticateCustomer, (req: Request, res: Response) => {
  try {
    const customer = db.getById('customers', req.user!.userId) as Customer;

    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const { password: _, ...customerWithoutPassword } = customer;
    res.json({ customer: customerWithoutPassword });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

/**
 * PUT /api/customer/auth/me
 */
router.put('/me', authenticateCustomer, validate(updateProfileSchema), (req: Request, res: Response) => {
  try {
    const updates: Partial<Customer> = {};
    if (req.body.firstName !== undefined) updates.firstName = req.body.firstName;
    if (req.body.lastName !== undefined) updates.lastName = req.body.lastName;
    if (req.body.phone !== undefined) updates.phone = req.body.phone;

    const updated = db.update('customers', req.user!.userId, updates);

    if (!updated) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const { password: _, ...customerWithoutPassword } = updated as Customer;
    res.json({ customer: customerWithoutPassword });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * PUT /api/customer/auth/password
 */
router.put('/password', authenticateCustomer, validate(changePasswordSchema), async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const customer = db.getById('customers', req.user!.userId) as Customer;
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const isValid = await comparePassword(currentPassword, customer.password);
    if (!isValid) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    const hashedPw = await hashPassword(newPassword);
    db.update('customers', customer.id, { password: hashedPw });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
