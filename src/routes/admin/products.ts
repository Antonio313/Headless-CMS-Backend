import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { db } from '../../utils/database';
import { Product, ProductStatus, ProductImage } from '../../types';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { upload } from '../../middleware/upload';
import { optimizeImage } from '../../services/imageOptimization';
import { generateSlug, ensureUniqueSlug } from '../../services/seo';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Product validation schema
const productSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  shortDesc: z.string().optional(),
  price: z.number().positive(),
  comparePrice: z.number().positive().optional(),
  brandId: z.string().uuid(),
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid().optional(),
  metalType: z.string().optional(),
  metalPurity: z.string().optional(),
  gemstone: z.string().optional(),
  gemstoneWeight: z.number().optional(),
  weight: z.number().optional(),
  dimensions: z.string().optional(),
  ringSize: z.string().optional(),
  stockQuantity: z.number().optional(),
  videoUrl: z.string().optional(),
  has360View: z.boolean().optional(),
  inStock: z.boolean().optional(),
  storeLocation: z.string().optional(),
  slug: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  featured: z.boolean().optional(),
  isNew: z.boolean().optional()
});

/**
 * GET /api/admin/products
 * Get all products (admin view)
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { status, brandId, categoryId, search, limit = '50', page = '1' } = req.query;

    let products = db.getAll('products');

    // Apply filters
    if (status) {
      products = products.filter((p: Product) => p.status === status);
    }

    if (brandId) {
      products = products.filter((p: Product) => p.brandId === brandId);
    }

    if (categoryId) {
      products = products.filter((p: Product) => p.categoryId === categoryId);
    }

    if (search) {
      const searchLower = (search as string).toLowerCase();
      products = products.filter((p: Product) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.sku.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    const paginatedProducts = products.slice(startIndex, endIndex);

    // Enrich with brand data
    const brands = db.getAll('brands');
    const categories = db.getAll('categories');

    const enrichedProducts = paginatedProducts.map((p: Product) => ({
      ...p,
      brand: brands.find((b) => b.id === p.brandId),
      category: categories.find((c) => c.id === p.categoryId)
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
 * GET /api/admin/products/:id
 * Get single product by ID
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = db.getById('products', id);

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

/**
 * POST /api/admin/products
 * Create new product
 */
router.post('/', validate(productSchema), (req: Request, res: Response) => {
  try {
    const data = req.body;

    // Generate slug if not provided
    const slug = data.slug || generateSlug(data.name);
    const existingSlugs = db.getAll('products').map((p: Product) => p.slug);
    const uniqueSlug = ensureUniqueSlug(slug, existingSlugs);

    const product: Product = {
      id: uuidv4(),
      sku: data.sku,
      name: data.name,
      description: data.description,
      shortDesc: data.shortDesc,
      price: data.price,
      comparePrice: data.comparePrice,
      brandId: data.brandId,
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId,
      metalType: data.metalType,
      metalPurity: data.metalPurity,
      gemstone: data.gemstone,
      gemstoneWeight: data.gemstoneWeight,
      weight: data.weight,
      dimensions: data.dimensions,
      ringSize: data.ringSize,
      images: [],
      videoUrl: data.videoUrl,
      has360View: data.has360View || false,
      inStock: data.inStock !== undefined ? data.inStock : true,
      stockQuantity: data.stockQuantity,
      storeLocation: data.storeLocation,
      slug: uniqueSlug,
      metaTitle: data.metaTitle,
      metaDesc: data.metaDesc,
      keywords: data.keywords || [],
      tagIds: data.tagIds || [],
      status: data.status || ProductStatus.DRAFT,
      featured: data.featured || false,
      isNew: data.isNew || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: data.status === ProductStatus.PUBLISHED ? new Date().toISOString() : undefined,
      viewCount: 0
    };

    db.create('products', product);

    res.status(201).json({ product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

/**
 * PUT /api/admin/products/:id
 * Update product
 */
router.put('/:id', validate(productSchema.partial()), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existingProduct = db.getById('products', id);

    if (!existingProduct) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // If slug is being updated, ensure it's unique
    if (updates.slug && updates.slug !== existingProduct.slug) {
      const existingSlugs = db.getAll('products')
        .filter((p: Product) => p.id !== id)
        .map((p: Product) => p.slug);
      updates.slug = ensureUniqueSlug(updates.slug, existingSlugs);
    }

    // Update publishedAt if status is changing to PUBLISHED
    if (updates.status === ProductStatus.PUBLISHED && existingProduct.status !== ProductStatus.PUBLISHED) {
      updates.publishedAt = new Date().toISOString();
    }

    const updatedProduct = db.update('products', id, updates);

    res.json({ product: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

/**
 * DELETE /api/admin/products/:id
 * Delete product
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = db.delete('products', id);

    if (!deleted) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

/**
 * POST /api/admin/products/:id/images
 * Upload product images
 */
router.post('/:id/images', upload.array('images', 10), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No images provided' });
      return;
    }

    const product = db.getById('products', id) as Product;

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const newImages: ProductImage[] = [];

    for (const file of files) {
      // Optimize image
      const sizes = await optimizeImage(file.filename);

      const image: ProductImage = {
        id: uuidv4(),
        productId: id,
        url: `/uploads/${sizes.large}`,
        isPrimary: product.images.length === 0 && newImages.length === 0,
        sortOrder: product.images.length + newImages.length,
        createdAt: new Date().toISOString()
      };

      newImages.push(image);
    }

    product.images.push(...newImages);

    db.update('products', id, { images: product.images });

    res.json({ images: newImages });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

/**
 * DELETE /api/admin/products/:id/images/:imageId
 * Delete product image
 */
router.delete('/:id/images/:imageId', (req: Request, res: Response) => {
  try {
    const { id, imageId } = req.params;

    const product = db.getById('products', id) as Product;

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const imageIndex = product.images.findIndex(img => img.id === imageId);

    if (imageIndex === -1) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }

    product.images.splice(imageIndex, 1);

    db.update('products', id, { images: product.images });

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

/**
 * PUT /api/admin/products/:id/images/reorder
 * Reorder product images
 */
router.put('/:id/images/reorder', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { updates } = req.body;

    if (!Array.isArray(updates)) {
      res.status(400).json({ error: 'Updates must be an array' });
      return;
    }

    const product = db.getById('products', id) as Product;

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Update each image with new sortOrder and isPrimary
    updates.forEach(({ imageId, sortOrder, isPrimary }: any) => {
      const imageIndex = product.images.findIndex(img => img.id === imageId);
      if (imageIndex !== -1) {
        product.images[imageIndex].sortOrder = sortOrder;
        product.images[imageIndex].isPrimary = isPrimary;
      }
    });

    db.update('products', id, { images: product.images });

    res.json({ message: 'Images reordered successfully', images: product.images });
  } catch (error) {
    console.error('Error reordering images:', error);
    res.status(500).json({ error: 'Failed to reorder images' });
  }
});

export default router;
