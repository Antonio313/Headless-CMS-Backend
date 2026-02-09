import { Lead, Wishlist, Product } from '../types';
import { db } from '../utils/database';

/**
 * Calculate lead score based on various factors
 *
 * Scoring breakdown:
 * - Wishlist items count: 10 points per item (max 40 points)
 * - Total wishlist value: up to 30 points based on price ranges
 * - Has phone number: 10 points
 * - Has message: 10 points
 * - Wishlist source: 5 points
 * - UTM tracking: 5 points
 * - Has customer account: 8 points
 * - Multiple wishlists/leads: 3 per extra (max 7 points)
 * - Has converted lead in history: 10 points
 *
 * Score ranges:
 * - 0-30: Cold Lead
 * - 31-60: Warm Lead
 * - 61-100: Hot Lead
 */
export const calculateLeadScore = (lead: Lead, wishlist?: Wishlist, customerId?: string): number => {
  let score = 0;

  // Wishlist items count (10 points per item, max 40)
  if (wishlist && wishlist.items.length > 0) {
    score += Math.min(wishlist.items.length * 10, 40);

    // Calculate total wishlist value
    const products = db.getAll('products');
    const wishlistTotal = wishlist.items.reduce((total, item) => {
      const product = products.find((p: Product) => p.id === item.productId);
      return total + (product?.price || 0);
    }, 0);

    // Total wishlist value scoring (max 30 points)
    if (wishlistTotal >= 10000) score += 30;
    else if (wishlistTotal >= 5000) score += 25;
    else if (wishlistTotal >= 2000) score += 20;
    else if (wishlistTotal >= 1000) score += 15;
    else if (wishlistTotal >= 500) score += 10;
    else if (wishlistTotal > 0) score += 5;
  }

  // Has phone number (10 points)
  if (lead.phone) {
    score += 10;
  }

  // Has detailed message (10 points)
  if (lead.message && lead.message.length > 20) {
    score += 10;
  }

  // Came from specific sources (bonus points)
  if (lead.source === 'WISHLIST') {
    score += 5;
  }

  // Has UTM tracking (indicates targeted visit)
  if (lead.utmSource || lead.utmCampaign) {
    score += 5;
  }

  // --- Customer account bonuses ---
  const resolvedCustomerId = customerId || lead.customerId;

  // Has customer account (+8 points)
  if (resolvedCustomerId) {
    score += 8;
  }

  // Multiple wishlists/leads from same person (+3 per extra, max 7)
  if (resolvedCustomerId || lead.email) {
    const allLeads = db.getAll('leads') as Lead[];
    const siblingLeads = allLeads.filter(
      (l: Lead) => l.id !== lead.id && (
        (resolvedCustomerId && l.customerId === resolvedCustomerId) ||
        l.email === lead.email
      )
    );
    if (siblingLeads.length > 0) {
      score += Math.min(siblingLeads.length * 3, 7);
    }
  }

  // Has a converted lead in history (+10 points)
  if (resolvedCustomerId || lead.email) {
    const allLeads = db.getAll('leads') as Lead[];
    const hasConverted = allLeads.some(
      (l: Lead) => l.id !== lead.id && l.status === 'CONVERTED' && (
        (resolvedCustomerId && l.customerId === resolvedCustomerId) ||
        l.email === lead.email
      )
    );
    if (hasConverted) {
      score += 10;
    }
  }

  return Math.min(score, 100);
};

/**
 * Get lead score category
 */
export const getLeadCategory = (score: number): string => {
  if (score >= 61) return 'Hot Lead';
  if (score >= 31) return 'Warm Lead';
  return 'Cold Lead';
};

/**
 * Get lead score color for UI
 */
export const getLeadScoreColor = (score: number): string => {
  if (score >= 61) return 'red';
  if (score >= 31) return 'yellow';
  return 'blue';
};

/**
 * Get score breakdown for display
 */
export const getScoreBreakdown = (lead: Lead, wishlist?: Wishlist): Record<string, number> => {
  const breakdown: Record<string, number> = {};

  if (wishlist && wishlist.items.length > 0) {
    breakdown['Wishlist Items'] = Math.min(wishlist.items.length * 10, 40);

    const products = db.getAll('products');
    const wishlistTotal = wishlist.items.reduce((total, item) => {
      const product = products.find((p: Product) => p.id === item.productId);
      return total + (product?.price || 0);
    }, 0);

    if (wishlistTotal >= 10000) breakdown['High Value Wishlist'] = 30;
    else if (wishlistTotal >= 5000) breakdown['High Value Wishlist'] = 25;
    else if (wishlistTotal >= 2000) breakdown['Medium Value Wishlist'] = 20;
    else if (wishlistTotal >= 1000) breakdown['Medium Value Wishlist'] = 15;
    else if (wishlistTotal >= 500) breakdown['Low Value Wishlist'] = 10;
    else if (wishlistTotal > 0) breakdown['Low Value Wishlist'] = 5;
  }

  if (lead.phone) {
    breakdown['Phone Provided'] = 10;
  }

  if (lead.message && lead.message.length > 20) {
    breakdown['Detailed Message'] = 10;
  }

  if (lead.source === 'WISHLIST') {
    breakdown['Wishlist Submission'] = 5;
  }

  if (lead.utmSource || lead.utmCampaign) {
    breakdown['Tracked Campaign'] = 5;
  }

  // Customer account bonuses
  const resolvedCustomerId = lead.customerId;

  if (resolvedCustomerId) {
    breakdown['Customer Account'] = 8;
  }

  if (resolvedCustomerId || lead.email) {
    const allLeads = db.getAll('leads') as Lead[];
    const siblingCount = allLeads.filter(
      (l: Lead) => l.id !== lead.id && (
        (resolvedCustomerId && l.customerId === resolvedCustomerId) ||
        l.email === lead.email
      )
    ).length;
    if (siblingCount > 0) {
      breakdown['Repeat Customer'] = Math.min(siblingCount * 3, 7);
    }

    const hasConverted = allLeads.some(
      (l: Lead) => l.id !== lead.id && l.status === 'CONVERTED' && (
        (resolvedCustomerId && l.customerId === resolvedCustomerId) ||
        l.email === lead.email
      )
    );
    if (hasConverted) {
      breakdown['Previous Conversion'] = 10;
    }
  }

  return breakdown;
};
