// Enums
export enum ProductStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export enum LeadSource {
  WEBSITE = 'WEBSITE',
  WISHLIST = 'WISHLIST',
  CONTACT_FORM = 'CONTACT_FORM',
  PHONE = 'PHONE',
  CHAT = 'CHAT',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  WALK_IN = 'WALK_IN'
}

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  SCHEDULED = 'SCHEDULED',
  CONVERTED = 'CONVERTED',
  LOST = 'LOST'
}

export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF'
}

// Models
export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  shortDesc?: string;
  price: number;
  comparePrice?: number;
  brandId: string;
  categoryId: string;
  subcategoryId?: string;
  tagIds?: string[];

  // Jewelry-specific fields
  metalType?: string;
  metalPurity?: string;
  gemstone?: string;
  gemstoneWeight?: number;
  weight?: number;
  dimensions?: string;
  ringSize?: string;

  // Images & Media
  images: ProductImage[];
  videoUrl?: string;
  has360View: boolean;

  // Product Relationships
  groupedProductIds?: string[]; // Products that form a set (sold separately)
  relatedProductIds?: string[]; // "You may also like" recommendations

  // Inventory
  inStock: boolean;
  stockQuantity?: number;
  storeLocation?: string;

  // SEO
  slug: string;
  metaTitle?: string;
  metaDesc?: string;
  keywords: string[];

  // Status
  status: ProductStatus;
  featured: boolean;
  isNew: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;

  viewCount: number;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  source: LeadSource;
  status: LeadStatus;
  score: number;

  // Lead details
  message?: string;
  wishlistId?: string;
  customerId?: string;

  // Tracking
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  ipAddress?: string;
  userAgent?: string;

  // Assignment
  assignedTo?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  contactedAt?: string;
  convertedAt?: string;
}

export interface LeadNote {
  id: string;
  leadId: string;
  note: string;
  createdBy: string;
  createdAt: string;
}

export interface Wishlist {
  id: string;
  name: string;
  email?: string;
  customerId?: string;
  shareToken: string;
  items: WishlistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  id: string;
  wishlistId: string;
  productId: string;
  notes?: string;
  addedAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: string;
  type: string;
}

// Database interface
export interface Database {
  products: Product[];
  brands: Brand[];
  categories: Category[];
  subcategories: Subcategory[];
  tags: Tag[];
  leads: Lead[];
  leadNotes: LeadNote[];
  wishlists: Wishlist[];
  adminUsers: AdminUser[];
  customers: Customer[];
  siteSettings: SiteSetting[];
}
