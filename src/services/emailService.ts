import nodemailer from 'nodemailer';

// Email configuration (can be moved to environment variables)
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, // Your email
    pass: process.env.SMTP_PASS, // Your email password or app password
  },
};

// Create reusable transporter
const createTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ Email service not configured. Set SMTP_USER and SMTP_PASS environment variables.');
    return null;
  }

  return nodemailer.createTransporter(EMAIL_CONFIG);
};

export interface LeadEmailData {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  source: string;
  score: number;
  createdAt: string;
}

export async function sendLeadNotification(
  toEmail: string,
  leadData: LeadEmailData
): Promise<boolean> {
  const transporter = createTransporter();

  if (!transporter) {
    console.log('📧 Email notification skipped (not configured)');
    return false;
  }

  try {
    const scoreColor = leadData.score >= 61 ? '#EF4444' : leadData.score >= 31 ? '#F59E0B' : '#3B82F6';
    const scoreLabel = leadData.score >= 61 ? '🔥 HOT LEAD' : leadData.score >= 31 ? '⚡ WARM LEAD' : '❄️ COLD LEAD';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Lead Notification</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">💎 New Lead Alert!</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <!-- Lead Score Badge -->
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="display: inline-block; padding: 10px 20px; background-color: ${scoreColor}; color: white; border-radius: 25px; font-weight: bold; font-size: 16px;">
              ${scoreLabel} - ${leadData.score}/100
            </span>
          </div>

          <!-- Lead Details -->
          <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Contact Information</h2>

            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-weight: bold; width: 120px;">👤 Name:</td>
                <td style="padding: 10px 0; color: #1f2937;">${leadData.name}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">📧 Email:</td>
                <td style="padding: 10px 0;"><a href="mailto:${leadData.email}" style="color: #3b82f6; text-decoration: none;">${leadData.email}</a></td>
              </tr>
              ${leadData.phone ? `
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">📱 Phone:</td>
                <td style="padding: 10px 0;"><a href="tel:${leadData.phone}" style="color: #3b82f6; text-decoration: none;">${leadData.phone}</a></td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">🎯 Source:</td>
                <td style="padding: 10px 0; color: #1f2937;">${leadData.source}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">🕐 Time:</td>
                <td style="padding: 10px 0; color: #1f2937;">${new Date(leadData.createdAt).toLocaleString()}</td>
              </tr>
            </table>
          </div>

          ${leadData.message ? `
          <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">💬 Message</h2>
            <div style="background: #f9fafb; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; white-space: pre-wrap;">
              ${leadData.message}
            </div>
          </div>
          ` : ''}

          <!-- Action Buttons -->
          <div style="text-align: center; margin-top: 30px;">
            <a href="mailto:${leadData.email}" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 5px;">
              📧 Reply to Lead
            </a>
            ${leadData.phone ? `
            <a href="tel:${leadData.phone}" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 5px;">
              📞 Call Now
            </a>
            ` : ''}
          </div>

          <!-- Footer -->
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
            <p style="margin: 5px 0;">💎 Jewels & Time - Luxury Jewelry in Jamaica</p>
            <p style="margin: 5px 0;">View this lead in your <a href="${process.env.ADMIN_DASHBOARD_URL || 'http://localhost:5174'}/leads" style="color: #3b82f6; text-decoration: none;">Admin Dashboard</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Jewels & Time CMS" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `🔔 ${scoreLabel} - New Lead: ${leadData.name}`,
      html: htmlContent,
    });

    console.log(`✅ Email notification sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email notification:', error);
    return false;
  }
}
