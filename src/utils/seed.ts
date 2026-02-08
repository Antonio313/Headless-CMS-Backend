import { v4 as uuidv4 } from 'uuid';
import { writeDatabase } from './database';
import { hashPassword } from './password';
import {
  Database,
  Product,
  ProductStatus,
  Brand,
  Category,
  Subcategory,
  Lead,
  LeadSource,
  LeadStatus,
  Wishlist,
  AdminUser,
  AdminRole,
  SiteSetting
} from '../types';

async function seed() {
  console.log('🌱 Seeding database...\n');

  // Create brands
  const brands: Brand[] = [
    {
      id: uuidv4(),
      name: 'John Hardy',
      slug: 'john-hardy',
      description: 'Luxury artisan jewelry from Bali',
      featured: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Tacori',
      slug: 'tacori',
      description: 'American luxury jewelry and engagement rings',
      featured: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Larimar & Silver',
      slug: 'larimar-silver',
      description: 'Caribbean gemstone jewelry',
      featured: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Tanzanite One',
      slug: 'tanzanite-one',
      description: 'Rare tanzanite gemstone jewelry',
      featured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Cartier',
      slug: 'cartier',
      description: 'French luxury jewelry and watches',
      featured: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Tiffany & Co',
      slug: 'tiffany-co',
      description: 'Iconic American luxury jeweler',
      featured: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'David Yurman',
      slug: 'david-yurman',
      description: 'Contemporary American jewelry',
      featured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Mikimoto',
      slug: 'mikimoto',
      description: 'Premier cultured pearl jewelry',
      featured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Bulgari',
      slug: 'bulgari',
      description: 'Italian luxury jewelry and watches',
      featured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Van Cleef & Arpels',
      slug: 'van-cleef-arpels',
      description: 'French haute joaillerie',
      featured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  console.log(`✓ Created ${brands.length} brands`);

  // Create categories
  const categories: Category[] = [
    {
      id: uuidv4(),
      name: 'Rings',
      slug: 'rings',
      description: 'Engagement rings, wedding bands, and fashion rings',
      icon: '💍',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Necklaces',
      slug: 'necklaces',
      description: 'Pendants, chains, and statement necklaces',
      icon: '📿',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Bracelets',
      slug: 'bracelets',
      description: 'Bangles, tennis bracelets, and charm bracelets',
      icon: '⌚',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Earrings',
      slug: 'earrings',
      description: 'Studs, hoops, and drop earrings',
      icon: '👂',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Watches',
      slug: 'watches',
      description: 'Luxury timepieces',
      icon: '⌚',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  console.log(`✓ Created ${categories.length} categories`);

  // Create subcategories
  const subcategories: Subcategory[] = [
    {
      id: uuidv4(),
      name: 'Engagement Rings',
      slug: 'engagement-rings',
      categoryId: categories[0].id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Wedding Bands',
      slug: 'wedding-bands',
      categoryId: categories[0].id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Fashion Rings',
      slug: 'fashion-rings',
      categoryId: categories[0].id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Pendant Necklaces',
      slug: 'pendant-necklaces',
      categoryId: categories[1].id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Chain Necklaces',
      slug: 'chain-necklaces',
      categoryId: categories[1].id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  console.log(`✓ Created ${subcategories.length} subcategories`);

  // Generate 50 products with realistic jewelry data
  const products: Product[] = [];
  const metalTypes = ['Gold', 'White Gold', 'Rose Gold', 'Platinum', 'Sterling Silver'];
  const metalPurities = ['14K', '18K', '24K', '925 Sterling'];
  const gemstones = ['Diamond', 'Tanzanite', 'Larimar', 'Ruby', 'Sapphire', 'Emerald', 'Pearl'];
  const ringSizes = ['5', '6', '7', '8', '9', '10'];

  // Jewelry image URLs from Unsplash (free to use) - confirmed working URLs
  const jewelryImages = [
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80',
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80',
    'https://images.unsplash.com/photo-1603561596112-0a132b757442?w=800&q=80',
    'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80',
    'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&q=80',
    'https://images.unsplash.com/photo-1605100804957-7f49568af8f4?w=800&q=80',
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80',
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80',
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80',
    'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=800&q=80',
    'https://images.unsplash.com/photo-1611652022419-a9419f74343a?w=800&q=80',
    'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&q=80',
    'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=800&q=80',
    'https://images.unsplash.com/photo-1601121141418-3e0a3e7c09e0?w=800&q=80',
    'https://images.unsplash.com/photo-1535556116002-6281ff3e9f99?w=800&q=80',
    'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=800&q=80',
    'https://images.unsplash.com/photo-1588444650921-a23d2e959c92?w=800&q=80',
    'https://images.unsplash.com/photo-1612343739664-e33ec0f28ead?w=800&q=80',
    'https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=800&q=80',
    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80',
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80',
    'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&q=80',
    'https://images.unsplash.com/photo-1608042314453-ae338d80c427?w=800&q=80',
    'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800&q=80',
    'https://images.unsplash.com/photo-1611652022419-a9419f74343a?w=800&q=80',
    'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&q=80',
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80',
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80',
    'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&q=80',
    'https://images.unsplash.com/photo-1611652022419-a9419f74343a?w=800&q=80',
    'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=800&q=80',
    'https://images.unsplash.com/photo-1603561596112-0a132b757442?w=800&q=80',
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80',
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80',
    'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=800&q=80',
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80',
    'https://images.unsplash.com/photo-1605100804957-7f49568af8f4?w=800&q=80',
    'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80',
    'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&q=80',
    'https://images.unsplash.com/photo-1588444650921-a23d2e959c92?w=800&q=80',
    'https://images.unsplash.com/photo-1535556116002-6281ff3e9f99?w=800&q=80',
    'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=800&q=80',
    'https://images.unsplash.com/photo-1601121141418-3e0a3e7c09e0?w=800&q=80',
    'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&q=80',
    'https://images.unsplash.com/photo-1612343739664-e33ec0f28ead?w=800&q=80',
    'https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=800&q=80',
    'https://images.unsplash.com/photo-1603561596112-0a132b757442?w=800&q=80',
    'https://images.unsplash.com/photo-1611652022419-a9419f74343a?w=800&q=80',
    'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=800&q=80',
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80'
  ];

  const productNames = [
    'Classic Solitaire Diamond Ring',
    'Vintage Tanzanite Pendant',
    'Modern Cable Bracelet',
    'Pearl Stud Earrings',
    'Diamond Tennis Bracelet',
    'Emerald Cut Engagement Ring',
    'Larimar Ocean Wave Necklace',
    'Gold Hoop Earrings',
    'Sapphire Eternity Band',
    'Love Knot Pendant',
    'Infinity Diamond Ring',
    'Caribbean Blue Larimar Ring',
    'Tanzanite Halo Ring',
    'Classic Pearl Necklace',
    'Diamond Cross Pendant',
    'Three Stone Engagement Ring',
    'Cable Chain Bracelet',
    'Ruby Heart Pendant',
    'Twisted Cable Bangle',
    'Diamond Stud Earrings',
    'Moon Phase Pendant',
    'Stackable Gold Rings',
    'Larimar Teardrop Earrings',
    'Diamond Cluster Ring',
    'Byzantine Chain Necklace',
    'Cushion Cut Sapphire Ring',
    'Pearl Drop Earrings',
    'Charm Bracelet',
    'Diamond Bar Necklace',
    'Art Deco Tanzanite Ring',
    'Cable Hoop Earrings',
    'Emerald Pendant',
    'Pave Diamond Band',
    'Larimar Cuff Bracelet',
    'Vintage Filigree Ring',
    'Station Necklace',
    'Diamond Huggie Hoops',
    'Moonstone Ring',
    'Pearl Bracelet',
    'Diamond Bypass Ring',
    'Tanzanite Studs',
    'Gold Mesh Bracelet',
    'Clover Pendant',
    'Princess Cut Diamond Ring',
    'Larimar Silver Cuff',
    'Ruby Tennis Bracelet',
    'Diamond Chandelier Earrings',
    'Cable Twist Ring',
    'Sapphire Pendant',
    'Pearl Hoop Earrings'
  ];

  for (let i = 0; i < 50; i++) {
    const brand = brands[i % brands.length];
    const category = categories[i % categories.length];
    const metal = metalTypes[i % metalTypes.length];
    const purity = metalPurities[i % metalPurities.length];
    const gemstone = gemstones[i % gemstones.length];
    const name = productNames[i];

    const basePrice = 500 + (i * 200) + (Math.random() * 5000);
    const price = Math.round(basePrice / 100) * 100;
    const comparePrice = i % 3 === 0 ? price * 1.25 : undefined;

    const productId = uuidv4();

    // Select 2-4 images for this product
    const imageCount = 2 + Math.floor(Math.random() * 3); // 2 to 4 images
    const productImages = [];
    for (let j = 0; j < imageCount; j++) {
      const imageIndex = (i * 3 + j) % jewelryImages.length;
      productImages.push({
        id: uuidv4(),
        productId: productId,
        url: jewelryImages[imageIndex],
        isPrimary: j === 0,
        altText: `${name} - Image ${j + 1}`,
        sortOrder: j,
        createdAt: new Date().toISOString()
      });
    }

    products.push({
      id: productId,
      sku: `JT-${String(i + 1).padStart(4, '0')}`,
      name,
      description: `Exquisite ${name.toLowerCase()} crafted with precision and luxury. This stunning piece features ${gemstone.toLowerCase()} set in ${purity} ${metal.toLowerCase()}, perfect for the discerning jewelry lover.`,
      shortDesc: `${gemstone} ${metal} jewelry piece from ${brand.name}`,
      price,
      comparePrice,
      brandId: brand.id,
      categoryId: category.id,
      subcategoryId: i % 5 === 0 ? subcategories[i % subcategories.length]?.id : undefined,
      metalType: metal,
      metalPurity: purity,
      gemstone,
      gemstoneWeight: gemstone === 'Diamond' ? 0.5 + (Math.random() * 2) : undefined,
      ringSize: category.slug === 'rings' ? ringSizes[i % ringSizes.length] : undefined,
      images: productImages,
      has360View: i % 10 === 0,
      groupedProductIds: [], // Will be populated after all products are created
      relatedProductIds: [], // Will be populated after all products are created
      inStock: i % 15 !== 0,
      storeLocation: i % 2 === 0 ? 'Montego Bay' : 'Ocho Rios',
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      metaTitle: `${name} | ${brand.name} | Jewels & Time`,
      metaDesc: `Shop ${name.toLowerCase()} from ${brand.name}. Premium ${metal} jewelry with ${gemstone}.`,
      keywords: [metal.toLowerCase(), gemstone.toLowerCase(), category.name.toLowerCase(), 'luxury', 'jamaica'],
      status: ProductStatus.PUBLISHED, // All products published for demo
      featured: i % 8 === 0,
      isNew: i >= 40,
      createdAt: new Date(Date.now() - (50 - i) * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date(Date.now() - (50 - i) * 86400000).toISOString(),
      viewCount: Math.floor(Math.random() * 500)
    });
  }

  // Add grouped products (jewelry sets - matching pieces sold separately)
  // Example: Rings, necklaces, earrings that match as a set
  // Set 1: Classic Diamond Set (indices 0, 4, 7)
  products[0].groupedProductIds = [products[4].id, products[7].id];
  products[4].groupedProductIds = [products[0].id, products[7].id];
  products[7].groupedProductIds = [products[0].id, products[4].id];

  // Set 2: Tanzanite Collection (indices 1, 12, 40)
  products[1].groupedProductIds = [products[12].id, products[40].id];
  products[12].groupedProductIds = [products[1].id, products[40].id];
  products[40].groupedProductIds = [products[1].id, products[12].id];

  // Set 3: Larimar Ocean Set (indices 6, 11, 22, 33)
  products[6].groupedProductIds = [products[11].id, products[22].id, products[33].id];
  products[11].groupedProductIds = [products[6].id, products[22].id, products[33].id];
  products[22].groupedProductIds = [products[6].id, products[11].id, products[33].id];
  products[33].groupedProductIds = [products[6].id, products[11].id, products[22].id];

  // Set 4: Pearl Collection (indices 3, 13, 26, 38)
  products[3].groupedProductIds = [products[13].id, products[26].id, products[38].id];
  products[13].groupedProductIds = [products[3].id, products[26].id, products[38].id];
  products[26].groupedProductIds = [products[3].id, products[13].id, products[38].id];
  products[38].groupedProductIds = [products[3].id, products[13].id, products[26].id];

  // Add related products (recommendations based on similar style/price)
  products.forEach((product, i) => {
    const relatedIndices: number[] = [];

    // Find products in same category
    const sameCategoryProducts = products
      .map((p, idx) => ({ product: p, index: idx }))
      .filter(({ product: p, index: idx }) =>
        p.categoryId === product.categoryId &&
        idx !== i &&
        !product.groupedProductIds?.includes(p.id)
      );

    // Pick 3-5 related products from same category with similar price range
    const priceRange = product.price * 0.3;
    const similarPriceProducts = sameCategoryProducts.filter(({ product: p }) =>
      Math.abs(p.price - product.price) <= priceRange
    );

    const count = Math.min(4, similarPriceProducts.length);
    for (let j = 0; j < count; j++) {
      const randomIndex = Math.floor(Math.random() * similarPriceProducts.length);
      const selected = similarPriceProducts.splice(randomIndex, 1)[0];
      if (selected && !relatedIndices.includes(selected.index)) {
        relatedIndices.push(selected.index);
      }
    }

    product.relatedProductIds = relatedIndices.map(idx => products[idx].id);
  });

  console.log(`✓ Created ${products.length} products`);
  console.log(`✓ Added 4 grouped product sets`);
  console.log(`✓ Added related products recommendations`);

  // Create wishlists
  const wishlists: Wishlist[] = [];
  for (let i = 0; i < 10; i++) {
    const itemCount = 2 + Math.floor(Math.random() * 4);
    const wishlistProducts = products.slice(i * 5, i * 5 + itemCount);

    wishlists.push({
      id: uuidv4(),
      name: `Wishlist ${i + 1}`,
      email: `customer${i + 1}@example.com`,
      shareToken: uuidv4(),
      items: wishlistProducts.map(p => ({
        id: uuidv4(),
        wishlistId: '', // Will be set below
        productId: p.id,
        addedAt: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString()
      })),
      createdAt: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    });

    wishlists[i].items.forEach(item => {
      item.wishlistId = wishlists[i].id;
    });
  }

  console.log(`✓ Created ${wishlists.length} wishlists`);

  // Create leads
  const leads: Lead[] = [];
  const leadSources = Object.values(LeadSource);
  const leadStatuses = Object.values(LeadStatus);

  for (let i = 0; i < 20; i++) {
    const hasWishlist = i < 10;
    const wishlistId = hasWishlist ? wishlists[i].id : undefined;

    leads.push({
      id: uuidv4(),
      name: `Lead Customer ${i + 1}`,
      email: `lead${i + 1}@example.com`,
      phone: i % 2 === 0 ? `+1-876-${String(Math.floor(Math.random() * 9000000) + 1000000)}` : undefined,
      source: leadSources[i % leadSources.length],
      status: leadStatuses[i % leadStatuses.length],
      score: 0, // Will be calculated
      message: i % 3 === 0 ? `I'm interested in ${products[i].name}. Please contact me with more details.` : undefined,
      wishlistId,
      utmSource: i % 4 === 0 ? 'google' : undefined,
      utmMedium: i % 4 === 0 ? 'cpc' : undefined,
      utmCampaign: i % 4 === 0 ? 'luxury-jewelry-2024' : undefined,
      createdAt: new Date(Date.now() - Math.random() * 60 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  console.log(`✓ Created ${leads.length} leads`);

  // Create admin user
  const hashedPassword = await hashPassword(process.env.DEFAULT_ADMIN_PASSWORD || 'Demo123!');
  const adminUsers: AdminUser[] = [
    {
      id: uuidv4(),
      email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@jewelsandtime.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  console.log(`✓ Created ${adminUsers.length} admin user(s)`);

  // Create site settings
  const siteSettings: SiteSetting[] = [
    { id: uuidv4(), key: 'siteName', value: 'Jewels & Time', type: 'string' },
    { id: uuidv4(), key: 'storeAddress', value: 'Montego Bay, Jamaica', type: 'string' },
    { id: uuidv4(), key: 'storePhone', value: '+1-876-123-4567', type: 'string' },
    { id: uuidv4(), key: 'storeEmail', value: 'info@jewelsandtime.com', type: 'string' },
    { id: uuidv4(), key: 'facebook', value: 'https://facebook.com/jewelsandtime', type: 'string' },
    { id: uuidv4(), key: 'instagram', value: 'https://instagram.com/jewelsandtime', type: 'string' },
    { id: uuidv4(), key: 'metaTitleTemplate', value: '{title} | Jewels & Time', type: 'string' }
  ];

  console.log(`✓ Created ${siteSettings.length} site settings`);

  // Write to database
  const database: Database = {
    products,
    brands,
    categories,
    subcategories,
    tags: [],
    leads,
    leadNotes: [],
    wishlists,
    adminUsers,
    siteSettings
  };

  writeDatabase(database);

  console.log('\n✅ Database seeded successfully!');
  console.log('\nLogin credentials:');
  console.log(`Email: ${adminUsers[0].email}`);
  console.log(`Password: ${process.env.DEFAULT_ADMIN_PASSWORD || 'Demo123!'}`);
  console.log('\n');
}

seed().catch(console.error);
