import { Router, Request, Response } from 'express';
import { db } from '../../utils/database';
import { authenticateCustomer } from '../../middleware/auth';
import { Wishlist, WishlistItem, Product, Brand, Lead } from '../../types';

const router = Router();

router.use(authenticateCustomer);

/**
 * GET /api/customer/jewelry-box
 * Get all wishlists and leads for the authenticated customer
 */
router.get('/jewelry-box', (req: Request, res: Response) => {
  try {
    const customerId = req.user!.userId;
    const customerEmail = req.user!.email;

    // Get all wishlists for this customer (by customerId or email)
    const allWishlists = db.getAll('wishlists');
    const customerWishlists = allWishlists.filter(
      (w: Wishlist) => w.customerId === customerId || w.email === customerEmail
    );

    // Enrich wishlists with product data
    const products = db.getAll('products');
    const brands = db.getAll('brands');

    const enrichedWishlists = customerWishlists.map((wishlist: Wishlist) => {
      const enrichedItems = wishlist.items.map((item: WishlistItem) => {
        const product = products.find((p: Product) => p.id === item.productId);
        const brand = product ? brands.find((b: Brand) => b.id === product.brandId) : null;
        return {
          ...item,
          product: product ? { ...product, brand } : null
        };
      });

      const totalValue = enrichedItems.reduce((sum, item) => {
        return sum + (item.product?.price || 0);
      }, 0);

      return {
        ...wishlist,
        items: enrichedItems,
        totalValue,
        itemCount: wishlist.items.length
      };
    });

    // Get all leads for this customer
    const allLeads = db.getAll('leads');
    const customerLeads = allLeads.filter(
      (l: Lead) => l.customerId === customerId || l.email === customerEmail
    );

    res.json({
      wishlists: enrichedWishlists,
      leads: customerLeads,
      totalCollections: enrichedWishlists.length,
      totalLeads: customerLeads.length
    });
  } catch (error) {
    console.error('Error fetching jewelry box:', error);
    res.status(500).json({ error: 'Failed to fetch jewelry box' });
  }
});

/**
 * GET /api/customer/jewelry-box/:wishlistId
 * Get a single collection detail
 */
router.get('/jewelry-box/:wishlistId', (req: Request, res: Response) => {
  try {
    const customerId = req.user!.userId;
    const customerEmail = req.user!.email;
    const { wishlistId } = req.params;

    const wishlist = db.getById('wishlists', wishlistId) as Wishlist | undefined;

    if (!wishlist) {
      res.status(404).json({ error: 'Collection not found' });
      return;
    }

    // Verify ownership
    if (wishlist.customerId !== customerId && wishlist.email !== customerEmail) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Enrich with product data
    const products = db.getAll('products');
    const brands = db.getAll('brands');

    const enrichedItems = wishlist.items.map((item: WishlistItem) => {
      const product = products.find((p: Product) => p.id === item.productId);
      const brand = product ? brands.find((b: Brand) => b.id === product.brandId) : null;
      return {
        ...item,
        product: product ? { ...product, brand } : null
      };
    });

    const totalValue = enrichedItems.reduce((sum, item) => {
      return sum + (item.product?.price || 0);
    }, 0);

    // Get linked lead if any
    const lead = db.getAll('leads').find(
      (l: Lead) => l.wishlistId === wishlistId
    );

    res.json({
      wishlist: {
        ...wishlist,
        items: enrichedItems,
        totalValue,
        itemCount: wishlist.items.length
      },
      lead: lead || null
    });
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

export default router;
