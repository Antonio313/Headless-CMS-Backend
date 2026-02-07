import { Router, Request, Response } from 'express';
import { db } from '../../utils/database';
import { Product, ProductStatus, Brand, Category, Tag } from '../../types';

const router = Router();

/**
 * GET /api/products
 * Get all published products with filters and pagination
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const {
      brand,
      category,
      subcategory,
      limit = '100',
      page = '1',
      sort = 'createdAt_desc',
      search,
      minPrice,
      maxPrice,
      inStock,
      featured,
      isNew,
      tags,
      metalType,
      metalPurity,
      gemstone
    } = req.query;

    let products = db.getAll('products').filter(
      (p: Product) => p.status === ProductStatus.PUBLISHED
    );

    // Apply filters
    if (brand) {
      const brandData = db.getBy('brands', 'slug', brand)[0];
      if (brandData) {
        products = products.filter((p: Product) => p.brandId === brandData.id);
      }
    }

    if (category) {
      const categoryData = db.getBy('categories', 'slug', category)[0];
      if (categoryData) {
        products = products.filter((p: Product) => p.categoryId === categoryData.id);
      }
    }

    if (subcategory) {
      const subcategoryData = db.getBy('subcategories', 'slug', subcategory)[0];
      if (subcategoryData) {
        products = products.filter((p: Product) => p.subcategoryId === subcategoryData.id);
      }
    }

    if (search) {
      const searchLower = (search as string).toLowerCase();
      products = products.filter((p: Product) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.sku.toLowerCase().includes(searchLower)
      );
    }

    if (minPrice) {
      products = products.filter((p: Product) => p.price >= parseFloat(minPrice as string));
    }

    if (maxPrice) {
      products = products.filter((p: Product) => p.price <= parseFloat(maxPrice as string));
    }

    if (inStock === 'true') {
      products = products.filter((p: Product) => p.inStock);
    }

    if (featured === 'true') {
      products = products.filter((p: Product) => p.featured);
    }

    if (isNew === 'true') {
      products = products.filter((p: Product) => p.isNew);
    }

    // Filter by tags
    if (tags) {
      const tagSlugs = (tags as string).split(',').map(s => s.trim());
      const tagData = db.getAll('tags').filter((t: Tag) =>
        tagSlugs.includes(t.slug)
      );
      const tagIds = tagData.map((t: Tag) => t.id);
      products = products.filter((p: Product) =>
        p.tagIds?.some(id => tagIds.includes(id))
      );
    }

    // Filter by metal type
    if (metalType) {
      const types = (metalType as string).split(',').map(s => s.trim().toLowerCase());
      products = products.filter((p: Product) =>
        p.metalType && types.includes(p.metalType.toLowerCase())
      );
    }

    // Filter by metal purity
    if (metalPurity) {
      const purities = (metalPurity as string).split(',').map(s => s.trim().toLowerCase());
      products = products.filter((p: Product) =>
        p.metalPurity && purities.includes(p.metalPurity.toLowerCase())
      );
    }

    // Filter by gemstone
    if (gemstone) {
      const gemstones = (gemstone as string).split(',').map(s => s.trim().toLowerCase());
      products = products.filter((p: Product) =>
        p.gemstone && gemstones.includes(p.gemstone.toLowerCase())
      );
    }

    // Apply sorting
    const [sortField, sortOrder] = (sort as string).split('_');
    products.sort((a: any, b: any) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    // Pagination
    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    const paginatedProducts = products.slice(startIndex, endIndex);

    // Enrich with brand, category, and tags data
    const brands = db.getAll('brands');
    const categories = db.getAll('categories');
    const allTags = db.getAll('tags');

    const enrichedProducts = paginatedProducts.map((p: Product) => ({
      ...p,
      brand: brands.find((b: Brand) => b.id === p.brandId),
      category: categories.find((c: Category) => c.id === p.categoryId),
      tags: p.tagIds?.map(tagId =>
        allTags.find((t: Tag) => t.id === tagId)
      ).filter(Boolean) || []
    }));

    res.json({
      products: enrichedProducts,
      pagination: {
        total: products.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(products.length / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

/**
 * GET /api/products/featured
 * Get featured products
 */
router.get('/featured', (req: Request, res: Response) => {
  try {
    const { limit = '8' } = req.query;
    const limitNum = parseInt(limit as string);

    const products = db.getAll('products')
      .filter((p: Product) => p.status === ProductStatus.PUBLISHED && p.featured)
      .slice(0, limitNum);

    const brands = db.getAll('brands');
    const enrichedProducts = products.map((p: Product) => ({
      ...p,
      brand: brands.find((b: Brand) => b.id === p.brandId)
    }));

    res.json({ products: enrichedProducts });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
});

/**
 * GET /api/products/new-arrivals
 * Get new arrival products
 */
router.get('/new-arrivals', (req: Request, res: Response) => {
  try {
    const { limit = '8' } = req.query;
    const limitNum = parseInt(limit as string);

    const products = db.getAll('products')
      .filter((p: Product) => p.status === ProductStatus.PUBLISHED && p.isNew)
      .sort((a: Product, b: Product) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limitNum);

    const brands = db.getAll('brands');
    const enrichedProducts = products.map((p: Product) => ({
      ...p,
      brand: brands.find((b: Brand) => b.id === p.brandId)
    }));

    res.json({ products: enrichedProducts });
  } catch (error) {
    console.error('Error fetching new arrivals:', error);
    res.status(500).json({ error: 'Failed to fetch new arrivals' });
  }
});

/**
 * GET /api/products/filter-options
 * Get available filter values for attributes
 */
router.get('/filter-options', (_req: Request, res: Response) => {
  try {
    const products = db.getAll('products').filter(
      (p: Product) => p.status === ProductStatus.PUBLISHED
    );

    const metalTypes = [...new Set(
      products.map((p: Product) => p.metalType).filter(Boolean)
    )].sort();

    const metalPurities = [...new Set(
      products.map((p: Product) => p.metalPurity).filter(Boolean)
    )].sort();

    const gemstones = [...new Set(
      products.map((p: Product) => p.gemstone).filter(Boolean)
    )].sort();

    res.json({ metalTypes, metalPurities, gemstones });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
});

/**
 * GET /api/products/:slug
 * Get single product by slug with related products
 */
router.get('/:slug', (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const product = db.getBy('products', 'slug', slug)[0];

    if (!product || product.status !== ProductStatus.PUBLISHED) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Increment view count
    db.update('products', product.id, {
      viewCount: product.viewCount + 1
    });

    // Get brand and category
    const brand = db.getById('brands', product.brandId);
    const category = db.getById('categories', product.categoryId);

    // Get related products (same category or brand)
    const relatedProducts = db.getAll('products')
      .filter((p: Product) =>
        p.id !== product.id &&
        p.status === ProductStatus.PUBLISHED &&
        (p.categoryId === product.categoryId || p.brandId === product.brandId)
      )
      .slice(0, 4);

    res.json({
      product: {
        ...product,
        brand,
        category
      },
      relatedProducts
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

export default router;
