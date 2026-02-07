import { Router, Request, Response } from 'express';
import { db } from '../../utils/database';
import { Category, Subcategory } from '../../types';

const router = Router();

/**
 * GET /api/categories
 * Get all categories with nested subcategories
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const categories = db.getAll('categories');
    const subcategories = db.getAll('subcategories');

    // Build nested structure
    const categoriesWithSubs = categories.map((cat: Category) => ({
      ...cat,
      subcategories: subcategories.filter((sub: Subcategory) => sub.categoryId === cat.id)
    }));

    res.json({ categories: categoriesWithSubs });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;
