import { Router, Request, Response } from 'express';
import { db } from '../../utils/database';

const router = Router();

/**
 * GET /api/brands
 * Get all brands
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const brands = db.getAll('brands');
    res.json({ brands });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

/**
 * GET /api/brands/:slug
 * Get single brand by slug
 */
router.get('/:slug', (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const brand = db.getBy('brands', 'slug', slug)[0];

    if (!brand) {
      res.status(404).json({ error: 'Brand not found' });
      return;
    }

    // Get products count for this brand
    const products = db.getBy('products', 'brandId', brand.id);

    res.json({
      ...brand,
      productCount: products.length
    });
  } catch (error) {
    console.error('Error fetching brand:', error);
    res.status(500).json({ error: 'Failed to fetch brand' });
  }
});

export default router;
