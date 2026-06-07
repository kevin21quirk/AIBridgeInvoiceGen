import PDFDocument from 'pdfkit';

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
const LEFT = 50;
const CONTENT_W = PAGE_W - LEFT * 2;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function gbp(n: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);
}

function fmtDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return d;
  }
}

function clip(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

// ─── Shared data types ────────────────────────────────────────────────────────

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

// ─── Invoice PDF ──────────────────────────────────────────────────────────────

export function generateInvoicePdf(data: InvoiceEmailData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: LEFT });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── Blue header ───────────────────────────────────────────────
    doc.rect(0, 0, PAGE_W, 100).fill('#1e40af');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(30)
       .text('INVOICE', LEFT, 28, { width: CONTENT_W, align: 'right' });
    doc.fillColor('#bfdbfe').font('Helvetica').fontSize(9.5)
       .text(COMPANY.name, LEFT, 68, { width: CONTENT_W, align: 'right' });

    // ── From / Company info ───────────────────────────────────────
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(11)
       .text(COMPANY.name, LEFT, 120);
    doc.font('Helvetica').fillColor('#6b7280').fontSize(9)
       .text(COMPANY.address.line1, LEFT, 136)
       .text(COMPANY.address.line2, LEFT, 148)
       .text(`${COMPANY.address.city}, ${COMPANY.address.postcode}`, LEFT, 160)
       .text(COMPANY.address.country, LEFT, 172)
       .text(COMPANY.email, LEFT, 188)
       .text(`Company No: ${COMPANY.companyNumber}`, LEFT, 200);

    // ── Invoice meta (right column) ───────────────────────────────
    const metaLabelX = LEFT + 265;
    const metaLabelW = CONTENT_W - 265;
    doc.fillColor('#9ca3af').font('Helvetica').fontSize(8.5)
       .text('Invoice Number', metaLabelX, 120, { width: metaLabelW });
    doc.fillColor('#1e40af').font('Helvetica-Bold').fontSize(14)
       .text(data.invoiceNumber, metaLabelX, 132, { width: metaLabelW, align: 'right' });

    doc.fillColor('#9ca3af').font('Helvetica').fontSize(8.5)
       .text('Issue Date', metaLabelX, 158, { width: metaLabelW });
    doc.fillColor('#111827').font('Helvetica').fontSize(9.5)
       .text(fmtDate(data.issueDate), metaLabelX, 170, { width: metaLabelW, align: 'right' });

    doc.fillColor('#9ca3af').font('Helvetica').fontSize(8.5)
       .text('Due Date', metaLabelX, 188, { width: metaLabelW });
    doc.fillColor('#dc2626').font('Helvetica-Bold').fontSize(9.5)
       .text(fmtDate(data.dueDate), metaLabelX, 200, { width: metaLabelW, align: 'right' });

    // ── Bill To ───────────────────────────────────────────────────
    doc.rect(LEFT, 222, CONTENT_W, 56).fill('#f8fafc');
    doc.fillColor('#9ca3af').font('Helvetica').fontSize(8)
       .text('BILL TO', LEFT + 10, 230, { characterSpacing: 1.2 });
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(12)
       .text(clip(data.clientName, 50), LEFT + 10, 242);
    doc.fillColor('#6b7280').font('Helvetica').fontSize(9)
       .text(data.clientEmail, LEFT + 10, 258);

    // ── Items table ───────────────────────────────────────────────
    let y = 296;

    const COL = {
      desc:  { x: LEFT + 8,   w: 242 },
      qty:   { x: LEFT + 258, w: 50  },
      unit:  { x: LEFT + 318, w: 80  },
      total: { x: LEFT + 408, w: CONTENT_W - 408 },
    };
    const ROW_H = 27;

    // Header row
    doc.rect(LEFT, y, CONTENT_W, 27).fill('#1e40af');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5);
    doc.text('DESCRIPTION', COL.desc.x, y + 9);
    doc.text('QTY', COL.qty.x, y + 9, { width: COL.qty.w, align: 'center' });
    doc.text('UNIT PRICE', COL.unit.x, y + 9, { width: COL.unit.w, align: 'right' });
    doc.text('TOTAL', COL.total.x, y + 9, { width: COL.total.w, align: 'right' });
    y += 27;

    // Item rows
    data.items.forEach((item, i) => {
      if (i % 2 === 1) doc.rect(LEFT, y, CONTENT_W, ROW_H).fill('#f9fafb');
      doc.fillColor('#111827').font('Helvetica').fontSize(9);
      doc.text(clip(item.description, 44), COL.desc.x, y + 9);
      doc.text(String(item.quantity), COL.qty.x, y + 9, { width: COL.qty.w, align: 'center' });
      doc.text(gbp(item.unitPrice), COL.unit.x, y + 9, { width: COL.unit.w, align: 'right' });
      doc.font('Helvetica-Bold')
         .text(gbp(item.total), COL.total.x, y + 9, { width: COL.total.w, align: 'right' });
      y += ROW_H;
    });

    // Total row
    doc.rect(LEFT, y, CONTENT_W, 34).fill('#1e40af');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(13)
       .text('TOTAL DUE', COL.desc.x, y + 10);
    doc.text(gbp(data.total), COL.total.x, y + 10, { width: COL.total.w, align: 'right' });
    y += 34;

    // ── Payment details box ───────────────────────────────────────
    const payY = y + 20;
    doc.rect(LEFT, payY, CONTENT_W, 76).fill('#eff6ff');
    doc.fillColor('#1e40af').font('Helvetica-Bold').fontSize(10)
       .text('Payment Details', LEFT + 10, payY + 10);
    doc.fillColor('#111827').font('Helvetica').fontSize(9)
       .text(`Account Number: ${COMPANY.bankAccount}`, LEFT + 10, payY + 28)
       .text(`Sort Code: ${COMPANY.sortCode}`, LEFT + 10, payY + 42)
       .text(`Payment Reference: ${data.invoiceNumber}`, LEFT + 10, payY + 56);

    // ── Notes ─────────────────────────────────────────────────────
    if (data.notes) {
      const nY = payY + 94;
      doc.fillColor('#6b7280').font('Helvetica-Bold').fontSize(9)
         .text('Notes', LEFT, nY);
      doc.fillColor('#111827').font('Helvetica').fontSize(9)
         .text(data.notes, LEFT, nY + 14, { width: CONTENT_W });
    }

    // ── Footer ────────────────────────────────────────────────────
    doc.rect(0, 796, PAGE_W, 46).fill('#1e3a8a');
    doc.fillColor('#93c5fd').font('Helvetica').fontSize(8.5)
       .text(
         `${COMPANY.email}  |  ${COMPANY.phone}  |  ${COMPANY.website}`,
         LEFT, 808, { width: CONTENT_W, align: 'center' },
       );
    doc.fillColor('#60a5fa').fontSize(8)
       .text(`Company No: ${COMPANY.companyNumber}`, LEFT, 822, { width: CONTENT_W, align: 'center' });

    doc.end();
  });
}

// ─── Receipt PDF ──────────────────────────────────────────────────────────────

export function generateReceiptPdf(data: ReceiptEmailData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: LEFT });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── Green header ──────────────────────────────────────────────
    doc.rect(0, 0, PAGE_W, 100).fill('#15803d');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(25)
       .text('PAYMENT RECEIPT', LEFT, 28, { width: CONTENT_W, align: 'right' });
    doc.fillColor('#bbf7d0').font('Helvetica').fontSize(9.5)
       .text(COMPANY.name, LEFT, 68, { width: CONTENT_W, align: 'right' });

    // ── Company info ──────────────────────────────────────────────
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(10)
       .text(COMPANY.name, LEFT, 120);
    doc.font('Helvetica').fillColor('#6b7280').fontSize(9)
       .text(COMPANY.address.line1, LEFT, 134)
       .text(`${COMPANY.address.city}, ${COMPANY.address.postcode}`, LEFT, 146)
       .text(COMPANY.email, LEFT, 158);

    // ── Amount hero ───────────────────────────────────────────────
    const heroY = 185;
    doc.rect(LEFT, heroY, CONTENT_W, 90).fill('#f0fdf4');
    doc.rect(LEFT, heroY, CONTENT_W, 90).strokeColor('#bbf7d0').lineWidth(2).stroke();

    doc.fillColor('#16a34a').font('Helvetica-Bold').fontSize(8.5)
       .text('PAYMENT CONFIRMED', LEFT, heroY + 16, {
         width: CONTENT_W, align: 'center', characterSpacing: 2,
       });
    doc.fillColor('#15803d').font('Helvetica-Bold').fontSize(34)
       .text(gbp(data.amount), LEFT, heroY + 30, { width: CONTENT_W, align: 'center' });
    doc.fillColor('#6b7280').font('Helvetica').fontSize(9)
       .text(`Receipt ${data.receiptNumber}`, LEFT, heroY + 72, { width: CONTENT_W, align: 'center' });

    // ── Details table ─────────────────────────────────────────────
    const rows: [string, string][] = [
      ['Client',           data.clientName],
      ['Invoice Reference', data.invoiceNumber],
      ['Payment Method',   data.paymentMethod],
      ['Payment Date',     fmtDate(data.paymentDate)],
    ];

    let tY = heroY + 108;
    rows.forEach(([label, value], i) => {
      if (i % 2 === 1) doc.rect(LEFT, tY, CONTENT_W, 34).fill('#f9fafb');
      doc.fillColor('#9ca3af').font('Helvetica').fontSize(8)
         .text(label.toUpperCase(), LEFT + 12, tY + 6, { characterSpacing: 0.5 });
      doc.fillColor('#111827').font('Helvetica-Bold').fontSize(10.5)
         .text(clip(value, 60), LEFT + 12, tY + 18);
      tY += 34;
    });

    // ── Notes ─────────────────────────────────────────────────────
    if (data.notes) {
      const nY = tY + 20;
      doc.fillColor('#6b7280').font('Helvetica-Bold').fontSize(9)
         .text('Notes', LEFT, nY);
      doc.fillColor('#111827').font('Helvetica').fontSize(9)
         .text(data.notes, LEFT, nY + 14, { width: CONTENT_W });
      tY = nY + 50;
    }

    // ── Thank you ─────────────────────────────────────────────────
    const thankY = tY + 28;
    doc.fillColor('#16a34a').font('Helvetica-Bold').fontSize(13)
       .text('Thank you for your payment.', LEFT, thankY, { width: CONTENT_W, align: 'center' });
    doc.fillColor('#6b7280').font('Helvetica').fontSize(9)
       .text('Please retain this receipt for your records.', LEFT, thankY + 20, {
         width: CONTENT_W, align: 'center',
       });

    // ── Footer ────────────────────────────────────────────────────
    doc.rect(0, 796, PAGE_W, 46).fill('#14532d');
    doc.fillColor('#86efac').font('Helvetica').fontSize(8.5)
       .text(
         `${COMPANY.email}  |  ${COMPANY.phone}  |  ${COMPANY.website}`,
         LEFT, 808, { width: CONTENT_W, align: 'center' },
       );
    doc.fillColor('#4ade80').fontSize(8)
       .text(`Company No: ${COMPANY.companyNumber}`, LEFT, 822, { width: CONTENT_W, align: 'center' });

    doc.end();
  });
}
