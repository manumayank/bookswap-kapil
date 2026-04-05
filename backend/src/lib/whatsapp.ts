import prisma from './prisma';

const PINNACLE_API_URL = process.env.PINNACLE_API_URL || 'https://wa.basiqcrm.com/';
const PINNACLE_API_KEY = process.env.PINNACLE_API_KEY || '';
const PINNACLE_MOBILE_NO = process.env.PINNACLE_MOBILE_NO || '';
const PINNACLE_USERNAME = process.env.PINNACLE_USERNAME || '';
const PINNACLE_PASSWORD = process.env.PINNACLE_PASSWORD || '';

interface SendTextMessageParams {
  to: string;
  message: string;
}

/**
 * Format phone number for WhatsApp API.
 * Ensures the number starts with country code (91 for India) without '+'.
 */
function formatPhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  if (cleaned.startsWith('0')) cleaned = '91' + cleaned.slice(1);
  if (!cleaned.startsWith('91') && cleaned.length === 10) cleaned = '91' + cleaned;
  return cleaned;
}

/**
 * Send a text message via Pinnacle WhatsApp API.
 * Uses the standard WhatsApp Cloud API format that Pinnacle proxies.
 */
export async function sendWhatsAppMessage({ to, message }: SendTextMessageParams): Promise<boolean> {
  const phone = formatPhone(to);

  try {
    const response = await fetch(`${PINNACLE_API_URL}api/v1/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PINNACLE_API_KEY}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'text',
        text: { body: message },
        // Pinnacle-specific auth fields (included as fallback)
        apikey: PINNACLE_API_KEY,
        mobile: PINNACLE_MOBILE_NO,
        username: PINNACLE_USERNAME,
        password: PINNACLE_PASSWORD,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[WhatsApp] Failed to send message to ${phone}:`, response.status, errorBody);
      return false;
    }

    console.log(`[WhatsApp] Message sent to ${phone}`);
    return true;
  } catch (error) {
    console.error('[WhatsApp] Error sending message:', error);
    return false;
  }
}

// ── Message templates for each notification type ─────────────────────

const TEMPLATES = {
  DEAL_REQUESTED: (listingTitle: string) =>
    `📚 *New Interest on BookSwap!*\n\nSomeone is interested in your listing "${listingTitle}". Open BookSwap to respond.`,

  DEAL_ACCEPTED: (listingTitle: string) =>
    `✅ *Deal Accepted!*\n\nYour request for "${listingTitle}" has been accepted! Open BookSwap for seller contact details.`,

  DEAL_COMPLETED: () =>
    `🎉 *Deal Completed!*\n\nYour deal has been marked as completed. Thank you for using BookSwap!`,

  DEAL_CANCELLED: () =>
    `❌ *Deal Cancelled*\n\nA deal has been cancelled. The listing is now available again.`,

  LISTING_APPROVED: (listingTitle: string) =>
    `✅ *Listing Approved!*\n\nYour listing "${listingTitle}" has been approved and is now visible to buyers on BookSwap.`,

  LISTING_REJECTED: (listingTitle: string, reason?: string) =>
    reason
      ? `⚠️ *Listing Rejected*\n\nYour listing "${listingTitle}" was rejected: ${reason}. Please review and resubmit.`
      : `⚠️ *Listing Rejected*\n\nYour listing "${listingTitle}" was rejected. Please review and resubmit on BookSwap.`,

  NEW_MATCH_FOR_REQUEST: (listingTitle: string) =>
    `📖 *Book Available!*\n\nA book matching your request is now available on BookSwap: "${listingTitle}". Check it out!`,
} as const;

type NotificationType = keyof typeof TEMPLATES;

/**
 * Send a WhatsApp notification and create a WHATSAPP notification record.
 * This is fire-and-forget — failures are logged but don't block the caller.
 */
export async function sendWhatsAppNotification(params: {
  userId: string;
  phone: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  templateArgs?: any[];
}): Promise<void> {
  const { userId, phone, type, title, body, data, templateArgs = [] } = params;

  // Build the WhatsApp message from template
  const templateFn = TEMPLATES[type] as (...args: any[]) => string;
  const message = templateFn(...templateArgs);

  // Send the WhatsApp message (non-blocking)
  const sent = await sendWhatsAppMessage({ to: phone, message });

  // Create the notification record regardless (tracks that we attempted WhatsApp)
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        channel: 'WHATSAPP',
        title,
        body,
        data: data || undefined,
      },
    });
  } catch (err) {
    console.error('[WhatsApp] Failed to create notification record:', err);
  }

  if (!sent) {
    console.warn(`[WhatsApp] Message delivery failed for user ${userId} (${phone})`);
  }
}
