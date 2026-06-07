import 'dotenv/config';
import dns from 'dns/promises';
import { testEmailConnection, sendInvoiceEmail } from './email.js';

// Usage: npx tsx server/test-email.ts [target@email.com]
const targetEmail = process.argv[2] || process.env.SMTP_FROM!;
const targetDomain = targetEmail.split('@')[1];

async function checkMx(domain: string): Promise<void> {
  console.log(`\n=== MX Record Check: ${domain} ===`);
  try {
    const records = await dns.resolveMx(domain);
    if (records.length === 0) {
      console.log(`❌  No MX records found for ${domain}`);
      console.log('   → This domain has no email hosting. Emails sent here will be dropped.');
    } else {
      records.sort((a, b) => a.priority - b.priority);
      records.forEach(r => console.log(`✅  MX ${r.priority} → ${r.exchange}`));
    }
  } catch (err: any) {
    console.log(`❌  DNS lookup failed for ${domain}: ${err.message}`);
    console.log('   → Domain may not exist or has no email configured.');
  }
}

async function run() {
  console.log(`\nTarget email: ${targetEmail}`);

  // 1. Check MX records for target domain
  await checkMx(targetDomain);

  // 2. SMTP connection test
  console.log('\n=== SMTP Connection Test ===');
  const conn = await testEmailConnection();
  console.log(conn.ok ? '✅ ' + conn.detail : '❌ ' + conn.detail);

  if (!conn.ok) {
    console.log('\nFix the connection issue before sending emails.');
    process.exit(1);
  }

  // 3. Send test invoice email to target
  console.log(`\n=== Sending Test Invoice Email → ${targetEmail} ===`);
  try {
    const info = await sendInvoiceEmail({
      invoiceNumber: 'TEST-001',
      clientName: 'Test Client',
      clientEmail: targetEmail,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      items: [{ description: 'Test service', quantity: 1, unitPrice: 100, total: 100 }],
      subtotal: 100,
      total: 100,
      notes: 'This is a test email — please ignore.',
    });
    if (info.rejected && info.rejected.length > 0) {
      console.log('❌ SMTP rejected delivery to:', info.rejected);
      console.log('   → The SMTP server explicitly refused to send to this address.');
    } else {
      console.log('✅ SMTP accepted the email');
      console.log('   messageId:', info.messageId);
      console.log('   accepted: ', info.accepted);
      console.log('   response: ', (info as any).response || '(none)');
      console.log('\n   ℹ️  "Accepted" means the SMTP server received the message.');
      console.log('   If it still does not arrive, the issue is downstream delivery');
      console.log('   (spam filter, invalid recipient domain, or relay restriction).');
    }
  } catch (err: any) {
    console.error('❌ Send threw an error:', err.message);
  }
}

run();
