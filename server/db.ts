import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  connectionTimeoutMillis: 8000,
  idleTimeoutMillis: 10000,
  allowExitOnIdle: true,
});

export async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 15001;
      CREATE SEQUENCE IF NOT EXISTS receipt_number_seq START 15001;

      CREATE TABLE IF NOT EXISTS clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        company_name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(100),
        has_address BOOLEAN DEFAULT false,
        address_line1 VARCHAR(255),
        address_line2 VARCHAR(255),
        city VARCHAR(255),
        postcode VARCHAR(50),
        country VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
        type VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        items JSONB NOT NULL DEFAULT '[]',
        subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
        total DECIMAL(10,2) NOT NULL DEFAULT 0,
        issue_date DATE NOT NULL,
        due_date DATE NOT NULL,
        paid_date TIMESTAMPTZ,
        notes TEXT,
        requires_upfront_payment BOOLEAN DEFAULT false,
        upfront_payment_amount DECIMAL(10,2),
        upfront_payment_paid BOOLEAN DEFAULT false,
        upfront_payment_date TIMESTAMPTZ,
        recurring_invoice_id UUID,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS receipts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        receipt_number VARCHAR(50) UNIQUE NOT NULL,
        invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(100) NOT NULL,
        payment_date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS recurring_invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
        type VARCHAR(100) NOT NULL,
        items JSONB NOT NULL DEFAULT '[]',
        amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        day_of_month INTEGER NOT NULL DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        start_date DATE NOT NULL,
        end_date DATE,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Database schema ready');
  } finally {
    client.release();
  }
}
