import { Router, Request, Response } from 'express';

const router = Router();

/**
 * POST /api/webhooks/whatsapp
 * Callback endpoint for Pinnacle WhatsApp API.
 * Receives delivery status updates and incoming messages.
 */
router.post('/whatsapp', (req: Request, res: Response) => {
  const payload = req.body;

  try {
    // Extract the change type
    const entry = payload?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value) {
      res.json({ code: 200, status: 'success' });
      return;
    }

    // Handle delivery status updates (sent, delivered, read, failed, deleted)
    if (value.statuses) {
      for (const status of value.statuses) {
        console.log(
          `[WhatsApp Callback] Message ${status.id} → ${status.status} for ${status.recipient_id}` +
          (status.errors ? ` | Error: ${JSON.stringify(status.errors)}` : '')
        );
      }
    }

    // Handle incoming messages from users
    if (value.messages) {
      for (const message of value.messages) {
        const from = message.from;
        const contactName = value.contacts?.[0]?.profile?.name || 'Unknown';
        const msgType = message.type;
        const body = message.text?.body || message.button?.text || `[${msgType}]`;

        console.log(`[WhatsApp Incoming] ${contactName} (${from}): ${body}`);

        // Future: handle user replies, auto-responses, etc.
      }
    }

    // Handle template status updates
    if (change?.field === 'message_template_status_update') {
      console.log(`[WhatsApp Template] ${value.event} — ${value.message_template_name}`);
    }
  } catch (err) {
    console.error('[WhatsApp Callback] Error processing webhook:', err);
  }

  // Always respond 200 to acknowledge receipt
  res.json({ code: 200, status: 'success' });
});

/**
 * GET /api/webhooks/whatsapp
 * Verification endpoint — some WhatsApp providers send a GET to verify the webhook URL.
 */
router.get('/whatsapp', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // You can set a verify token in env if needed
  if (mode === 'subscribe') {
    res.status(200).send(challenge);
    return;
  }

  res.status(200).json({ status: 'ok' });
});

export default router;
