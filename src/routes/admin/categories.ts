import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { db } from '../../utils/database';
import { Category, Subcategory } from '../../types';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { generateSlug, ensureUniqueSlug } from '../../services/seo';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Category validation schema
const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional()
});

const subcategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  categoryId: z.string().uuid()
});

/**
 * GET /api/admin/categories
 * Get all categories with subcategories
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const categories = db.getAll('categories');
    const subcategories = db.getAll('subcategories');

    const categoriesWithSubs = categories.map((cat: Category) => ({
      ...cat,
      subcategories: subcategories
        .filter((sub: Subcategory) => sub.categoryId === cat.id)
        .map((sub: Subcategory) => ({
          ...sub,
          productCount: db.getBy('products', 'subcategoryId', sub.id).length
        })),
      productCount: db.getBy('products', 'categoryId', cat.id).length
    }));

    res.json({ categories: categoriesWithSubs });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * POST /api/admin/categories
 * Create new category
 */
router.post('/', validate(categorySchema), (req: Request, res: Response) => {
  try {
    const data = req.body;

    const slug = data.slug || generateSlug(data.name);
    const existingSlugs = db.getAll('categories').map((c: Category) => c.slug);
    const uniqueSlug = ensureUniqueSlug(slug, existingSlugs);

    const category: Category = {
      id: uuidv4(),
      name: data.name,
      slug: uniqueSlug,
      description: data.description,
      icon: data.icon,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.create('categories', category);

    res.status(201).json({ category });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

/**
 * PUT /api/admin/categories/:id
 * Update category
 */
router.put('/:id', validate(categorySchema.partial()), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existingCategory = db.getById('categories', id);

    if (!existingCategory) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    if (updates.slug && updates.slug !== existingCategory.slug) {
      const existingSlugs = db.getAll('categories')
        .filter((c: Category) => c.id !== id)
        .map((c: Category) => c.slug);
      updates.slug = ensureUniqueSlug(updates.slug, existingSlugs);
    }

    const updatedCategory = db.update('categories', id, updates);

    res.json({ category: updatedCategory });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

/**
 * DELETE /api/admin/categories/:id
 * Delete category
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if category has products
    const products = db.getBy('products', 'categoryId', id);
    if (products.length > 0) {
      res.status(400).json({
        error: 'Cannot delete category with existing products',
        productCount: products.length
      });
      return;
    }

    // Delete subcategories
    const subcategories = db.getBy('subcategories', 'categoryId', id);
    subcategories.forEach((sub: Subcategory) => {
      db.delete('subcategories', sub.id);
    });

    const deleted = db.delete('categories', id);

    if (!deleted) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

/**
 * POST /api/admin/categories/:categoryId/subcategories
 * Create subcategory
 */
router.post('/:categoryId/subcategories', validate(subcategorySchema), (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const data = req.body;

    // Verify category exists
    const category = db.getById('categories', categoryId);
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const slug = data.slug || generateSlug(data.name);
    const existingSlugs = db.getAll('subcategories').map((s: Subcategory) => s.slug);
    const uniqueSlug = ensureUniqueSlug(slug, existingSlugs);

    const subcategory: Subcategory = {
      id: uuidv4(),
      name: data.name,
      slug: uniqueSlug,
      categoryId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.create('subcategories', subcategory);

    res.status(201).json({ subcategory });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    res.status(500).json({ error: 'Failed to create subcategory' });
  }
});

/**
 * DELETE /api/admin/subcategories/:id
 * Delete subcategory with optional product reassignment
 * Body: { reassignTo?: string | null } - subcategoryId to reassign products to, or null to clear
 */
router.delete('/subcategories/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reassignTo } = req.body || {};

    const subcategory = db.getById('subcategories', id);
    if (!subcategory) {
      res.status(404).json({ error: 'Subcategory not found' });
      return;
    }

    // Check for products in this subcategory
    const affectedProducts = db.getBy('products', 'subcategoryId', id);

    // If products exist and no reassignment specified, return info for the frontend
    if (affectedProducts.length > 0 && reassignTo === undefined) {
      res.status(400).json({
        error: 'Subcategory has associated products',
        productCount: affectedProducts.length,
        requiresReassignment: true
      });
      return;
    }

    // Reassign products if needed
    if (affectedProducts.length > 0) {
      affectedProducts.forEach((product: any) => {
        db.update('products', product.id, {
          subcategoryId: reassignTo || undefined
        });
      });
    }

    const deleted = db.delete('subcategories', id);

    if (!deleted) {
      res.status(404).json({ error: 'Subcategory not found' });
      return;
    }

    res.json({
      message: 'Subcategory deleted successfully',
      reassignedProducts: affectedProducts.length
    });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    res.status(500).json({ error: 'Failed to delete subcategory' });
  }
});

export default router;
