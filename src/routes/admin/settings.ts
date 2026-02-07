import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../utils/database';
import { SiteSetting } from '../../types';
import { authenticate, authorize } from '../../middleware/auth';
import { AdminRole } from '../../types';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * GET /api/admin/settings
 * Get all site settings
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const settings = db.getAll('siteSettings');

    // Convert to key-value object for easier consumption
    const settingsObject = settings.reduce((acc, setting: SiteSetting) => {
      let value = setting.value;

      // Parse based on type
      if (setting.type === 'number') {
        value = parseFloat(value);
      } else if (setting.type === 'boolean') {
        value = value === 'true';
      } else if (setting.type === 'json') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // Keep as string if parsing fails
        }
      }

      acc[setting.key] = value;
      return acc;
    }, {} as Record<string, any>);

    res.json({ settings: settingsObject });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * PUT /api/admin/settings/:key
 * Update a setting
 */
router.put('/:key', authorize(AdminRole.ADMIN, AdminRole.SUPER_ADMIN), (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value, type = 'string' } = req.body;

    if (value === undefined) {
      res.status(400).json({ error: 'Value is required' });
      return;
    }

    const existingSetting = db.getBy('siteSettings', 'key', key)[0];

    let stringValue = value;

    // Convert value to string based on type
    if (type === 'number') {
      stringValue = value.toString();
    } else if (type === 'boolean') {
      stringValue = value.toString();
    } else if (type === 'json') {
      stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    }

    if (existingSetting) {
      // Update existing setting
      db.update('siteSettings', existingSetting.id, {
        value: stringValue,
        type
      });
    } else {
      // Create new setting
      const newSetting: SiteSetting = {
        id: uuidv4(),
        key,
        value: stringValue,
        type
      };

      db.create('siteSettings', newSetting);
    }

    res.json({
      key,
      value,
      type
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

/**
 * DELETE /api/admin/settings/:key
 * Delete a setting
 */
router.delete('/:key', authorize(AdminRole.SUPER_ADMIN), (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    const setting = db.getBy('siteSettings', 'key', key)[0];

    if (!setting) {
      res.status(404).json({ error: 'Setting not found' });
      return;
    }

    db.delete('siteSettings', setting.id);

    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({ error: 'Failed to delete setting' });
  }
});

export default router;
