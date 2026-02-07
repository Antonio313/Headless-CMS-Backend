import { Router, Request, Response } from 'express';
import { db } from '../../utils/database';
import { Tag } from '../../types';

const router = Router();

/**
 * GET /api/tags
 * Get all tags (public view)
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const tags = db.getAll('tags');

    // Sort tags alphabetically
    const sortedTags = tags.sort((a: Tag, b: Tag) =>
      a.name.localeCompare(b.name)
    );

    res.json({ tags: sortedTags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

export default router;
