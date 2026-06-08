import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import { sendInvoiceEmail, sendReceiptEmail, testEmailConnection } from './email.js';

export const app = express();
app.use(cors());
app.use(express.json());

// Wraps async route handlers so unhandled errors reach the global error handler
// instead of leaving the request hanging and causing a Vercel 504.
const wrap = (fn: (req: any, res: any) => Promise<any>) =>
  (req: any, res: any, next: any) => fn(req, res).catch(next);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dbToClient(row: any) {
  const client: any = {
    id: row.id,
    name: row.name,
    companyName: row.company_name || undefined,
    email: row.email,
    phone: row.phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (row.has_address && row.address_line1) {
    client.address = {
      line1: row.address_line1,
      line2: row.address_line2 || undefined,
      city: row.city,
      postcode: row.postcode,
      country: row.country,
    };
  }
  return client;
}

function dbToInvoice(row: any) {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    clientId: row.client_id,
    type: row.type,
    status: row.status,
    items: row.items || [],
    subtotal: parseFloat(row.subtotal),
    total: parseFloat(row.total),
    issueDate: row.issue_date ? new Date(row.issue_date).toISOString().split('T')[0] : '',
    dueDate: row.due_date ? new Date(row.due_date).toISOString().split('T')[0] : '',
    paidDate: row.paid_date || undefined,
    notes: row.notes || undefined,
    requiresUpfrontPayment: row.requires_upfront_payment,
    upfrontPaymentAmount: row.upfront_payment_amount ? parseFloat(row.upfront_payment_amount) : undefined,
    upfrontPaymentPaid: row.upfront_payment_paid,
    upfrontPaymentDate: row.upfront_payment_date || undefined,
    recurringInvoiceId: row.recurring_invoice_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function dbToReceipt(row: any) {
  return {
    id: row.id,
    receiptNumber: row.receipt_number,
    invoiceId: row.invoice_id,
    amount: parseFloat(row.amount),
    paymentMethod: row.payment_method,
    paymentDate: row.payment_date ? new Date(row.payment_date).toISOString().split('T')[0] : '',
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function dbToRecurring(row: any) {
  return {
    id: row.id,
    clientId: row.client_id,
    type: row.type,
    items: row.items || [],
    amount: parseFloat(row.amount),
    dayOfMonth: row.day_of_month,
    isActive: row.is_active,
    startDate: row.start_date ? new Date(row.start_date).toISOString().split('T')[0] : '',
    endDate: row.end_date ? new Date(row.end_date).toISOString().split('T')[0] : undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function nextInvoiceNumber(): Promise<string> {
  const { rows } = await pool.query("SELECT 'INV-' || nextval('invoice_number_seq') AS num");
  return rows[0].num;
}

async function nextReceiptNumber(): Promise<string> {
  const { rows } = await pool.query("SELECT 'REC-' || nextval('receipt_number_seq') AS num");
  return rows[0].num;
}

// ─── CLIENTS ─────────────────────────────────────────────────────────────────

app.get('/api/clients', wrap(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM clients ORDER BY created_at DESC');
  res.json(rows.map(dbToClient));
}));

app.post('/api/clients', wrap(async (req, res) => {
  const { name, companyName, email, phone, address } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO clients (name, company_name, email, phone, has_address, address_line1, address_line2, city, postcode, country)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [name, companyName || null, email, phone, !!address,
     address?.line1 || null, address?.line2 || null, address?.city || null,
     address?.postcode || null, address?.country || null]
  );
  res.json(dbToClient(rows[0]));
}));

app.put('/api/clients/:id', wrap(async (req, res) => {
  const { name, companyName, email, phone, address } = req.body;
  const { rows } = await pool.query(
    `UPDATE clients SET name=$1, company_name=$2, email=$3, phone=$4, has_address=$5,
     address_line1=$6, address_line2=$7, city=$8, postcode=$9, country=$10, updated_at=NOW()
     WHERE id=$11 RETURNING *`,
    [name, companyName || null, email, phone, !!address,
     address?.line1 || null, address?.line2 || null, address?.city || null,
     address?.postcode || null, address?.country || null, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Client not found' });
  res.json(dbToClient(rows[0]));
}));

app.delete('/api/clients/:id', wrap(async (req, res) => {
  await pool.query('DELETE FROM clients WHERE id=$1', [req.params.id]);
  res.json({ success: true });
}));

// ─── INVOICES ────────────────────────────────────────────────────────────────

app.get('/api/invoices', wrap(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM invoices ORDER BY created_at DESC');
  res.json(rows.map(dbToInvoice));
}));

app.post('/api/invoices', wrap(async (req, res) => {
  const { clientId, type, items = [], status = 'draft', issueDate, dueDate,
          notes, requiresUpfrontPayment = false, upfrontPaymentPaid = false,
          recurringInvoiceId } = req.body;

  const invoiceNumber = await nextInvoiceNumber();
  const subtotal = items.reduce((s: number, i: any) => s + i.total, 0);
  const upfrontAmount = requiresUpfrontPayment ? subtotal * 0.5 : null;
  const upfrontPaid = requiresUpfrontPayment && upfrontPaymentPaid;

  const { rows } = await pool.query(
    `INSERT INTO invoices
       (invoice_number, client_id, type, status, items, subtotal, total,
        issue_date, due_date, notes, requires_upfront_payment,
        upfront_payment_amount, upfront_payment_paid, upfront_payment_date,
        recurring_invoice_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    [invoiceNumber, clientId, type, status, JSON.stringify(items),
     subtotal, subtotal, issueDate, dueDate, notes || null,
     requiresUpfrontPayment, upfrontAmount,
     upfrontPaid, upfrontPaid ? new Date().toISOString() : null,
     recurringInvoiceId || null]
  );
  const newInvoice = dbToInvoice(rows[0]);
  res.json(newInvoice);

  // Fire-and-forget: email invoice to client
  pool.query('SELECT * FROM clients WHERE id=$1', [newInvoice.clientId])
    .then(({ rows: cRows }) => {
      if (cRows.length && cRows[0].email) {
        return sendInvoiceEmail({
          invoiceNumber: newInvoice.invoiceNumber,
          clientName: cRows[0].name,
          clientEmail: cRows[0].email,
          issueDate: newInvoice.issueDate,
          dueDate: newInvoice.dueDate,
          items: newInvoice.items,
          subtotal: newInvoice.subtotal,
          total: newInvoice.total,
          notes: newInvoice.notes,
        });
      }
    })
    .catch((err) => console.warn('[email] Auto invoice email failed:', err));
}));

app.put('/api/invoices/:id', wrap(async (req, res) => {
  const { clientId, type, items, status, issueDate, dueDate, notes, requiresUpfrontPayment } = req.body;
  const subtotal = items ? items.reduce((s: number, i: any) => s + i.total, 0) : null;
  const { rows } = await pool.query(
    `UPDATE invoices SET
       client_id=COALESCE($1,client_id), type=COALESCE($2,type),
       items=COALESCE($3,items), status=COALESCE($4,status),
       subtotal=COALESCE($5,subtotal), total=COALESCE($5,total),
       issue_date=COALESCE($6,issue_date), due_date=COALESCE($7,due_date),
       notes=$8,
       requires_upfront_payment=COALESCE($9,requires_upfront_payment),
       updated_at=NOW()
     WHERE id=$10 RETURNING *`,
    [clientId||null, type||null, items ? JSON.stringify(items) : null,
     status||null, subtotal, issueDate||null, dueDate||null,
     notes||null, requiresUpfrontPayment??null, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Invoice not found' });
  res.json(dbToInvoice(rows[0]));
}));

app.patch('/api/invoices/:id/status', wrap(async (req, res) => {
  const { status } = req.body;
  const setPaidDate = status === 'paid' ? ', paid_date=NOW()' : '';
  const { rows } = await pool.query(
    `UPDATE invoices SET status=$1${setPaidDate}, updated_at=NOW() WHERE id=$2 RETURNING *`,
    [status, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Invoice not found' });
  const invoice = dbToInvoice(rows[0]);

  if (status === 'paid') {
    const existing = await pool.query('SELECT id FROM receipts WHERE invoice_id=$1', [req.params.id]);
    if (!existing.rows.length) {
      const receiptNumber = invoice.invoiceNumber.replace('INV-', 'REC-');
      await pool.query(
        `INSERT INTO receipts (receipt_number, invoice_id, amount, payment_method, payment_date, notes)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [receiptNumber, req.params.id, invoice.total, 'Bank Transfer',
         new Date().toISOString().split('T')[0],
         `Payment received for invoice ${invoice.invoiceNumber}`]
      );
      // Fire-and-forget: email auto-generated receipt to client
      pool.query('SELECT * FROM clients WHERE id=$1', [invoice.clientId])
        .then(({ rows: cRows }) => {
          if (cRows.length && cRows[0].email) {
            return sendReceiptEmail({
              receiptNumber,
              invoiceNumber: invoice.invoiceNumber,
              clientName: cRows[0].name,
              clientEmail: cRows[0].email,
              amount: invoice.total,
              paymentMethod: 'Bank Transfer',
              paymentDate: new Date().toISOString().split('T')[0],
              notes: `Payment received for invoice ${invoice.invoiceNumber}`,
            });
          }
        })
        .catch((err) => console.warn('[email] Auto receipt email failed:', err));
    }
  }
  res.json(invoice);
}));

app.patch('/api/invoices/:id/upfront-payment', wrap(async (req, res) => {
  const { paid } = req.body;
  const { rows } = await pool.query(
    `UPDATE invoices SET upfront_payment_paid=$1,
     upfront_payment_date=CASE WHEN $1 THEN NOW() ELSE NULL END,
     updated_at=NOW() WHERE id=$2 RETURNING *`,
    [paid, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Invoice not found' });
  res.json(dbToInvoice(rows[0]));
}));

app.delete('/api/invoices/:id', wrap(async (req, res) => {
  await pool.query('DELETE FROM invoices WHERE id=$1', [req.params.id]);
  res.json({ success: true });
}));

app.post('/api/invoices/:id/send-email', wrap(async (req, res) => {
  try {
    const { rows: invRows } = await pool.query('SELECT * FROM invoices WHERE id=$1', [req.params.id]);
    if (!invRows.length) return res.status(404).json({ error: 'Invoice not found' });
    const { rows: clientRows } = await pool.query('SELECT * FROM clients WHERE id=$1', [invRows[0].client_id]);
    if (!clientRows.length) return res.status(404).json({ error: 'Client not found' });
    const invoice = dbToInvoice(invRows[0]);
    const client = dbToClient(clientRows[0]);
    if (!client.email) return res.status(400).json({ error: 'Client has no email address' });
    const info = await sendInvoiceEmail({
      invoiceNumber: invoice.invoiceNumber,
      clientName: client.name,
      clientEmail: client.email,
      clientCompanyName: client.companyName,
      clientAddress: client.address,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      items: invoice.items,
      subtotal: invoice.subtotal,
      total: invoice.total,
      notes: invoice.notes,
    });
    res.json({
      success: true,
      message: `Invoice emailed to ${client.email}`,
      accepted: info.accepted,
      rejected: info.rejected,
      messageId: info.messageId,
    });
  } catch (err: any) {
    console.error('Failed to send invoice email:', err);
    res.status(500).json({ error: err.message || 'Failed to send email' });
  }
}));

// ─── RECEIPTS ────────────────────────────────────────────────────────────────

app.get('/api/receipts', wrap(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM receipts ORDER BY created_at DESC');
  res.json(rows.map(dbToReceipt));
}));

app.post('/api/receipts', wrap(async (req, res) => {
  const { invoiceId, amount, paymentMethod, paymentDate, notes } = req.body;
  const { rows: invLookup } = await pool.query('SELECT invoice_number FROM invoices WHERE id=$1', [invoiceId]);
  if (!invLookup.length) return res.status(404).json({ error: 'Invoice not found' });
  const receiptNumber = invLookup[0].invoice_number.replace('INV-', 'REC-');
  const { rows } = await pool.query(
    `INSERT INTO receipts (receipt_number, invoice_id, amount, payment_method, payment_date, notes)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [receiptNumber, invoiceId, amount, paymentMethod, paymentDate, notes || null]
  );
  await pool.query(
    `UPDATE invoices SET status='paid', paid_date=NOW(), updated_at=NOW() WHERE id=$1`,
    [invoiceId]
  );
  const newReceipt = dbToReceipt(rows[0]);
  res.json(newReceipt);

  // Fire-and-forget: email receipt to client
  pool.query('SELECT * FROM invoices WHERE id=$1', [invoiceId])
    .then(async ({ rows: invRows }) => {
      if (!invRows.length) return;
      const inv = dbToInvoice(invRows[0]);
      const { rows: cRows } = await pool.query('SELECT * FROM clients WHERE id=$1', [invRows[0].client_id]);
      if (cRows.length && cRows[0].email) {
        await sendReceiptEmail({
          receiptNumber: newReceipt.receiptNumber,
          invoiceNumber: inv.invoiceNumber,
          clientName: cRows[0].name,
          clientEmail: cRows[0].email,
          amount: newReceipt.amount,
          paymentMethod: newReceipt.paymentMethod,
          paymentDate: newReceipt.paymentDate,
          notes: newReceipt.notes,
        });
      }
    })
    .catch((err) => console.warn('[email] Auto receipt email failed:', err));
}));

app.delete('/api/receipts/:id', wrap(async (req, res) => {
  await pool.query('DELETE FROM receipts WHERE id=$1', [req.params.id]);
  res.json({ success: true });
}));

app.post('/api/receipts/:id/send-email', wrap(async (req, res) => {
  try {
    const { rows: recRows } = await pool.query('SELECT * FROM receipts WHERE id=$1', [req.params.id]);
    if (!recRows.length) return res.status(404).json({ error: 'Receipt not found' });
    const { rows: invRows } = await pool.query('SELECT * FROM invoices WHERE id=$1', [recRows[0].invoice_id]);
    if (!invRows.length) return res.status(404).json({ error: 'Invoice not found' });
    const { rows: clientRows } = await pool.query('SELECT * FROM clients WHERE id=$1', [invRows[0].client_id]);
    if (!clientRows.length) return res.status(404).json({ error: 'Client not found' });
    const receipt = dbToReceipt(recRows[0]);
    const invoice = dbToInvoice(invRows[0]);
    const client = dbToClient(clientRows[0]);
    if (!client.email) return res.status(400).json({ error: 'Client has no email address' });
    const info = await sendReceiptEmail({
      receiptNumber: receipt.receiptNumber,
      invoiceNumber: invoice.invoiceNumber,
      clientName: client.name,
      clientEmail: client.email,
      amount: receipt.amount,
      paymentMethod: receipt.paymentMethod,
      paymentDate: receipt.paymentDate,
      notes: receipt.notes,
    });
    res.json({
      success: true,
      message: `Receipt emailed to ${client.email}`,
      accepted: info.accepted,
      rejected: info.rejected,
      messageId: info.messageId,
    });
  } catch (err: any) {
    console.error('Failed to send receipt email:', err);
    res.status(500).json({ error: err.message || 'Failed to send email' });
  }
}));

app.get('/api/email/test', wrap(async (_req, res) => {
  const result = await testEmailConnection();
  res.status(result.ok ? 200 : 500).json(result);
}));

// ─── RECURRING INVOICES ──────────────────────────────────────────────────────

app.get('/api/recurring-invoices', wrap(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM recurring_invoices ORDER BY created_at DESC');
  res.json(rows.map(dbToRecurring));
}));

app.post('/api/recurring-invoices', wrap(async (req, res) => {
  const { clientId, type, items = [], amount = 0, dayOfMonth = 1,
          isActive = true, startDate, endDate, notes } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO recurring_invoices (client_id, type, items, amount, day_of_month, is_active, start_date, end_date, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [clientId, type, JSON.stringify(items), amount, dayOfMonth, isActive,
     startDate, endDate || null, notes || null]
  );
  res.json(dbToRecurring(rows[0]));
}));

app.put('/api/recurring-invoices/:id', wrap(async (req, res) => {
  const { clientId, type, items, amount, dayOfMonth, isActive, startDate, endDate, notes } = req.body;
  const { rows } = await pool.query(
    `UPDATE recurring_invoices SET
       client_id=COALESCE($1,client_id), type=COALESCE($2,type),
       items=COALESCE($3,items), amount=COALESCE($4,amount),
       day_of_month=COALESCE($5,day_of_month), is_active=COALESCE($6,is_active),
       start_date=COALESCE($7,start_date), end_date=$8, notes=$9,
       updated_at=NOW()
     WHERE id=$10 RETURNING *`,
    [clientId||null, type||null, items ? JSON.stringify(items) : null,
     amount??null, dayOfMonth||null, isActive??null,
     startDate||null, endDate||null, notes||null, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(dbToRecurring(rows[0]));
}));

app.delete('/api/recurring-invoices/:id', wrap(async (req, res) => {
  await pool.query('DELETE FROM recurring_invoices WHERE id=$1', [req.params.id]);
  res.json({ success: true });
}));

app.post('/api/recurring-invoices/:id/generate', wrap(async (req, res) => {
  const { issueDate } = req.body;
  const { rows: rRows } = await pool.query(
    'SELECT * FROM recurring_invoices WHERE id=$1', [req.params.id]
  );
  if (!rRows.length || !rRows[0].is_active) {
    return res.status(400).json({ error: 'Recurring invoice not found or inactive' });
  }
  const recurring = dbToRecurring(rRows[0]);
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + 30);
  const invoiceNumber = await nextInvoiceNumber();
  const subtotal = recurring.items.reduce((s: number, i: any) => s + i.total, 0);

  const { rows } = await pool.query(
    `INSERT INTO invoices
       (invoice_number, client_id, type, status, items, subtotal, total,
        issue_date, due_date, notes, requires_upfront_payment,
        upfront_payment_paid, recurring_invoice_id)
     VALUES ($1,$2,$3,'sent',$4,$5,$5,$6,$7,$8,false,false,$9) RETURNING *`,
    [invoiceNumber, recurring.clientId, recurring.type,
     JSON.stringify(recurring.items), subtotal,
     issueDate, dueDate.toISOString().split('T')[0],
     recurring.notes || null, req.params.id]
  );
  res.json(dbToInvoice(rows[0]));
}));

// ─── Global error handler ─────────────────────────────────────────────────────
// Catches any unhandled async error in a route so the request never hangs.
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('[server error]', err);
  if (!res.headersSent) {
    res.status(500).json({ error: err?.message || 'Internal server error' });
  }
});
