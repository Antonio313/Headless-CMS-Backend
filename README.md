# Jewels & Time CMS Backend

A **headless CMS backend** specifically designed for luxury jewelry stores in Jamaica, with a focus on **lead generation** rather than traditional e-commerce. This is a custom alternative to WooCommerce, optimized for converting website visitors into qualified leads.

## Why This Beats WooCommerce for Jewelry Lead Generation

### WooCommerce Limitations:
- ❌ Generic product catalog designed for e-commerce transactions
- ❌ No built-in lead scoring or qualification system
- ❌ Limited wishlist functionality with no lead capture
- ❌ No pipeline management for jewelry consultations
- ❌ Requires numerous plugins for lead management

### Jewels & Time CMS Advantages:
- ✅ **Lead-First Architecture** - Every feature designed to capture and qualify leads
- ✅ **Intelligent Lead Scoring** - Automatic qualification based on wishlist value, engagement, and behavior
- ✅ **Wishlist-to-Lead Pipeline** - Seamlessly convert product interest into sales conversations
- ✅ **Jewelry-Specific Fields** - Metal types, gemstones, carat weights, ring sizes built-in
- ✅ **Clean REST API** - Easy integration with any frontend framework
- ✅ **No Transaction Overhead** - Focus on what matters: connecting with buyers

## Features

### 🎯 Lead Management System
- **Intelligent Lead Scoring Algorithm** (0-100 scale)
  - Wishlist items count: 10 points per item (max 40)
  - Total wishlist value: up to 30 points
  - Contact information completeness: up to 20 points
  - Source tracking: up to 10 points
- **Lead Categories**: Hot (61-100), Warm (31-60), Cold (0-30)
- **Lead Pipeline**: NEW → CONTACTED → QUALIFIED → SCHEDULED → CONVERTED/LOST
- **Lead Notes & Assignment** to staff members
- **UTM Campaign Tracking**

### 💎 Product Management
- **Jewelry-Specific Attributes**
  - Metal Type (Gold, White Gold, Rose Gold, Platinum, Silver)
  - Metal Purity (14K, 18K, 24K, 925 Sterling)
  - Gemstone Type
  - Gemstone Weight (carats)
  - Ring Size
- **Multi-Image Upload** with automatic optimization
- **SEO Auto-Generation** (meta titles, descriptions, slugs)
- **Inventory Tracking** by store location
- **Featured Products** & New Arrivals
- **360° View Support**

### 🛍️ Wishlist System
- Create and share wishlists
- Automatic lead creation when wishlist is submitted
- Share wishlist via unique token
- Add/remove items dynamically

### 📊 Admin Dashboard (Coming Soon)
- Overview dashboard with key metrics
- Product CRUD operations
- Lead management with pipeline view
- Brand & category management
- Wishlist monitoring
- Site settings configuration

### 🔐 Authentication & Security
- JWT-based authentication
- Role-based access control (Super Admin, Admin, Staff)
- Password hashing with bcrypt
- Rate limiting on public endpoints
- Helmet.js security headers

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Data Storage**: JSON files (demo) - easily migrated to PostgreSQL/MongoDB
- **Authentication**: JWT
- **Validation**: Zod schemas
- **File Upload**: Multer + Sharp (image optimization)
- **Documentation**: Swagger/OpenAPI

## Project Structure

```
cms-backend/
├── src/
│   ├── routes/
│   │   ├── admin/          # Admin API routes (auth required)
│   │   │   ├── auth.ts
│   │   │   ├── products.ts
│   │   │   ├── leads.ts
│   │   │   ├── brands.ts
│   │   │   ├── categories.ts
│   │   │   ├── wishlists.ts
│   │   │   └── settings.ts
│   │   └── public/         # Public API routes
│   │       ├── products.ts
│   │       ├── brands.ts
│   │       ├── categories.ts
│   │       ├── wishlists.ts
│   │       └── leads.ts
│   ├── middleware/
│   │   ├── auth.ts         # JWT authentication
│   │   ├── validation.ts   # Zod validation
│   │   └── upload.ts       # File upload handling
│   ├── services/
│   │   ├── leadScoring.ts  # Lead scoring algorithm
│   │   ├── seo.ts          # SEO utilities
│   │   └── imageOptimization.ts
│   ├── utils/
│   │   ├── database.ts     # JSON database operations
│   │   ├── jwt.ts          # JWT utilities
│   │   ├── password.ts     # Password hashing
│   │   └── seed.ts         # Seed data script
│   ├── types/
│   │   └── index.ts        # TypeScript interfaces
│   ├── data/
│   │   └── db.json         # JSON database
│   └── server.ts           # Express app
├── uploads/                # Uploaded images
├── package.json
├── tsconfig.json
└── .env
```

## Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

1. **Navigate to the backend directory:**
   ```bash
   cd cms-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment setup:**
   The `.env` file is already created with default values. You can modify it if needed.

4. **Seed the database:**
   ```bash
   npm run seed
   ```

   This creates:
   - ✅ 50 jewelry products
   - ✅ 10 brands (John Hardy, Tacori, Cartier, Tiffany, etc.)
   - ✅ 5 categories with subcategories
   - ✅ 20 leads with various statuses
   - ✅ 10 wishlists
   - ✅ 1 admin user

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Server will start at:**
   - API: http://localhost:5000
   - API Documentation: http://localhost:5000/api-docs
   - Health Check: http://localhost:5000/health

### Default Admin Credentials
```
Email: admin@jewelsandtime.com
Password: Demo123!
```

## API Documentation

### Public Endpoints (No Auth Required)

#### Products
```http
GET    /api/products
       ?brand=john-hardy&category=rings&limit=20&page=1&sort=price_asc

GET    /api/products/featured
GET    /api/products/new-arrivals
GET    /api/products/:slug
```

#### Brands & Categories
```http
GET    /api/brands
GET    /api/brands/:slug
GET    /api/categories
```

#### Wishlists
```http
POST   /api/wishlists
       Body: { name, email, items: [productIds] }

GET    /api/wishlists/:shareToken
POST   /api/wishlists/:shareToken/items
DELETE /api/wishlists/:shareToken/items/:productId
```

#### Leads
```http
POST   /api/leads
       Body: { name, email, phone, message, wishlistId, source, utm_* }

POST   /api/leads/contact
       Body: { name, email, phone, productId, message }
```

### Admin Endpoints (Requires JWT Auth)

**Authentication Header:**
```
Authorization: Bearer <token>
```

#### Auth
```http
POST   /api/admin/auth/login
       Body: { email, password }
       Response: { token, user }
```

#### Products
```http
GET    /api/admin/products
       ?status=PUBLISHED&brandId=xxx&search=diamond

GET    /api/admin/products/:id
POST   /api/admin/products
PUT    /api/admin/products/:id
DELETE /api/admin/products/:id

POST   /api/admin/products/:id/images
       (multipart/form-data with image files)

DELETE /api/admin/products/:id/images/:imageId
```

#### Leads
```http
GET    /api/admin/leads
       ?status=NEW&minScore=60&sort=score_desc

GET    /api/admin/leads/stats
GET    /api/admin/leads/:id
PUT    /api/admin/leads/:id
POST   /api/admin/leads/:id/notes
DELETE /api/admin/leads/:id
```

#### Brands, Categories, Wishlists, Settings
```http
# Brands
GET    /api/admin/brands
POST   /api/admin/brands
PUT    /api/admin/brands/:id
DELETE /api/admin/brands/:id

# Categories
GET    /api/admin/categories
POST   /api/admin/categories
PUT    /api/admin/categories/:id
DELETE /api/admin/categories/:id
POST   /api/admin/categories/:categoryId/subcategories

# Wishlists
GET    /api/admin/wishlists
GET    /api/admin/wishlists/:id
DELETE /api/admin/wishlists/:id

# Settings
GET    /api/admin/settings
PUT    /api/admin/settings/:key
```

### Explore Full API Documentation
Visit **http://localhost:5000/api-docs** when the server is running for interactive Swagger documentation.

## Lead Scoring Algorithm

The system automatically calculates a lead score (0-100) based on:

| Factor | Points | Description |
|--------|--------|-------------|
| **Wishlist Items** | 10 per item (max 40) | More items = higher intent |
| **Wishlist Value** | Up to 30 points | $10K+ = 30pts, $5K+ = 25pts, etc. |
| **Phone Provided** | 10 points | Contact information quality |
| **Detailed Message** | 10 points | Engagement level |
| **Wishlist Source** | 5 points | Came from wishlist submission |
| **UTM Tracking** | 5 points | Targeted campaign visitor |

**Lead Categories:**
- 🔴 **Hot Lead (61-100)**: High-value, engaged, ready to buy
- 🟡 **Warm Lead (31-60)**: Interested, needs nurturing
- 🔵 **Cold Lead (0-30)**: Early stage, requires qualification

## Data Models

### Product
```typescript
{
  id: string
  sku: string
  name: string
  description: string
  price: number
  brandId: string
  categoryId: string
  metalType?: string       // Gold, Platinum, etc.
  metalPurity?: string     // 14K, 18K, 24K
  gemstone?: string        // Diamond, Tanzanite, etc.
  gemstoneWeight?: number  // Carats
  ringSize?: string
  images: ProductImage[]
  inStock: boolean
  slug: string
  status: DRAFT | PUBLISHED | ARCHIVED
  featured: boolean
  isNew: boolean
  viewCount: number
}
```

### Lead
```typescript
{
  id: string
  name: string
  email: string
  phone?: string
  source: WEBSITE | WISHLIST | CONTACT_FORM | etc.
  status: NEW | CONTACTED | QUALIFIED | SCHEDULED | CONVERTED | LOST
  score: number            // 0-100
  message?: string
  wishlistId?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  assignedTo?: string      // Staff member
  createdAt: string
}
```

## Migration to Production Database

The current implementation uses JSON files for demo purposes. To migrate to PostgreSQL:

1. Install Prisma and PostgreSQL driver:
   ```bash
   npm install @prisma/client
   npm install -D prisma
   ```

2. Initialize Prisma:
   ```bash
   npx prisma init
   ```

3. Copy the schema from the original specification (provided in the prompt)

4. Update `src/utils/database.ts` to use Prisma Client instead of JSON operations

5. Run migrations:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

## Development

```bash
# Development mode with auto-reload
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Seed database
npm run seed
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `JWT_SECRET` | Secret for JWT signing | (change in production!) |
| `JWT_EXPIRES_IN` | Token expiration | 7d |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |
| `ADMIN_DASHBOARD_URL` | Admin dashboard URL | http://localhost:5174 |
| `DEFAULT_ADMIN_EMAIL` | Default admin email | admin@jewelsandtime.com |
| `DEFAULT_ADMIN_PASSWORD` | Default admin password | Demo123! |

## Testing the API

### Example: Create a Lead from Wishlist

1. **Create a wishlist:**
   ```bash
   curl -X POST http://localhost:5000/api/wishlists \
     -H "Content-Type: application/json" \
     -d '{
       "name": "My Dream Jewelry",
       "email": "customer@example.com",
       "items": ["product-id-1", "product-id-2"]
     }'
   ```

2. **Submit as a lead:**
   ```bash
   curl -X POST http://localhost:5000/api/leads \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Jane Doe",
       "email": "customer@example.com",
       "phone": "+1-876-555-0123",
       "message": "Interested in these pieces",
       "wishlistId": "wishlist-id-from-step-1",
       "source": "WISHLIST"
     }'
   ```

3. **Check the console** - you'll see the lead score calculated automatically!

### Example: Admin Login and Get Leads

```bash
# Login
curl -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@jewelsandtime.com",
    "password": "Demo123!"
  }'

# Use the token from response
curl -X GET http://localhost:5000/api/admin/leads?status=NEW&sort=score_desc \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Next Steps

### Admin Dashboard (React)
The frontend admin dashboard is coming next with:
- Dashboard overview with charts
- Product management UI
- Lead pipeline (Kanban board)
- Drag-and-drop image uploads
- Real-time lead notifications

### Frontend Integration
This backend is designed to work with any frontend framework:
- React/Next.js
- Vue/Nuxt
- Angular
- Plain HTML/JavaScript

Simply consume the REST API endpoints listed above.

## Support

For questions or issues:
- Check the API documentation at `/api-docs`
- Review the code in `src/routes/` for endpoint implementations
- Examine `src/types/` for data structures

## License

MIT

---

**Built with ❤️ for Jewels & Time Jamaica**
