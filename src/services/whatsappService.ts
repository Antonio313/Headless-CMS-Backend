import twilio from 'twilio';

// Twilio configuration (from environment variables)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER; // Format: whatsapp:+14155238886

// Create Twilio client
const createTwilioClient = () => {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
    console.warn('⚠️ WhatsApp service not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER environment variables.');
    return null;
  }

  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
};

export interface LeadWhatsAppData {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  source: string;
  score: number;
  createdAt: string;
}

export async function sendWhatsAppNotification(
  toPhone: string,
  leadData: LeadWhatsAppData
): Promise<boolean> {
  const client = createTwilioClient();

  if (!client) {
    console.log('💬 WhatsApp notification skipped (not configured)');
    return false;
  }

  try {
    const scoreEmoji = leadData.score >= 61 ? '🔥' : leadData.score >= 31 ? '⚡' : '❄️';
    const scoreLabel = leadData.score >= 61 ? 'HOT LEAD' : leadData.score >= 31 ? 'WARM LEAD' : 'COLD LEAD';

    // Ensure phone number has correct WhatsApp prefix
    const whatsappTo = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`;

    const messageBody = `*💎 NEW LEAD ALERT! ${scoreEmoji}*

*${scoreLabel}* - Score: ${leadData.score}/100

*Contact Information:*
👤 Name: ${leadData.name}
📧 Email: ${leadData.email}${leadData.phone ? `\n📱 Phone: ${leadData.phone}` : ''}
🎯 Source: ${leadData.source}
🕐 Time: ${new Date(leadData.createdAt).toLocaleString()}
${leadData.message ? `\n\n*Message:*\n${leadData.message}` : ''}

---
💎 Jewels & Time CMS
View in dashboard: ${process.env.ADMIN_DASHBOARD_URL || 'http://localhost:5174'}/leads`;

    await client.messages.create({
      body: messageBody,
      from: TWILIO_WHATSAPP_NUMBER,
      to: whatsappTo,
    });

    console.log(`✅ WhatsApp notification sent to ${toPhone}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending WhatsApp notification:', error);
    return false;
  }
}
