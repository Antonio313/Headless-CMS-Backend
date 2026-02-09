import { Router, Request, Response } from 'express';
import { db } from '../../utils/database';
import { Wishlist, WishlistItem, Product, Lead, LeadNote } from '../../types';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * GET /api/admin/wishlists
 * Get all wishlists
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { limit = '50', page = '1' } = req.query;

    const wishlists = db.getAll('wishlists');

    // Sort by creation date (newest first)
    wishlists.sort((a: Wishlist, b: Wishlist) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Pagination
    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    const paginatedWishlists = wishlists.slice(startIndex, endIndex);

    // Enrich with item count, total value, and full product details
    const products = db.getAll('products');
    const brands = db.getAll('brands');

    const enrichedWishlists = paginatedWishlists.map((wishlist: Wishlist) => {
      // Enrich each item with product and brand details
      const enrichedItems = wishlist.items.map((item: WishlistItem) => {
        const product = products.find((p: Product) => p.id === item.productId);
        const brand = product ? brands.find((b) => b.id === product.brandId) : null;

        return {
          ...item,
          product: product ? { ...product, brand } : null
        };
      });

      // Calculate total value from enriched items
      const totalValue = enrichedItems.reduce((total, item) => {
        return total + (item.product?.price || 0);
      }, 0);

      return {
        ...wishlist,
        items: enrichedItems,
        itemCount: wishlist.items.length,
        totalValue
      };
    });

    res.json({
      wishlists: enrichedWishlists,
      pagination: {
        total: wishlists.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(wishlists.length / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching wishlists:', error);
    res.status(500).json({ error: 'Failed to fetch wishlists' });
  }
});

/**
 * GET /api/admin/wishlists/:id
 * Get single wishlist with full details
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const wishlist = db.getById('wishlists', id) as Wishlist;

    if (!wishlist) {
      res.status(404).json({ error: 'Wishlist not found' });
      return;
    }

    // Get full product details
    const products = db.getAll('products');
    const brands = db.getAll('brands');

    const enrichedItems = wishlist.items.map((item: WishlistItem) => {
      const product = products.find((p: Product) => p.id === item.productId);
      const brand = product ? brands.find((b) => b.id === product.brandId) : null;

      return {
        ...item,
        product: product ? { ...product, brand } : null
      };
    });

    // Check if there's a lead associated with this wishlist
    const lead = db.getBy('leads', 'wishlistId', id)[0];

    res.json({
      wishlist: {
        ...wishlist,
        items: enrichedItems
      },
      lead
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

/**
 * DELETE /api/admin/wishlists/:id
 * Delete wishlist
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = db.delete('wishlists', id);

    if (!deleted) {
      res.status(404).json({ error: 'Wishlist not found' });
      return;
    }

    // Cascade: delete linked leads and their notes
    const linkedLeads = db.getBy('leads', 'wishlistId', id) as Lead[];
    let deletedLeadsCount = 0;

    linkedLeads.forEach((lead: Lead) => {
      // Delete lead notes first
      const notes = db.getBy('leadNotes', 'leadId', lead.id) as LeadNote[];
      notes.forEach((note: LeadNote) => {
        db.delete('leadNotes', note.id);
      });
      // Delete the lead
      db.delete('leads', lead.id);
      deletedLeadsCount++;
    });

    res.json({
      message: 'Wishlist deleted successfully',
      deletedLeads: deletedLeadsCount
    });
  } catch (error) {
    console.error('Error deleting wishlist:', error);
    res.status(500).json({ error: 'Failed to delete wishlist' });
  }
});

export default router;
