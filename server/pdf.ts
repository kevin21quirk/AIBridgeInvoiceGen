import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// ─── Logo loader ──────────────────────────────────────────────────────────────

function loadLogo(): Buffer | null {
  const candidates = [
    path.join(process.cwd(), 'Public', 'Logos', 'Asset 2@4000x.png'),
    path.join(process.cwd(), 'public', 'Logos', 'Asset 2@4000x.png'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return fs.readFileSync(p);
    } catch { /* continue */ }
  }
  return null;
}

const LOGO_BUFFER: Buffer | null = (() => { try { return loadLogo(); } catch { return null; } })();

// ─── Company constants ────────────────────────────────────────────────────────

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

// ─── Page geometry ────────────────────────────────────────────────────────────

const PAGE_W = 595.28;
const LEFT   = 50;
const RIGHT  = PAGE_W - LEFT;
const CONTENT_W = RIGHT - LEFT;

// ─── Colour palette (matches app's Tailwind theme) ───────────────────────────

const PRIMARY  = '#2563eb';   // text-primary-600 / blue
const DARK     = '#111827';   // text-gray-900
const MID      = '#374151';   // text-gray-700
const GRAY     = '#6b7280';   // text-gray-500
const MUTED    = '#9ca3af';   // text-gray-400
const BORDER   = '#d1d5db';   // border-gray-300
const BORDER_L = '#e5e7eb';   // border-gray-200
const BOX_BG   = '#f9fafb';   // bg-gray-50
const AMBER_BG = '#fffbeb';   // bg-amber-50
const AMBER    = '#92400e';   // text-amber-800

// ─── Helpers ─────────────────────────────────────────────────────────────────

function gbp(n: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);
}

function fmtDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  } catch { return d; }
}

function hLine(
  doc: InstanceType<typeof PDFDocument>,
  y: number,
  color = BORDER_L,
  width = 0.5,
) {
  doc.moveTo(LEFT, y).lineTo(RIGHT, y).strokeColor(color).lineWidth(width).stroke();
}

// ─── Shared data types ────────────────────────────────────────────────────────

export interface InvoiceEmailData {
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientCompanyName?: string;
  clientAddress?: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    country: string;
  };
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

// ─── Invoice PDF ──────────────────────────────────────────────────────────────
// Matches the clean white layout used in ViewInvoice.tsx

export function generateInvoicePdf(data: InvoiceEmailData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: LEFT, autoFirstPage: true });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── Left column: logo → INVOICE heading → company name ────────
    let leftY = 45;

    if (LOGO_BUFFER) {
      doc.image(LOGO_BUFFER, LEFT, leftY, { fit: [160, 65] });
      leftY += 72;
    }

    doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(28)
       .text('INVOICE', LEFT, leftY);
    leftY += 34;

    doc.fillColor(GRAY).font('Helvetica').fontSize(8.5)
       .text(COMPANY.name, LEFT, leftY);
    leftY += 12;

    // ── Right column: invoice meta ─────────────────────────────────
    const metaX = 355;
    const metaW = RIGHT - metaX;
    let metaY = 45;

    doc.fillColor(MUTED).font('Helvetica').fontSize(8)
       .text('Invoice Number', metaX, metaY, { width: metaW });
    metaY += 12;
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(13)
       .text(data.invoiceNumber, metaX, metaY, { width: metaW });
    metaY += 26;

    doc.fillColor(MUTED).font('Helvetica').fontSize(8)
       .text('Issue Date', metaX, metaY, { width: metaW });
    metaY += 12;
    doc.fillColor(DARK).font('Helvetica').fontSize(10)
       .text(fmtDate(data.issueDate), metaX, metaY, { width: metaW });
    metaY += 20;

    doc.fillColor(MUTED).font('Helvetica').fontSize(8)
       .text('Due Date', metaX, metaY, { width: metaW });
    metaY += 12;
    doc.fillColor(DARK).font('Helvetica').fontSize(10)
       .text(fmtDate(data.dueDate), metaX, metaY, { width: metaW });
    metaY += 12;

    // ── Divider below header ───────────────────────────────────────
    let y = Math.max(leftY, metaY) + 14;
    hLine(doc, y, BORDER, 1.5);
    y += 18;

    // ── Bill To ────────────────────────────────────────────────────
    doc.fillColor(MID).font('Helvetica-Bold').fontSize(9)
       .text('Bill To:', LEFT, y);
    y += 15;

    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(11)
       .text(data.clientName, LEFT, y);
    y += 16;

    if (data.clientCompanyName) {
      doc.fillColor(GRAY).font('Helvetica').fontSize(9)
         .text(data.clientCompanyName, LEFT, y);
      y += 14;
    }

    if (data.clientAddress) {
      doc.fillColor(DARK).font('Helvetica').fontSize(9);
      doc.text(data.clientAddress.line1, LEFT, y);                          y += 13;
      if (data.clientAddress.line2) { doc.text(data.clientAddress.line2, LEFT, y); y += 13; }
      doc.text(`${data.clientAddress.city}, ${data.clientAddress.postcode}`, LEFT, y); y += 13;
      doc.text(data.clientAddress.country, LEFT, y);                        y += 13;
    } else {
      doc.fillColor(GRAY).font('Helvetica').fontSize(9)
         .text(data.clientEmail, LEFT, y);
      y += 14;
    }

    // ── Items table ────────────────────────────────────────────────
    y += 16;
    hLine(doc, y, BORDER, 1.5);
    y += 1;

    const COL = {
      desc:  { x: LEFT,       w: 255 },
      qty:   { x: LEFT + 260, w: 60  },
      unit:  { x: LEFT + 325, w: 85  },
      total: { x: LEFT + 415, w: RIGHT - LEFT - 415 },
    };

    // Table header
    doc.fillColor(MID).font('Helvetica-Bold').fontSize(9);
    doc.text('Description',  COL.desc.x,  y + 7, { width: COL.desc.w  });
    doc.text('Quantity',     COL.qty.x,   y + 7, { width: COL.qty.w,  align: 'right' });
    doc.text('Unit Price',   COL.unit.x,  y + 7, { width: COL.unit.w, align: 'right' });
    doc.text('Total',        COL.total.x, y + 7, { width: COL.total.w, align: 'right' });
    y += 26;
    hLine(doc, y, BORDER, 1.5);
    y += 1;

    // Item rows
    const ROW_H = 26;
    data.items.forEach((item) => {
      doc.fillColor(DARK).font('Helvetica').fontSize(9);
      doc.text(item.description,         COL.desc.x,  y + 7, { width: COL.desc.w  });
      doc.text(String(item.quantity),    COL.qty.x,   y + 7, { width: COL.qty.w,  align: 'right' });
      doc.text(gbp(item.unitPrice),      COL.unit.x,  y + 7, { width: COL.unit.w, align: 'right' });
      doc.font('Helvetica-Bold')
         .text(gbp(item.total),          COL.total.x, y + 7, { width: COL.total.w, align: 'right' });
      y += ROW_H;
      hLine(doc, y, BORDER_L, 0.5);
    });

    // ── Totals (right-aligned, matches app) ────────────────────────
    y += 10;
    const totX = LEFT + 295;
    const totW = RIGHT - totX;

    doc.fillColor(GRAY).font('Helvetica').fontSize(9)
       .text('Subtotal:', totX, y, { width: 90 });
    doc.fillColor(DARK).font('Helvetica').fontSize(9)
       .text(gbp(data.subtotal), totX + 90, y, { width: totW - 90, align: 'right' });
    y += 18;

    hLine(doc, y, BORDER, 1.5);
    y += 8;

    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(11)
       .text('Total:', totX, y, { width: 90 });
    doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(11)
       .text(gbp(data.total), totX + 90, y, { width: totW - 90, align: 'right' });
    y += 26;

    // ── Notes ──────────────────────────────────────────────────────
    if (data.notes) {
      y += 4;
      const notesLines = Math.ceil(data.notes.length / 90) + 1;
      const notesH = 16 + notesLines * 13 + 12;
      doc.rect(LEFT, y, CONTENT_W, notesH).fill(BOX_BG);
      doc.fillColor(MID).font('Helvetica-Bold').fontSize(9)
         .text('Notes:', LEFT + 10, y + 10);
      doc.fillColor(DARK).font('Helvetica').fontSize(9)
         .text(data.notes, LEFT + 10, y + 23, { width: CONTENT_W - 20 });
      y += notesH + 12;
    }

    // ── Payment details box ────────────────────────────────────────
    y += 4;
    const payH = 100;
    doc.rect(LEFT, y, CONTENT_W, payH).fill(BOX_BG);
    doc.rect(LEFT, y, CONTENT_W, payH).strokeColor(BORDER_L).lineWidth(0.5).stroke();

    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(10)
       .text('Payment Details', LEFT + 12, y + 12);
    doc.fillColor(GRAY).font('Helvetica').fontSize(8.5)
       .text('Please make all payments to:', LEFT + 12, y + 28);
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(9)
       .text(COMPANY.name, LEFT + 12, y + 42);
    doc.font('Helvetica').fontSize(9)
       .text(`Account Number: ${COMPANY.bankAccount}`, LEFT + 12, y + 55)
       .text(`Sort Code: ${COMPANY.sortCode}`, LEFT + 12, y + 68);

    doc.rect(LEFT + 10, y + 80, CONTENT_W - 20, 14).fill(AMBER_BG);
    doc.fillColor(AMBER).font('Helvetica-Bold').fontSize(8.5)
       .text(
         `Payment Reference: ${data.invoiceNumber}  —  please use this as your reference`,
         LEFT + 14, y + 83, { width: CONTENT_W - 28 },
       );
    y += payH;

    doc.fillColor(MUTED).font('Helvetica').fontSize(8)
       .text(`Payment due by ${fmtDate(data.dueDate)}`, LEFT + 12, y + 6);
    y += 22;

    // ── Footer ────────────────────────────────────────────────────
    y += 12;
    hLine(doc, y, BORDER, 1.5);
    y += 12;

    doc.fillColor(GRAY).font('Helvetica').fontSize(9)
       .text('Thank you for your business!', LEFT, y, { width: CONTENT_W, align: 'center' });
    y += 18;

    hLine(doc, y, BORDER_L, 0.5);
    y += 10;

    // 4-column footer grid
    const fc = CONTENT_W / 4;
    const labels = ['Email', 'Phone', 'Website', 'Company No'];
    const values = [COMPANY.email, COMPANY.phone, COMPANY.website.replace('https://', ''), COMPANY.companyNumber];

    labels.forEach((lbl, i) => {
      const fx = LEFT + i * fc;
      doc.fillColor(MID).font('Helvetica-Bold').fontSize(8)
         .text(lbl, fx, y, { width: fc, align: 'center' });
      doc.fillColor(GRAY).font('Helvetica').fontSize(7.5)
         .text(values[i], fx, y + 12, { width: fc, align: 'center' });
    });

    doc.end();
  });
}

// ─── Receipt PDF ──────────────────────────────────────────────────────────────

export function generateReceiptPdf(data: ReceiptEmailData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: LEFT });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    let y = 45;

    // ── Logo + heading ─────────────────────────────────────────────
    if (LOGO_BUFFER) {
      doc.image(LOGO_BUFFER, LEFT, y, { fit: [160, 65] });
      y += 72;
    }

    doc.fillColor('#15803d').font('Helvetica-Bold').fontSize(26)
       .text('PAYMENT RECEIPT', LEFT, y);
    y += 32;

    doc.fillColor(GRAY).font('Helvetica').fontSize(8.5)
       .text(COMPANY.name, LEFT, y);
    y += 14;

    // ── Receipt meta (right) ───────────────────────────────────────
    const metaX = 355;
    const metaW = RIGHT - metaX;
    doc.fillColor(MUTED).font('Helvetica').fontSize(8)
       .text('Receipt Number', metaX, 45, { width: metaW });
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(13)
       .text(data.receiptNumber, metaX, 57, { width: metaW });

    // ── Divider ────────────────────────────────────────────────────
    y = Math.max(y, 80) + 14;
    hLine(doc, y, BORDER, 1.5);
    y += 16;

    // ── Amount paid hero ───────────────────────────────────────────
    doc.rect(LEFT, y, CONTENT_W, 86).fill('#f0fdf4');
    doc.rect(LEFT, y, CONTENT_W, 86).strokeColor('#bbf7d0').lineWidth(1.5).stroke();

    doc.fillColor('#16a34a').font('Helvetica-Bold').fontSize(8.5)
       .text('PAYMENT CONFIRMED', LEFT, y + 14, { width: CONTENT_W, align: 'center', characterSpacing: 2 });
    doc.fillColor('#15803d').font('Helvetica-Bold').fontSize(34)
       .text(gbp(data.amount), LEFT, y + 28, { width: CONTENT_W, align: 'center' });
    doc.fillColor(GRAY).font('Helvetica').fontSize(9)
       .text(`Receipt ${data.receiptNumber}`, LEFT, y + 68, { width: CONTENT_W, align: 'center' });
    y += 86 + 20;

    // ── Details rows ───────────────────────────────────────────────
    const detRows: [string, string][] = [
      ['Client',            data.clientName],
      ['Invoice Reference', data.invoiceNumber],
      ['Payment Method',    data.paymentMethod],
      ['Payment Date',      fmtDate(data.paymentDate)],
    ];

    hLine(doc, y, BORDER, 1.5);
    y += 1;

    detRows.forEach(([label, value]) => {
      doc.fillColor(MID).font('Helvetica-Bold').fontSize(8.5)
         .text(label, LEFT, y + 7, { width: 160 });
      doc.fillColor(DARK).font('Helvetica').fontSize(9.5)
         .text(value, LEFT + 165, y + 7, { width: CONTENT_W - 165 });
      y += 28;
      hLine(doc, y, BORDER_L, 0.5);
    });

    // ── Notes ──────────────────────────────────────────────────────
    if (data.notes) {
      y += 12;
      doc.fillColor(MID).font('Helvetica-Bold').fontSize(9)
         .text('Notes:', LEFT, y);
      y += 14;
      doc.fillColor(DARK).font('Helvetica').fontSize(9)
         .text(data.notes, LEFT, y, { width: CONTENT_W });
      y += 40;
    }

    // ── Thank you ──────────────────────────────────────────────────
    y += 20;
    doc.fillColor('#15803d').font('Helvetica-Bold').fontSize(13)
       .text('Thank you for your payment.', LEFT, y, { width: CONTENT_W, align: 'center' });
    y += 18;
    doc.fillColor(GRAY).font('Helvetica').fontSize(9)
       .text('Please retain this receipt for your records.', LEFT, y, { width: CONTENT_W, align: 'center' });
    y += 28;

    // ── Footer ────────────────────────────────────────────────────
    hLine(doc, y, BORDER, 1.5);
    y += 12;

    const fc = CONTENT_W / 4;
    const labels = ['Email', 'Phone', 'Website', 'Company No'];
    const values = [COMPANY.email, COMPANY.phone, COMPANY.website.replace('https://', ''), COMPANY.companyNumber];

    labels.forEach((lbl, i) => {
      const fx = LEFT + i * fc;
      doc.fillColor(MID).font('Helvetica-Bold').fontSize(8)
         .text(lbl, fx, y, { width: fc, align: 'center' });
      doc.fillColor(GRAY).font('Helvetica').fontSize(7.5)
         .text(values[i], fx, y + 12, { width: fc, align: 'center' });
    });

    doc.end();
  });
}
