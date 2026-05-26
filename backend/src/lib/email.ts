import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `"BookSwap" <${process.env.SMTP_USER}>`;
const BASE = process.env.PUBLIC_BASE_URL || 'http://localhost:3001';

/** Comma-separated list of admin emails from env, with empty entries dropped. */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_NOTIFICATION_EMAILS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function sendOtpEmail(email: string, otp: string) {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Your BookSwap OTP',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>BookSwap - Email Verification</h2>
        <p>Your OTP code is:</p>
        <h1 style="color: #4CAF50; letter-spacing: 8px;">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
}

export type EmailType =
  | 'LISTING_SUBMITTED_ADMIN'
  | 'LISTING_SUBMITTED_SELLER'
  | 'LISTING_APPROVED'
  | 'LISTING_REJECTED'
  | 'REQUEST_SUBMITTED_ADMIN'
  | 'REQUEST_SUBMITTED_REQUESTER'
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'DEAL_REQUESTED'
  | 'DEAL_ACCEPTED'
  | 'DEAL_COMPLETED'
  | 'DEAL_CANCELLED'
  | 'NEW_MATCH_FOR_REQUEST'
  | 'GRIEVANCE_FILED';

type Vars = Record<string, any>;

function wrap(title: string, body: string): string {
  return `<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111;">
    <h2 style="color: #4F46E5; margin-top: 0;">${title}</h2>
    ${body}
    <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 12px;">
    <p style="color: #888; font-size: 12px;">BookSwap — making used school books accessible.</p>
  </div>`;
}

function imageTag(path?: string | null): string {
  if (!path) return '';
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  return `<img src="${url}" alt="" style="max-width: 100%; border-radius: 8px; margin: 12px 0;">`;
}

function link(href: string, label: string): string {
  const full = href.startsWith('http') ? href : `${BASE}${href}`;
  return `<a href="${full}" style="display: inline-block; background: #4F46E5; color: #fff; padding: 12px 18px; border-radius: 8px; text-decoration: none; font-weight: bold;">${label}</a>`;
}

const TEMPLATES: Record<EmailType, (v: Vars) => { subject: string; html: string }> = {
  LISTING_SUBMITTED_ADMIN: (v) => ({
    subject: `[Admin] New listing pending approval — ${v.title}`,
    html: wrap('New listing pending approval', `
      <p><strong>${v.sellerName}</strong> just submitted a listing.</p>
      ${imageTag(v.imageUrl)}
      <p><strong>${v.title}</strong><br>${v.board || ''} ${v.class ? `Class ${v.class}` : ''}<br>City: ${v.city}<br>Price: ₹${v.sellingPrice}</p>
      <p>${link(`/admin/listings`, 'Review in admin panel')}</p>
    `),
  }),
  LISTING_SUBMITTED_SELLER: (v) => ({
    subject: `Listing submitted — awaiting approval`,
    html: wrap('Thanks for listing on BookSwap!', `
      <p>Your listing "<strong>${v.title}</strong>" has been submitted and is awaiting admin approval. We'll email you again as soon as it's approved.</p>
      ${imageTag(v.imageUrl)}
      <p>${link('/dashboard', 'View your dashboard')}</p>
    `),
  }),
  LISTING_APPROVED: (v) => ({
    subject: `Your listing is live: ${v.title}`,
    html: wrap('Listing approved!', `
      <p>Your listing "<strong>${v.title}</strong>" is now visible to buyers.</p>
      ${imageTag(v.imageUrl)}
      <p>${link(`/listings/${v.listingId}`, 'View your listing')}</p>
    `),
  }),
  LISTING_REJECTED: (v) => ({
    subject: `Listing not approved: ${v.title}`,
    html: wrap('Listing rejected', `
      <p>Your listing "<strong>${v.title}</strong>" wasn't approved.</p>
      ${v.reason ? `<p><em>Reason:</em> ${v.reason}</p>` : ''}
      <p>You can edit and resubmit from your dashboard.</p>
      <p>${link('/dashboard', 'Go to dashboard')}</p>
    `),
  }),
  REQUEST_SUBMITTED_ADMIN: (v) => ({
    subject: `[Admin] New request pending approval — ${v.requesterName}`,
    html: wrap('New request pending approval', `
      <p><strong>${v.requesterName}</strong> just submitted a book request.</p>
      <p>Board: ${v.board || '—'}<br>Class: ${v.class || '—'}<br>City: ${v.city || '—'}<br>Max price: ${v.maxPrice ? `₹${v.maxPrice}` : '—'}</p>
      <p>${link('/admin/requests', 'Review in admin panel')}</p>
    `),
  }),
  REQUEST_SUBMITTED_REQUESTER: () => ({
    subject: `Request submitted — awaiting approval`,
    html: wrap('Thanks for posting your request!', `
      <p>We've received your request and it's awaiting admin approval. As soon as it's approved we'll start matching it against new listings.</p>
      <p>${link('/dashboard', 'View your dashboard')}</p>
    `),
  }),
  REQUEST_APPROVED: () => ({
    subject: `Your request is live`,
    html: wrap('Request approved!', `
      <p>Your book request is now live. We'll email you as soon as a matching listing appears.</p>
      <p>${link('/dashboard', 'View your dashboard')}</p>
    `),
  }),
  REQUEST_REJECTED: (v) => ({
    subject: `Request not approved`,
    html: wrap('Request rejected', `
      <p>Your request wasn't approved.</p>
      ${v.reason ? `<p><em>Reason:</em> ${v.reason}</p>` : ''}
      <p>You can post a new request from your dashboard.</p>
    `),
  }),
  DEAL_REQUESTED: (v) => ({
    subject: `New interest in your listing (${v.code})`,
    html: wrap('Someone is interested!', `
      <p>Transaction reference: <strong>${v.code}</strong></p>
      <p>A buyer is interested in your listing "<strong>${v.title}</strong>".</p>
      ${imageTag(v.imageUrl)}
      <p>${link('/dashboard', 'Open your dashboard to respond')}</p>
    `),
  }),
  DEAL_ACCEPTED: (v) => ({
    subject: `Deal accepted! (${v.code})`,
    html: wrap('Your deal was accepted', `
      <p>Transaction reference: <strong>${v.code}</strong></p>
      <p>The seller has accepted your interest in "<strong>${v.title}</strong>". Here are their contact details:</p>
      <p><strong>${v.sellerName}</strong><br>Phone: ${v.sellerPhone}<br>Pickup: ${v.pickupLocation}${v.sellerAddress ? `<br>Address: ${v.sellerAddress}` : ''}</p>
      ${imageTag(v.imageUrl)}
      <p>${link('/dashboard', 'View deal details')}</p>
    `),
  }),
  DEAL_COMPLETED: (v) => ({
    subject: `Deal completed (${v.code})`,
    html: wrap('Deal completed', `
      <p>Transaction reference: <strong>${v.code}</strong></p>
      <p>The deal for "<strong>${v.title}</strong>" has been marked complete. Thank you for using BookSwap!</p>
    `),
  }),
  DEAL_CANCELLED: (v) => ({
    subject: `Deal cancelled (${v.code})`,
    html: wrap('Deal cancelled', `
      <p>Transaction reference: <strong>${v.code}</strong></p>
      <p>The deal for "<strong>${v.title}</strong>" has been cancelled. The listing is available again.</p>
    `),
  }),
  NEW_MATCH_FOR_REQUEST: (v) => ({
    subject: `New book matches your request: ${v.title}`,
    html: wrap('A book matching your request is available', `
      <p>"<strong>${v.title}</strong>" was just listed and matches your open request.</p>
      ${imageTag(v.imageUrl)}
      <p>${link(`/listings/${v.listingId}`, 'View listing')}</p>
    `),
  }),
  GRIEVANCE_FILED: (v) => ({
    subject: `[Admin] New grievance filed — ${v.subject}`,
    html: wrap('New grievance filed', `
      <p><strong>From:</strong> ${v.submitterName} (${v.submitterEmail})</p>
      ${v.transactionCode ? `<p><strong>Transaction reference:</strong> ${v.transactionCode}</p>` : ''}
      <p><strong>Subject:</strong> ${v.subject}</p>
      <p><strong>Description:</strong><br>${v.description.replace(/\n/g, '<br>')}</p>
      <p>${link('/admin/grievances', 'Open admin inbox')}</p>
    `),
  }),
};

/**
 * Send a transactional email for an event. Fire-and-forget — failures
 * are logged but never thrown. Returns immediately if `to` is empty.
 */
export async function sendEventEmail(params: {
  to: string | string[];
  type: EmailType;
  vars: Record<string, any>;
}): Promise<void> {
  const { type, vars } = params;
  const recipients = Array.isArray(params.to) ? params.to : [params.to];
  const cleaned = recipients.filter(Boolean);
  if (cleaned.length === 0) return;

  const { subject, html } = TEMPLATES[type](vars);

  try {
    await transporter.sendMail({
      from: FROM,
      to: cleaned.join(','),
      subject,
      html,
    });
    console.log(`[email] ${type} → ${cleaned.join(', ')}`);
  } catch (err) {
    console.error(`[email] failed to send ${type}:`, err);
  }
}
