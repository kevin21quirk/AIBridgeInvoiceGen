import nodemailer from 'nodemailer';
import type { Transporter, SentMessageInfo } from 'nodemailer';

// ─── Company constants (mirrors src/lib/constants.ts) ────────────────────────

const COMPANY = {
  name: 'AI BRIDGE SOLUTIONS LIMITED',
  email: 'support@aibridgesolutions.co.uk',
  phone: '+44 7359 969266',
  website: 'https://aibridgesolutions.co.uk',
  bankAccount: '20688237',
  sortCode: '04-29-09',
  companyNumber: '15999929',
  address: {
    line1: '77 Church Street',
    line2: 'Burton Latimer',
    city: 'Northamptonshire',
    postcode: 'NN15 5LU',
    country: 'United Kingdom',
  },
} as const;

// ─── Typed environment config ────────────────────────────────────────────────

export interface ImapConfig {
  host: string;
  port: number;
  user: string;
  password: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
}

export interface EmailEnvConfig {
  imap: ImapConfig;
  smtp: SmtpConfig;
}

const REQUIRED_ENV_VARS = [
  'IMAP_HOST',
  'IMAP_PORT',
  'IMAP_USER',
  'IMAP_PASSWORD',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'SMTP_FROM',
] as const;

type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number];

export function validateEmailEnv(): EmailEnvConfig {
  const missing: RequiredEnvVar[] = REQUIRED_ENV_VARS.filter(
    (key) => !process.env[key]
  ) as RequiredEnvVar[];

  if (missing.length > 0) {
    throw new Error(
      `Missing required email environment variables: ${missing.join(', ')}\n` +
        `Please set these in your .env file or Vercel environment settings.`
    );
  }

  return {
    imap: {
      host: process.env.IMAP_HOST!,
      port: parseInt(process.env.IMAP_PORT!, 10),
      user: process.env.IMAP_USER!,
      password: process.env.IMAP_PASSWORD!,
    },
    smtp: {
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT!, 10),
      user: process.env.SMTP_USER!,
      password: process.env.SMTP_PASSWORD!,
      from: process.env.SMTP_FROM!,
    },
  };
}

function createTransporter(): Transporter {
  const { smtp } = validateEmailEnv();
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.password },
    tls: { rejectUnauthorized: false },
    logger: false,
    debug: false,
  });
}

export async function testEmailConnection(): Promise<{ ok: boolean; detail: string }> {
  const config = validateEmailEnv();
  const transporter = createTransporter();
  try {
    await transporter.verify();
    return { ok: true, detail: `SMTP connection verified — ${config.smtp.host}:${config.smtp.port} as ${config.smtp.user}` };
  } catch (err: any) {
    return { ok: false, detail: err.message || String(err) };
  }
}

// ─── Email data types ────────────────────────────────────────────────────────

export interface InvoiceEmailData {
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  issueDate: string;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  total: number;
  notes?: string;
}

export interface ReceiptEmailData {
  receiptNumber: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  notes?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function gbp(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount);
}

// ─── HTML templates ──────────────────────────────────────────────────────────

function invoiceHtml(data: InvoiceEmailData): string {
  const rows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;">${item.description}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:14px;">${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:14px;">${gbp(item.unitPrice)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:14px;font-weight:600;">${gbp(item.total)}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:20px;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
<div style="max-width:680px;margin:0 auto;">

  <!-- Header -->
  <div style="background:#1e40af;padding:32px;border-radius:10px 10px 0 0;text-align:center;">
    <h1 style="margin:0;color:#ffffff;font-size:30px;letter-spacing:3px;font-weight:700;">INVOICE</h1>
    <p style="margin:8px 0 0;color:#bfdbfe;font-size:13px;letter-spacing:1px;">${COMPANY.name}</p>
  </div>

  <!-- Body -->
  <div style="background:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;">

    <!-- Meta row -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="vertical-align:top;">
          <p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Billed To</p>
          <p style="margin:6px 0 0;font-size:17px;font-weight:700;">${data.clientName}</p>
        </td>
        <td style="vertical-align:top;text-align:right;">
          <p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Invoice Number</p>
          <p style="margin:6px 0 0;font-size:20px;font-weight:700;color:#1e40af;">${data.invoiceNumber}</p>
          <p style="margin:10px 0 0;font-size:12px;color:#6b7280;">Issue Date: <strong style="color:#111827;">${data.issueDate}</strong></p>
          <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">Due Date: <strong style="color:#dc2626;">${data.dueDate}</strong></p>
        </td>
      </tr>
    </table>

    <!-- Items table -->
    <table width="100%" cellpadding="0" cellspacing="0"
           style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:24px;">
      <thead>
        <tr style="background:#1e40af;">
          <th style="padding:12px;text-align:left;color:#fff;font-size:12px;text-transform:uppercase;">Description</th>
          <th style="padding:12px;text-align:center;color:#fff;font-size:12px;text-transform:uppercase;">Qty</th>
          <th style="padding:12px;text-align:right;color:#fff;font-size:12px;text-transform:uppercase;">Unit Price</th>
          <th style="padding:12px;text-align:right;color:#fff;font-size:12px;text-transform:uppercase;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr style="background:#f8fafc;">
          <td colspan="3" style="padding:14px 12px;text-align:right;font-weight:700;font-size:15px;">Total Due</td>
          <td style="padding:14px 12px;text-align:right;font-weight:700;font-size:20px;color:#1e40af;">${gbp(data.total)}</td>
        </tr>
      </tfoot>
    </table>

    <!-- Payment details -->
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 10px;font-weight:700;color:#1e40af;font-size:14px;">Payment Details</p>
      <p style="margin:0;font-size:14px;">Account Number: <strong>${COMPANY.bankAccount}</strong></p>
      <p style="margin:4px 0;font-size:14px;">Sort Code: <strong>${COMPANY.sortCode}</strong></p>
      <p style="margin:12px 0 0;font-size:13px;background:#fef2f2;border:1px solid #fecaca;border-radius:4px;padding:8px;color:#dc2626;">
        <strong>⚠ Payment Reference:</strong> Please quote <strong>${data.invoiceNumber}</strong> with your payment.
      </p>
    </div>

    ${
      data.notes
        ? `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Notes</p>
      <p style="margin:0;font-size:14px;">${data.notes}</p>
    </div>`
        : ''
    }

    <p style="font-size:13px;color:#6b7280;text-align:center;margin:0;">
      If you have any questions about this invoice, please contact us at
      <a href="mailto:${COMPANY.email}" style="color:#1e40af;">${COMPANY.email}</a>
    </p>
  </div>

  <!-- Footer -->
  <div style="background:#1e3a8a;padding:20px;border-radius:0 0 10px 10px;text-align:center;">
    <p style="margin:0;color:#bfdbfe;font-size:13px;font-weight:600;">${COMPANY.name}</p>
    <p style="margin:6px 0 0;color:#93c5fd;font-size:12px;">
      ${COMPANY.address.line1}, ${COMPANY.address.city}, ${COMPANY.address.postcode}
    </p>
    <p style="margin:6px 0 0;color:#93c5fd;font-size:12px;">
      ${COMPANY.email} &nbsp;|&nbsp; ${COMPANY.phone} &nbsp;|&nbsp; ${COMPANY.website}
    </p>
    <p style="margin:6px 0 0;color:#60a5fa;font-size:11px;">Company No: ${COMPANY.companyNumber}</p>
  </div>

</div>
</body>
</html>`;
}

function receiptHtml(data: ReceiptEmailData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:20px;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
<div style="max-width:680px;margin:0 auto;">

  <!-- Header -->
  <div style="background:#15803d;padding:32px;border-radius:10px 10px 0 0;text-align:center;">
    <h1 style="margin:0;color:#ffffff;font-size:28px;letter-spacing:3px;font-weight:700;">PAYMENT RECEIPT</h1>
    <p style="margin:8px 0 0;color:#bbf7d0;font-size:13px;letter-spacing:1px;">${COMPANY.name}</p>
  </div>

  <!-- Body -->
  <div style="background:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;">

    <!-- Amount hero -->
    <div style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:10px;padding:28px;text-align:center;margin-bottom:28px;">
      <p style="margin:0;font-size:12px;color:#16a34a;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Payment Confirmed ✓</p>
      <p style="margin:10px 0;font-size:42px;font-weight:700;color:#15803d;">${gbp(data.amount)}</p>
      <p style="margin:0;font-size:13px;color:#6b7280;">Receipt ${data.receiptNumber}</p>
    </div>

    <!-- Details table -->
    <table width="100%" cellpadding="0" cellspacing="0"
           style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:24px;">
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:12px 16px;font-size:12px;color:#9ca3af;text-transform:uppercase;width:40%;">Client</td>
        <td style="padding:12px 16px;font-weight:600;">${data.clientName}</td>
      </tr>
      <tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;">
        <td style="padding:12px 16px;font-size:12px;color:#9ca3af;text-transform:uppercase;">Invoice Reference</td>
        <td style="padding:12px 16px;font-weight:600;color:#1e40af;">${data.invoiceNumber}</td>
      </tr>
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:12px 16px;font-size:12px;color:#9ca3af;text-transform:uppercase;">Payment Method</td>
        <td style="padding:12px 16px;">${data.paymentMethod}</td>
      </tr>
      <tr style="background:#f9fafb;">
        <td style="padding:12px 16px;font-size:12px;color:#9ca3af;text-transform:uppercase;">Payment Date</td>
        <td style="padding:12px 16px;">${data.paymentDate}</td>
      </tr>
    </table>

    ${
      data.notes
        ? `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Notes</p>
      <p style="margin:0;font-size:14px;">${data.notes}</p>
    </div>`
        : ''
    }

    <p style="font-size:13px;color:#6b7280;text-align:center;margin:0;">
      Thank you for your payment. Please retain this receipt for your records.<br>
      Questions? Contact us at <a href="mailto:${COMPANY.email}" style="color:#15803d;">${COMPANY.email}</a>
    </p>
  </div>

  <!-- Footer -->
  <div style="background:#14532d;padding:20px;border-radius:0 0 10px 10px;text-align:center;">
    <p style="margin:0;color:#bbf7d0;font-size:13px;font-weight:600;">${COMPANY.name}</p>
    <p style="margin:6px 0 0;color:#86efac;font-size:12px;">
      ${COMPANY.email} &nbsp;|&nbsp; ${COMPANY.phone} &nbsp;|&nbsp; ${COMPANY.website}
    </p>
    <p style="margin:6px 0 0;color:#4ade80;font-size:11px;">Company No: ${COMPANY.companyNumber}</p>
  </div>

</div>
</body>
</html>`;
}

// ─── Send functions ──────────────────────────────────────────────────────────

export async function sendInvoiceEmail(data: InvoiceEmailData): Promise<SentMessageInfo> {
  const { smtp } = validateEmailEnv();
  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: `"${COMPANY.name}" <${smtp.from}>`,
    to: data.clientEmail,
    subject: `Invoice ${data.invoiceNumber} from ${COMPANY.name}`,
    html: invoiceHtml(data),
  });
  console.log(`[email] Invoice sent — messageId: ${info.messageId} | accepted: ${info.accepted} | rejected: ${info.rejected}`);
  return info;
}

export async function sendReceiptEmail(data: ReceiptEmailData): Promise<SentMessageInfo> {
  const { smtp } = validateEmailEnv();
  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: `"${COMPANY.name}" <${smtp.from}>`,
    to: data.clientEmail,
    subject: `Payment Receipt ${data.receiptNumber} — ${COMPANY.name}`,
    html: receiptHtml(data),
  });
  console.log(`[email] Receipt sent — messageId: ${info.messageId} | accepted: ${info.accepted} | rejected: ${info.rejected}`);
  return info;
}
