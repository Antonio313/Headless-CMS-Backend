import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../utils/database';
import { Wishlist, WishlistItem, Product } from '../../types';

const router = Router();

/**
 * POST /api/wishlists
 * Create a new wishlist
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, email, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Wishlist must contain at least one item' });
      return;
    }

    const wishlistId = uuidv4();
    const shareToken = uuidv4();

    const wishlist: Wishlist = {
      id: wishlistId,
      name: name || 'My Wishlist',
      email: email || undefined,
      shareToken,
      items: items.map((productId: string) => ({
        id: uuidv4(),
        wishlistId,
        productId,
        addedAt: new Date().toISOString()
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.create('wishlists', wishlist);

    res.status(201).json({
      wishlistId,
      shareToken,
      message: 'Wishlist created successfully'
    });
  } catch (error) {
    console.error('Error creating wishlist:', error);
    res.status(500).json({ error: 'Failed to create wishlist' });
  }
});

/**
 * GET /api/wishlists/:shareToken
 * Get wishlist by share token with full product details
 */
router.get('/:shareToken', (req: Request, res: Response) => {
  try {
    const { shareToken } = req.params;

    const wishlist = db.getBy('wishlists', 'shareToken', shareToken)[0];

    if (!wishlist) {
      res.status(404).json({ error: 'Wishlist not found' });
      return;
    }

    // Get full product details for each item
    const products = db.getAll('products');
    const brands = db.getAll('brands');

    const enrichedItems = wishlist.items.map((item: WishlistItem) => {
      const product = products.find((p: Product) => p.id === item.productId);
      const brand = product ? brands.find((b) => b.id === product.brandId) : null;

      return {
        ...item,
        product: product ? { ...product, brand } : null
      };
    }).filter(item => item.product !== null);

    res.json({
      ...wishlist,
      items: enrichedItems
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

/**
 * POST /api/wishlists/:shareToken/items
 * Add item to existing wishlist
 */
router.post('/:shareToken/items', (req: Request, res: Response) => {
  try {
    const { shareToken } = req.params;
    const { productId, notes } = req.body;

    if (!productId) {
      res.status(400).json({ error: 'Product ID is required' });
      return;
    }

    const wishlist = db.getBy('wishlists', 'shareToken', shareToken)[0];

    if (!wishlist) {
      res.status(404).json({ error: 'Wishlist not found' });
      return;
    }

    // Check if product already in wishlist
    const existingItem = wishlist.items.find((item: WishlistItem) => item.productId === productId);

    if (existingItem) {
      res.status(400).json({ error: 'Product already in wishlist' });
      return;
    }

    const newItem: WishlistItem = {
      id: uuidv4(),
      wishlistId: wishlist.id,
      productId,
      notes: notes || undefined,
      addedAt: new Date().toISOString()
    };

    wishlist.items.push(newItem);

    db.update('wishlists', wishlist.id, {
      items: wishlist.items,
      updatedAt: new Date().toISOString()
    });

    res.json({
      message: 'Item added to wishlist',
      item: newItem
    });
  } catch (error) {
    console.error('Error adding item to wishlist:', error);
    res.status(500).json({ error: 'Failed to add item to wishlist' });
  }
});

/**
 * DELETE /api/wishlists/:shareToken/items/:productId
 * Remove item from wishlist
 */
router.delete('/:shareToken/items/:productId', (req: Request, res: Response) => {
  try {
    const { shareToken, productId } = req.params;

    const wishlist = db.getBy('wishlists', 'shareToken', shareToken)[0];

    if (!wishlist) {
      res.status(404).json({ error: 'Wishlist not found' });
      return;
    }

    const itemIndex = wishlist.items.findIndex((item: WishlistItem) => item.productId === productId);

    if (itemIndex === -1) {
      res.status(404).json({ error: 'Item not found in wishlist' });
      return;
    }

    wishlist.items.splice(itemIndex, 1);

    db.update('wishlists', wishlist.id, {
      items: wishlist.items,
      updatedAt: new Date().toISOString()
    });

    res.json({ message: 'Item removed from wishlist' });
  } catch (error) {
    console.error('Error removing item from wishlist:', error);
    res.status(500).json({ error: 'Failed to remove item from wishlist' });
  }
});

export default router;
