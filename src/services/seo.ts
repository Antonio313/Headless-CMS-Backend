import { Product } from '../types';

/**
 * Generate URL-friendly slug from text
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Generate meta title for product
 */
export const generateMetaTitle = (product: Product, brandName?: string): string => {
  if (product.metaTitle) return product.metaTitle;

  const brand = brandName ? `${brandName} | ` : '';
  return `${product.name} | ${brand}Jewels & Time`;
};

/**
 * Generate meta description for product
 */
export const generateMetaDescription = (product: Product): string => {
  if (product.metaDesc) return product.metaDesc;

  if (product.shortDesc) {
    return product.shortDesc.substring(0, 160);
  }

  // Generate from description
  const cleanDesc = product.description.replace(/<[^>]*>/g, '').trim();
  return cleanDesc.substring(0, 157) + '...';
};

/**
 * Generate keywords from product details
 */
export const generateKeywords = (product: Product): string[] => {
  const keywords: string[] = [];

  if (product.keywords.length > 0) {
    return product.keywords;
  }

  // Add product name words
  keywords.push(...product.name.toLowerCase().split(' '));

  // Add jewelry-specific attributes
  if (product.metalType) keywords.push(product.metalType.toLowerCase());
  if (product.metalPurity) keywords.push(product.metalPurity.toLowerCase());
  if (product.gemstone) keywords.push(product.gemstone.toLowerCase());

  // Add generic keywords
  keywords.push('jewelry', 'luxury', 'jamaica');

  // Remove duplicates
  return [...new Set(keywords)];
};

/**
 * Validate and ensure unique slug
 */
export const ensureUniqueSlug = (slug: string, existingSlugs: string[]): string => {
  let uniqueSlug = slug;
  let counter = 1;

  while (existingSlugs.includes(uniqueSlug)) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
};
