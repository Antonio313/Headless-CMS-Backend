import { Router, Request, Response } from 'express';
import { db } from '../../utils/database';
import { authenticate } from '../../middleware/auth';
import { Customer, Lead, Wishlist, Product, Brand } from '../../types';
import { getLeadCategory } from '../../services/leadScoring';

const router = Router();

router.use(authenticate);

/**
 * GET /api/admin/customers
 * List all customers with enriched data
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const customers = db.getAll('customers') as Customer[];
    const allLeads = db.getAll('leads') as Lead[];
    const allWishlists = db.getAll('wishlists') as Wishlist[];

    const enriched = customers.map((customer) => {
      const customerLeads = allLeads.filter(
        (l: Lead) => l.customerId === customer.id || l.email === customer.email
      );
      const customerWishlists = allWishlists.filter(
        (w: Wishlist) => w.customerId === customer.id || w.email === customer.email
      );

      const highestScore = customerLeads.length > 0
        ? Math.max(...customerLeads.map(l => l.score))
        : 0;

      const hasConverted = customerLeads.some(l => l.status === 'CONVERTED');

      const { password: _, ...customerWithoutPassword } = customer;

      return {
        ...customerWithoutPassword,
        totalCollections: customerWishlists.length,
        totalLeads: customerLeads.length,
        highestScore,
        hasConverted
      };
    });

    res.json({ customers: enriched });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

/**
 * GET /api/admin/customers/stats
 * Customer statistics
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    const customers = db.getAll('customers') as Customer[];
    const allLeads = db.getAll('leads') as Lead[];

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const newThisMonth = customers.filter(
      (c: Customer) => new Date(c.createdAt) >= thirtyDaysAgo
    ).length;

    const withConversions = customers.filter((customer: Customer) => {
      return allLeads.some(
        (l: Lead) => (l.customerId === customer.id || l.email === customer.email) && l.status === 'CONVERTED'
      );
    }).length;

    const customerScores = customers.map((customer: Customer) => {
      const customerLeads = allLeads.filter(
        (l: Lead) => l.customerId === customer.id || l.email === customer.email
      );
      return customerLeads.length > 0
        ? Math.max(...customerLeads.map(l => l.score))
        : 0;
    });

    const avgScore = customerScores.length > 0
      ? customerScores.reduce((a, b) => a + b, 0) / customerScores.length
      : 0;

    res.json({
      stats: {
        total: customers.length,
        newThisMonth,
        withConversions,
        avgScore: Math.round(avgScore)
      }
    });
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    res.status(500).json({ error: 'Failed to fetch customer stats' });
  }
});

/**
 * GET /api/admin/customers/:id
 * Full customer detail with wishlists, leads, and score breakdowns
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customer = db.getById('customers', id) as Customer | undefined;

    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const allLeads = db.getAll('leads') as Lead[];
    const allWishlists = db.getAll('wishlists') as Wishlist[];
    const products = db.getAll('products') as Product[];
    const brands = db.getAll('brands') as Brand[];

    const customerLeads = allLeads.filter(
      (l: Lead) => l.customerId === customer.id || l.email === customer.email
    ).map((lead: Lead) => ({
      ...lead,
      category: getLeadCategory(lead.score)
    }));

    const customerWishlists = allWishlists.filter(
      (w: Wishlist) => w.customerId === customer.id || w.email === customer.email
    ).map((wishlist: Wishlist) => {
      const enrichedItems = wishlist.items.map((item) => {
        const product = products.find((p: Product) => p.id === item.productId);
        const brand = product ? brands.find((b: Brand) => b.id === product.brandId) : null;
        return {
          ...item,
          product: product ? { ...product, brand } : null
        };
      });

      const totalValue = enrichedItems.reduce((sum, item) => {
        return sum + ((item.product as any)?.price || 0);
      }, 0);

      return {
        ...wishlist,
        items: enrichedItems,
        totalValue,
        itemCount: wishlist.items.length
      };
    });

    const { password: _, ...customerWithoutPassword } = customer;

    res.json({
      customer: customerWithoutPassword,
      wishlists: customerWishlists,
      leads: customerLeads
    });
  } catch (error) {
    console.error('Error fetching customer detail:', error);
    res.status(500).json({ error: 'Failed to fetch customer detail' });
  }
});

/**
 * PUT /api/admin/customers/:id
 * Toggle customer isActive status
 */
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const customer = db.getById('customers', id) as Customer | undefined;

    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const updated = db.update('customers', id, { isActive }) as Customer;
    const { password: _, ...customerWithoutPassword } = updated;

    res.json({ customer: customerWithoutPassword });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

export default router;
