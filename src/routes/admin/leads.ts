import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { db } from '../../utils/database';
import { Lead, LeadStatus, LeadNote, Wishlist } from '../../types';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { calculateLeadScore, getLeadCategory, getScoreBreakdown } from '../../services/leadScoring';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * GET /api/admin/leads
 * Get all leads with filters
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const {
      status,
      source,
      minScore,
      maxScore,
      assignedTo,
      dateFrom,
      dateTo,
      limit = '50',
      page = '1',
      sort = 'createdAt_desc'
    } = req.query;

    let leads = db.getAll('leads');

    // Apply filters
    if (status) {
      leads = leads.filter((l: Lead) => l.status === status);
    }

    if (source) {
      leads = leads.filter((l: Lead) => l.source === source);
    }

    if (minScore) {
      leads = leads.filter((l: Lead) => l.score >= parseInt(minScore as string));
    }

    if (maxScore) {
      leads = leads.filter((l: Lead) => l.score <= parseInt(maxScore as string));
    }

    if (assignedTo) {
      leads = leads.filter((l: Lead) => l.assignedTo === assignedTo);
    }

    if (dateFrom) {
      leads = leads.filter((l: Lead) => new Date(l.createdAt) >= new Date(dateFrom as string));
    }

    if (dateTo) {
      leads = leads.filter((l: Lead) => new Date(l.createdAt) <= new Date(dateTo as string));
    }

    // Apply sorting
    const [sortField, sortOrder] = (sort as string).split('_');
    leads.sort((a: any, b: any) => {
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

    const paginatedLeads = leads.slice(startIndex, endIndex);

    // Enrich with lead categories
    const enrichedLeads = paginatedLeads.map((lead: Lead) => ({
      ...lead,
      category: getLeadCategory(lead.score)
    }));

    res.json({
      leads: enrichedLeads,
      pagination: {
        total: leads.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(leads.length / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

/**
 * GET /api/admin/leads/stats
 * Get lead statistics
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    const leads = db.getAll('leads');

    // Get leads created in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentLeads = leads.filter((l: Lead) =>
      new Date(l.createdAt) >= thirtyDaysAgo
    );

    const stats = {
      total: leads.length,
      new: leads.filter((l: Lead) => l.status === LeadStatus.NEW).length,
      contacted: leads.filter((l: Lead) => l.status === LeadStatus.CONTACTED).length,
      qualified: leads.filter((l: Lead) => l.status === LeadStatus.QUALIFIED).length,
      scheduled: leads.filter((l: Lead) => l.status === LeadStatus.SCHEDULED).length,
      converted: leads.filter((l: Lead) => l.status === LeadStatus.CONVERTED).length,
      lost: leads.filter((l: Lead) => l.status === LeadStatus.LOST).length,
      hot: leads.filter((l: Lead) => l.score >= 61).length,
      warm: leads.filter((l: Lead) => l.score >= 31 && l.score < 61).length,
      cold: leads.filter((l: Lead) => l.score < 31).length,
      avgScore: leads.reduce((acc, l: Lead) => acc + l.score, 0) / leads.length || 0,
      last30Days: recentLeads.length
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching lead stats:', error);
    res.status(500).json({ error: 'Failed to fetch lead stats' });
  }
});

/**
 * GET /api/admin/leads/:id
 * Get single lead with full details
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const lead = db.getById('leads', id) as Lead;

    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    // Get wishlist if exists
    const wishlist = lead.wishlistId ? db.getById('wishlists', lead.wishlistId) : null;

    // Get notes
    const notes = db.getBy('leadNotes', 'leadId', id);

    // Get score breakdown
    const scoreBreakdown = getScoreBreakdown(lead, wishlist as Wishlist);

    res.json({
      lead: {
        ...lead,
        category: getLeadCategory(lead.score)
      },
      wishlist,
      notes,
      scoreBreakdown
    });
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

/**
 * PUT /api/admin/leads/:id
 * Update lead
 */
const updateLeadSchema = z.object({
  status: z.nativeEnum(LeadStatus).optional(),
  assignedTo: z.string().optional(),
  contactedAt: z.string().optional(),
  convertedAt: z.string().optional()
});

router.put('/:id', validate(updateLeadSchema), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existingLead = db.getById('leads', id);

    if (!existingLead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    const updatedLead = db.update('leads', id, updates);

    res.json({ lead: updatedLead });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

/**
 * POST /api/admin/leads/:id/notes
 * Add note to lead
 */
const noteSchema = z.object({
  note: z.string().min(1),
  createdBy: z.string()
});

router.post('/:id/notes', validate(noteSchema), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { note, createdBy } = req.body;

    const lead = db.getById('leads', id);

    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    const leadNote: LeadNote = {
      id: uuidv4(),
      leadId: id,
      note,
      createdBy,
      createdAt: new Date().toISOString()
    };

    db.create('leadNotes', leadNote);

    res.status(201).json({ note: leadNote });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

/**
 * DELETE /api/admin/leads/:id
 * Delete lead
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Delete associated notes
    const notes = db.getBy('leadNotes', 'leadId', id);
    notes.forEach((note: LeadNote) => {
      db.delete('leadNotes', note.id);
    });

    // Delete lead
    const deleted = db.delete('leads', id);

    if (!deleted) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

export default router;
