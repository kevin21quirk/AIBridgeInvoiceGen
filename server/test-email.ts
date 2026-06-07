import 'dotenv/config';
import { testEmailConnection, sendInvoiceEmail } from './email.js';

async function run() {
  console.log('\n=== SMTP Connection Test ===');
  const conn = await testEmailConnection();
  console.log(conn.ok ? '✅ ' + conn.detail : '❌ ' + conn.detail);

  if (!conn.ok) {
    console.log('\nFix the connection issue before sending emails.');
    process.exit(1);
  }

  console.log('\n=== Sending Test Invoice Email ===');
  try {
    const info = await sendInvoiceEmail({
      invoiceNumber: 'TEST-001',
      clientName: 'Test Client',
      clientEmail: process.env.SMTP_FROM!,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      items: [{ description: 'Test service', quantity: 1, unitPrice: 100, total: 100 }],
      subtotal: 100,
      total: 100,
      notes: 'This is a test email — please ignore.',
    });
    console.log('✅ Test email sent to', process.env.SMTP_FROM);
    console.log('   messageId:', info.messageId);
    console.log('   accepted: ', info.accepted);
    console.log('   rejected: ', info.rejected);
  } catch (err: any) {
    console.error('❌ Send failed:', err.message);
  }
}

run();
