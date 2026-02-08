import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

// Load environment variables
dotenv.config();

// Import routes
import publicProductsRoutes from './routes/public/products';
import publicBrandsRoutes from './routes/public/brands';
import publicCategoriesRoutes from './routes/public/categories';
import publicTagsRoutes from './routes/public/tags';
import publicWishlistsRoutes from './routes/public/wishlists';
import publicLeadsRoutes from './routes/public/leads';

import adminAuthRoutes from './routes/admin/auth';
import adminProductsRoutes from './routes/admin/products';
import adminLeadsRoutes from './routes/admin/leads';
import adminBrandsRoutes from './routes/admin/brands';
import adminCategoriesRoutes from './routes/admin/categories';
import adminTagsRoutes from './routes/admin/tags';
import adminWishlistsRoutes from './routes/admin/wishlists';
import adminSettingsRoutes from './routes/admin/settings';
import adminUsersRoutes from './routes/admin/users';

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy (required when behind a reverse proxy like Railway, Render, etc.)
app.set('trust proxy', 1);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Jewels & Time CMS API',
      version: '1.0.0',
      description: 'Headless CMS API for luxury jewelry store with lead generation focus',
      contact: {
        name: 'Jewels & Time',
        email: 'info@jewelsandtime.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/**/*.ts']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    process.env.ADMIN_DASHBOARD_URL || 'http://localhost:5174',
    'http://localhost:5175'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting for public endpoints
const publicLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiter to public API routes
app.use('/api/products', publicLimiter);
app.use('/api/leads', publicLimiter);
app.use('/api/contact', publicLimiter);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    message: 'Jewels & Time CMS API is running',
    timestamp: new Date().toISOString()
  });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Public API Routes
app.use('/api/products', publicProductsRoutes);
app.use('/api/brands', publicBrandsRoutes);
app.use('/api/categories', publicCategoriesRoutes);
app.use('/api/tags', publicTagsRoutes);
app.use('/api/wishlists', publicWishlistsRoutes);
app.use('/api/leads', publicLeadsRoutes);

// Admin API Routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/products', adminProductsRoutes);
app.use('/api/admin/leads', adminLeadsRoutes);
app.use('/api/admin/brands', adminBrandsRoutes);
app.use('/api/admin/categories', adminCategoriesRoutes);
app.use('/api/admin/tags', adminTagsRoutes);
app.use('/api/admin/wishlists', adminWishlistsRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);
app.use('/api/admin/users', adminUsersRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableEndpoints: {
      public: [
        'GET /api/products',
        'GET /api/products/:slug',
        'GET /api/products/featured',
        'GET /api/products/new-arrivals',
        'GET /api/brands',
        'GET /api/categories',
        'POST /api/wishlists',
        'GET /api/wishlists/:shareToken',
        'POST /api/leads',
        'GET /api-docs - API Documentation'
      ],
      admin: [
        'POST /api/admin/auth/login',
        'GET /api/admin/products',
        'GET /api/admin/leads',
        'GET /api/admin/brands',
        'GET /api/admin/categories',
        'GET /api/admin/wishlists',
        'GET /api/admin/settings'
      ]
    }
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 Jewels & Time CMS Backend Started');
  console.log('=====================================');
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('=====================================\n');
});

export default app;
