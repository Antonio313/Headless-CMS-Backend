import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { db } from '../../utils/database';
import { Tag, Product } from '../../types';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { generateSlug, ensureUniqueSlug } from '../../services/seo';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Tag validation schema
const tagSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  featured: z.boolean().optional()
});

/**
 * GET /api/admin/tags
 * Get all tags
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const tags = db.getAll('tags');

    // Add product count for each tag
    const enrichedTags = tags.map((tag: Tag) => {
      const products = db.getAll('products') as Product[];
      const productCount = products.filter((p: Product) =>
        p.tagIds?.includes(tag.id)
      ).length;
      return { ...tag, productCount };
    });

    res.json({ tags: enrichedTags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

/**
 * GET /api/admin/tags/:id
 * Get single tag
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tag = db.getById('tags', id);

    if (!tag) {
      res.status(404).json({ error: 'Tag not found' });
      return;
    }

    const products = db.getAll('products') as Product[];
    const productCount = products.filter((p: Product) =>
      p.tagIds?.includes(id)
    ).length;

    res.json({
      tag: { ...tag, productCount }
    });
  } catch (error) {
    console.error('Error fetching tag:', error);
    res.status(500).json({ error: 'Failed to fetch tag' });
  }
});

/**
 * POST /api/admin/tags
 * Create new tag
 */
router.post('/', validate(tagSchema), (req: Request, res: Response) => {
  try {
    const data = req.body;

    // Generate slug if not provided
    const slug = data.slug || generateSlug(data.name);
    const existingSlugs = db.getAll('tags').map((t: Tag) => t.slug);
    const uniqueSlug = ensureUniqueSlug(slug, existingSlugs);

    const tag: Tag = {
      id: uuidv4(),
      name: data.name,
      slug: uniqueSlug,
      description: data.description,
      color: data.color || '#3B82F6', // Default blue color
      featured: data.featured || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.create('tags', tag);

    res.status(201).json({ tag });
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

/**
 * PUT /api/admin/tags/:id
 * Update tag
 */
router.put('/:id', validate(tagSchema.partial()), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existingTag = db.getById('tags', id);

    if (!existingTag) {
      res.status(404).json({ error: 'Tag not found' });
      return;
    }

    // If slug is being updated, ensure it's unique
    if (updates.slug && updates.slug !== existingTag.slug) {
      const existingSlugs = db.getAll('tags')
        .filter((t: Tag) => t.id !== id)
        .map((t: Tag) => t.slug);
      updates.slug = ensureUniqueSlug(updates.slug, existingSlugs);
    }

    const updatedTag = db.update('tags', id, updates);

    res.json({ tag: updatedTag });
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

/**
 * DELETE /api/admin/tags/:id
 * Delete tag
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if tag is used by any products
    const products = db.getAll('products') as Product[];
    const productsWithTag = products.filter((p: Product) =>
      p.tagIds?.includes(id)
    );

    if (productsWithTag.length > 0) {
      res.status(400).json({
        error: 'Cannot delete tag with existing products',
        productCount: productsWithTag.length
      });
      return;
    }

    const deleted = db.delete('tags', id);

    if (!deleted) {
      res.status(404).json({ error: 'Tag not found' });
      return;
    }

    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

export default router;
