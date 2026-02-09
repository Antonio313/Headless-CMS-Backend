import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { db } from '../../utils/database';
import { Lead, LeadSource, LeadStatus } from '../../types';
import { calculateLeadScore } from '../../services/leadScoring';
import { validate } from '../../middleware/validation';
import { optionalAuth } from '../../middleware/auth';
import { sendLeadNotification } from '../../services/emailService';
import { sendWhatsAppNotification } from '../../services/whatsappService';

const router = Router();

// Helper function to send notifications
async function sendNotifications(lead: Lead) {
  const settings = db.getAll('siteSettings');

  // Get notification settings
  const emailEnabled = settings.find(s => s.key === 'enableEmailNotifications')?.value !== 'false';
  const whatsappEnabled = settings.find(s => s.key === 'enableWhatsappNotifications')?.value !== 'false';
  const notificationEmail = settings.find(s => s.key === 'leadNotificationEmail')?.value as string | undefined;
  const notificationWhatsapp = settings.find(s => s.key === 'leadNotificationWhatsapp')?.value as string | undefined;

  const leadData = {
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    message: lead.message,
    source: lead.source,
    score: lead.score,
    createdAt: lead.createdAt
  };

  // Send email notification
  if (emailEnabled && notificationEmail) {
    await sendLeadNotification(notificationEmail, leadData);
  }

  // Send WhatsApp notification
  if (whatsappEnabled && notificationWhatsapp) {
    await sendWhatsAppNotification(notificationWhatsapp, leadData);
  }
}

// Validation schema for lead creation
const createLeadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  message: z.string().optional(),
  wishlistId: z.string().optional(),
  source: z.nativeEnum(LeadSource).optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  referrer: z.string().optional()
});

/**
 * POST /api/leads
 * Create a new lead
 */
router.post('/', optionalAuth, validate(createLeadSchema), async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      phone,
      message,
      wishlistId,
      source,
      utmSource,
      utmMedium,
      utmCampaign,
      referrer
    } = req.body;

    // Get wishlist if provided
    const wishlist = wishlistId ? db.getById('wishlists', wishlistId) : undefined;

    const customerId = req.user?.role === 'CUSTOMER' ? req.user.userId : undefined;

    const lead: Lead = {
      id: uuidv4(),
      name,
      email,
      phone: phone || undefined,
      source: source || LeadSource.WEBSITE,
      status: LeadStatus.NEW,
      score: 0,
      message: message || undefined,
      wishlistId: wishlistId || undefined,
      customerId,
      utmSource: utmSource || undefined,
      utmMedium: utmMedium || undefined,
      utmCampaign: utmCampaign || undefined,
      referrer: referrer || undefined,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Calculate lead score
    lead.score = calculateLeadScore(lead, wishlist, customerId);

    db.create('leads', lead);

    // Send notifications (email & WhatsApp)
    await sendNotifications(lead);

    // Console log for debugging
    console.log('📧 NEW LEAD CREATED');
    console.log('========================');
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Score: ${lead.score}/100`);
    console.log(`Source: ${lead.source}`);
    if (wishlistId) {
      console.log(`Wishlist: ${wishlist?.items.length} items`);
    }
    console.log('========================\n');

    res.status(201).json({
      leadId: lead.id,
      message: 'Thank you for your interest! We\'ll be in touch soon.',
      score: lead.score
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

/**
 * POST /api/contact
 * Contact form submission (creates a lead)
 */
const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  productId: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters')
});

router.post('/contact', optionalAuth, validate(contactSchema), async (req: Request, res: Response) => {
  try {
    const { name, email, phone, productId, message } = req.body;

    const customerId = req.user?.role === 'CUSTOMER' ? req.user.userId : undefined;

    const lead: Lead = {
      id: uuidv4(),
      name,
      email,
      phone: phone || undefined,
      source: LeadSource.CONTACT_FORM,
      status: LeadStatus.NEW,
      score: 0,
      message: productId ? `Product inquiry: ${productId}\n\n${message}` : message,
      customerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    // Calculate lead score
    lead.score = calculateLeadScore(lead, undefined, customerId);

    db.create('leads', lead);

    // Send notifications (email & WhatsApp)
    await sendNotifications(lead);

    console.log('📧 CONTACT FORM SUBMISSION');
    console.log('==========================');
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Message: ${message}`);
    console.log('==========================\n');

    res.status(201).json({
      leadId: lead.id,
      message: 'Thank you for contacting us! We\'ll respond within 24 hours.'
    });
  } catch (error) {
    console.error('Error processing contact form:', error);
    res.status(500).json({ error: 'Failed to process contact form' });
  }
});

export default router;
