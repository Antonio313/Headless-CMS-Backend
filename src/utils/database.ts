import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../types';
import { AdminRole } from '../types';

const DB_PATH = path.join(process.cwd(), 'src', 'data', 'db.json');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize empty database if it doesn't exist
if (!fs.existsSync(DB_PATH)) {
  // Hash the default admin password synchronously at startup
  const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@jewelsandtime.com';
  const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Demo123!';
  const hashedPassword = bcrypt.hashSync(defaultPassword, 10);

  const emptyDb: Database = {
    products: [],
    brands: [],
    categories: [],
    subcategories: [],
    tags: [],
    leads: [],
    leadNotes: [],
    wishlists: [],
    adminUsers: [
      {
        id: uuidv4(),
        email: defaultEmail,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: AdminRole.SUPER_ADMIN,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    siteSettings: []
  };
  fs.writeFileSync(DB_PATH, JSON.stringify(emptyDb, null, 2));
  console.log(`✅ Database initialized with default admin user: ${defaultEmail}`);
}

/**
 * Read the entire database from JSON file
 */
export const readDatabase = (): Database => {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    throw new Error('Failed to read database');
  }
};

/**
 * Write the entire database to JSON file
 */
export const writeDatabase = (db: Database): void => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('Error writing database:', error);
    throw new Error('Failed to write database');
  }
};

/**
 * Generic CRUD operations
 */
export const db = {
  // Get all items from a collection
  getAll: <T extends keyof Database>(collection: T): Database[T] => {
    const database = readDatabase();
    return database[collection];
  },

  // Get a single item by ID
  getById: <T extends keyof Database>(
    collection: T,
    id: string
  ): Database[T][number] | undefined => {
    const database = readDatabase();
    const items = database[collection] as any[];
    return items.find((item: any) => item.id === id);
  },

  // Get items by a specific field value
  getBy: <T extends keyof Database>(
    collection: T,
    field: string,
    value: any
  ): Database[T][number][] => {
    const database = readDatabase();
    const items = database[collection] as any[];
    return items.filter((item: any) => item[field] === value);
  },

  // Create a new item
  create: <T extends keyof Database>(
    collection: T,
    item: Database[T][number]
  ): Database[T][number] => {
    const database = readDatabase();
    const items = database[collection] as any[];
    items.push(item);
    writeDatabase(database);
    return item;
  },

  // Update an item by ID
  update: <T extends keyof Database>(
    collection: T,
    id: string,
    updates: Partial<Database[T][number]>
  ): Database[T][number] | null => {
    const database = readDatabase();
    const items = database[collection] as any[];
    const index = items.findIndex((item: any) => item.id === id);

    if (index === -1) return null;

    items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
    writeDatabase(database);
    return items[index];
  },

  // Delete an item by ID
  delete: <T extends keyof Database>(collection: T, id: string): boolean => {
    const database = readDatabase();
    const items = database[collection] as any[];
    const index = items.findIndex((item: any) => item.id === id);

    if (index === -1) return false;

    items.splice(index, 1);
    writeDatabase(database);
    return true;
  },

  // Search with filters
  search: <T extends keyof Database>(
    collection: T,
    filters: Record<string, any>
  ): Database[T][number][] => {
    const database = readDatabase();
    const items = database[collection] as any[];

    return items.filter((item: any) => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null) return true;

        // Handle array fields (e.g., keywords)
        if (Array.isArray(item[key])) {
          return item[key].includes(value);
        }

        // Handle string partial matches
        if (typeof item[key] === 'string' && typeof value === 'string') {
          return item[key].toLowerCase().includes(value.toLowerCase());
        }

        return item[key] === value;
      });
    });
  },

  // Batch operations
  bulkCreate: <T extends keyof Database>(
    collection: T,
    items: Database[T][number][]
  ): Database[T][number][] => {
    const database = readDatabase();
    const existingItems = database[collection] as any[];
    existingItems.push(...items);
    writeDatabase(database);
    return items;
  }
};
