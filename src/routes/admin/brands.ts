import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { db } from '../../utils/database';
import { Brand } from '../../types';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { generateSlug, ensureUniqueSlug } from '../../services/seo';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Brand validation schema
const brandSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  website: z.string().optional(),
  featured: z.boolean().optional()
});

/**
 * GET /api/admin/brands
 * Get all brands
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const brands = db.getAll('brands');

    // Add product count for each brand
    const enrichedBrands = brands.map((brand: Brand) => {
      const productCount = db.getBy('products', 'brandId', brand.id).length;
      return { ...brand, productCount };
    });

    res.json({ brands: enrichedBrands });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

/**
 * GET /api/admin/brands/:id
 * Get single brand
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const brand = db.getById('brands', id);

    if (!brand) {
      res.status(404).json({ error: 'Brand not found' });
      return;
    }

    const productCount = db.getBy('products', 'brandId', id).length;

    res.json({
      brand: { ...brand, productCount }
    });
  } catch (error) {
    console.error('Error fetching brand:', error);
    res.status(500).json({ error: 'Failed to fetch brand' });
  }
});

/**
 * POST /api/admin/brands
 * Create new brand
 */
router.post('/', validate(brandSchema), (req: Request, res: Response) => {
  try {
    const data = req.body;

    // Generate slug if not provided
    const slug = data.slug || generateSlug(data.name);
    const existingSlugs = db.getAll('brands').map((b: Brand) => b.slug);
    const uniqueSlug = ensureUniqueSlug(slug, existingSlugs);

    const brand: Brand = {
      id: uuidv4(),
      name: data.name,
      slug: uniqueSlug,
      description: data.description,
      logo: data.logo,
      website: data.website,
      featured: data.featured || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.create('brands', brand);

    res.status(201).json({ brand });
  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(500).json({ error: 'Failed to create brand' });
  }
});

/**
 * PUT /api/admin/brands/:id
 * Update brand
 */
router.put('/:id', validate(brandSchema.partial()), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existingBrand = db.getById('brands', id);

    if (!existingBrand) {
      res.status(404).json({ error: 'Brand not found' });
      return;
    }

    // If slug is being updated, ensure it's unique
    if (updates.slug && updates.slug !== existingBrand.slug) {
      const existingSlugs = db.getAll('brands')
        .filter((b: Brand) => b.id !== id)
        .map((b: Brand) => b.slug);
      updates.slug = ensureUniqueSlug(updates.slug, existingSlugs);
    }

    const updatedBrand = db.update('brands', id, updates);

    res.json({ brand: updatedBrand });
  } catch (error) {
    console.error('Error updating brand:', error);
    res.status(500).json({ error: 'Failed to update brand' });
  }
});

/**
 * DELETE /api/admin/brands/:id
 * Delete brand
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if brand has products
    const products = db.getBy('products', 'brandId', id);
    if (products.length > 0) {
      res.status(400).json({
        error: 'Cannot delete brand with existing products',
        productCount: products.length
      });
      return;
    }

    const deleted = db.delete('brands', id);

    if (!deleted) {
      res.status(404).json({ error: 'Brand not found' });
      return;
    }

    res.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ error: 'Failed to delete brand' });
  }
});

export default router;
