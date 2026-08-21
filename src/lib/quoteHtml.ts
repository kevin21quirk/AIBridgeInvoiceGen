import { Quote } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { COMPANY_DETAILS } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function esc(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// CSS – injected into <head> for print/word, and into document.head for PDF
// ---------------------------------------------------------------------------
export const QUOTE_PDF_CSS = `
  /* Reset */
  * { margin: 0; padding: 0; box-sizing: border-box; }

  /* Page break rules – picked up by html2pdf.js css mode */
  p    { page-break-inside: avoid; break-inside: avoid; }
  li   { page-break-inside: avoid; break-inside: avoid; }
  tr   { page-break-inside: avoid; break-inside: avoid; }
  img  { page-break-inside: avoid; break-inside: avoid; }
  h1, h2, h3, h4 {
    page-break-inside: avoid; break-inside: avoid;
    page-break-after:  avoid; break-after:  avoid;
  }
  /* Containers flow freely – avoids big blank gaps */
  div, section, article { page-break-inside: auto; break-inside: auto; }
  table { page-break-inside: auto; break-inside: auto; }

  /* Rich-text output – description entered by user */
  .rte p  { margin: 0 0 6px 0; page-break-inside: avoid; break-inside: avoid; }
  .rte ul, .rte ol { padding-left: 22px; margin: 4px 0; }
  .rte li { margin: 1px 0; page-break-inside: avoid; break-inside: avoid; }
  .rte h1, .rte h2, .rte h3, .rte h4 {
    margin: 8px 0 4px 0;
    page-break-after: avoid; break-after: avoid;
    page-break-inside: avoid; break-inside: avoid;
  }
`;

// ---------------------------------------------------------------------------
// Full HTML document generator
// Used for: Print (new window) · Word download
// wordFormat = true adds MS Word XML namespaces to <html>
// ---------------------------------------------------------------------------
export function generateQuoteHtml(quote: Quote, wordFormat = false): string {
  const ns = wordFormat
    ? `xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'`
    : '';

  const logo = COMPANY_DETAILS.logo;
  const co = COMPANY_DETAILS;

  // --- Client block ---
  const clientHtml = [
    `<p style="font-weight:bold;margin:0 0 2px 0">${esc(quote.client?.name ?? '')}</p>`,
    quote.client?.companyName
      ? `<p style="font-size:9pt;color:#6b7280;margin:0 0 2px 0">${esc(quote.client.companyName)}</p>`
      : '',
    quote.client?.address
      ? [
          `<p style="font-size:9pt;margin:0 0 1px 0">${esc(quote.client.address.line1)}</p>`,
          quote.client.address.line2
            ? `<p style="font-size:9pt;margin:0 0 1px 0">${esc(quote.client.address.line2)}</p>`
            : '',
          `<p style="font-size:9pt;margin:0 0 1px 0">${esc(quote.client.address.city)}, ${esc(quote.client.address.postcode)}</p>`,
          `<p style="font-size:9pt;margin:0">${esc(quote.client.address.country)}</p>`,
        ].join('\n')
      : '',
  ].join('\n');

  // --- Items ---
  const itemRows = quote.items
    .map(
      (item) => `
    <tr>
      <td style="padding:7px 4px;font-size:9pt;border-bottom:1px solid #e5e7eb">${esc(item.description)}</td>
      <td style="padding:7px 4px;font-size:9pt;text-align:right;border-bottom:1px solid #e5e7eb">${item.quantity}</td>
      <td style="padding:7px 4px;font-size:9pt;text-align:right;border-bottom:1px solid #e5e7eb">${formatCurrency(item.unitPrice)}</td>
      <td style="padding:7px 4px;font-size:9pt;font-weight:bold;text-align:right;border-bottom:1px solid #e5e7eb">${formatCurrency(item.total)}</td>
    </tr>`
    )
    .join('');

  // --- Upfront rows inside totals ---
  const upfrontTotals =
    quote.requiresUpfrontPayment && quote.upfrontPaymentAmount
      ? `
      <tr><td colspan="2"><hr style="border:none;border-top:1px solid #e5e7eb;margin:4px 0"></td></tr>
      <tr>
        <td style="padding:3px 0;font-size:9pt;font-weight:bold;color:#b45309">50% Upfront Payment:</td>
        <td style="padding:3px 0;font-size:9pt;font-weight:bold;color:#b45309;text-align:right">${formatCurrency(quote.upfrontPaymentAmount)}</td>
      </tr>
      <tr>
        <td style="padding:3px 0;font-size:9pt;color:#6b7280">Balance on Completion:</td>
        <td style="padding:3px 0;font-size:9pt;text-align:right">${formatCurrency(quote.total - quote.upfrontPaymentAmount)}</td>
      </tr>`
      : '';

  // --- Payment terms box ---
  const paymentBox =
    quote.requiresUpfrontPayment && quote.upfrontPaymentAmount
      ? `
  <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:12px 16px;margin-bottom:16px">
    <p style="font-weight:bold;color:#92400e;margin-bottom:4px">Payment Terms</p>
    <p style="font-size:9pt;color:#78350f">
      A 50% deposit of <strong>${formatCurrency(quote.upfrontPaymentAmount)}</strong> is required before work begins.
      The remaining balance of <strong>${formatCurrency(quote.total - quote.upfrontPaymentAmount)}</strong> is due upon completion.
    </p>
  </div>`
      : '';

  // --- Notes box ---
  const notesBox = quote.notes
    ? `
  <div style="background:#f9fafb;padding:12px 16px;margin-bottom:16px">
    <p style="font-weight:bold;font-size:8.5pt;color:#374151;margin-bottom:6px">Notes / Terms:</p>
    <p style="font-size:9pt;white-space:pre-wrap">${esc(quote.notes)}</p>
  </div>`
    : '';

  return `<!DOCTYPE html>
<html ${ns}>
<head>
<meta charset="utf-8">
<title>${esc(quote.quoteNumber)}</title>
<style>
  /* margin:0 on @page suppresses the browser's built-in date/URL headers & footers */
  @page { size: A4 portrait; margin: 0; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10pt;
    color: #111827;
    line-height: 1.5;
    background: white;
    padding: 15mm;
  }
  ${QUOTE_PDF_CSS}
</style>
</head>
<body>

<!-- HEADER -->
<table style="width:100%;margin-bottom:20px">
  <tr>
    <td style="vertical-align:top;width:55%">
      <img src="${logo}" alt="AI Bridge Solutions" height="55"
           style="max-width:180px;object-fit:contain;display:block;margin-bottom:6px"
           onerror="this.style.display='none'">
      <span style="font-size:22pt;font-weight:bold;color:#2563eb;display:block;line-height:1.1">QUOTE</span>
      <span style="font-size:7.5pt;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280">${esc(co.name)}</span>
    </td>
    <td style="vertical-align:top;text-align:right;width:45%">
      <p style="font-size:8pt;color:#9ca3af">Quote Number</p>
      <p style="font-size:13pt;font-weight:bold;color:#111827">${esc(quote.quoteNumber)}</p>
      <p style="font-size:8pt;color:#9ca3af;margin-top:8px">Issue Date</p>
      <p style="font-size:10pt">${formatDate(quote.issueDate)}</p>
      <p style="font-size:8pt;color:#9ca3af;margin-top:8px">Valid Until</p>
      <p style="font-size:10pt">${formatDate(quote.validUntil)}</p>
    </td>
  </tr>
</table>

<hr style="border:none;border-top:1.5px solid #d1d5db;margin:0 0 16px 0">

<!-- CLIENT -->
<div style="margin-bottom:20px">
  <p style="font-size:8.5pt;font-weight:bold;color:#374151;margin-bottom:6px">Prepared For:</p>
  ${clientHtml}
</div>

${quote.title ? `<div style="margin-bottom:16px"><p style="font-size:15pt;font-weight:bold;color:#111827">${esc(quote.title)}</p></div>` : ''}

${
  quote.description
    ? `
<div style="background:#f9fafb;padding:12px 16px;margin-bottom:20px">
  <p style="font-size:8.5pt;font-weight:bold;color:#374151;margin-bottom:8px">Project Description</p>
  <div class="rte" style="font-size:10pt">${quote.description}</div>
</div>`
    : ''
}

<!-- ITEMS TABLE -->
<div style="margin-bottom:20px">
  <table style="width:100%;border-collapse:collapse">
    <thead>
      <tr style="border-bottom:2px solid #374151">
        <th style="text-align:left;padding:8px 4px;font-size:8.5pt;color:#374151">Description</th>
        <th style="text-align:right;padding:8px 4px;font-size:8.5pt;color:#374151">Qty</th>
        <th style="text-align:right;padding:8px 4px;font-size:8.5pt;color:#374151">Unit Price</th>
        <th style="text-align:right;padding:8px 4px;font-size:8.5pt;color:#374151">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>
</div>

<!-- TOTALS -->
<table style="width:100%;margin-bottom:20px;border-collapse:collapse">
  <tr>
    <td style="width:55%"></td>
    <td style="width:45%">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:4px 0;font-size:9pt;color:#6b7280">Subtotal:</td>
          <td style="padding:4px 0;font-size:9pt;text-align:right">${formatCurrency(quote.subtotal)}</td>
        </tr>
      </table>
      <hr style="border:none;border-top:2px solid #374151;margin:4px 0">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:4px 0;font-size:11pt;font-weight:bold">Estimated Total:</td>
          <td style="padding:4px 0;font-size:11pt;font-weight:bold;color:#2563eb;text-align:right">${formatCurrency(quote.total)}</td>
        </tr>
        ${upfrontTotals}
      </table>
    </td>
  </tr>
</table>

${notesBox}
${paymentBox}

<!-- VALIDITY -->
<div style="background:#eff6ff;border:1px solid #bfdbfe;padding:14px 16px;margin-bottom:20px">
  <p style="font-weight:bold;font-size:10pt;margin-bottom:4px">Quote Validity</p>
  <p style="font-size:9pt;color:#374151">
    This quote is valid until <strong>${formatDate(quote.validUntil)}</strong>.
    Prices and availability are subject to change after this date.
    This document is an estimate and not a request for payment.
  </p>
</div>

<!-- FOOTER -->
<hr style="border:none;border-top:2px solid #d1d5db;margin:20px 0 12px 0">
<p style="text-align:center;font-size:9pt;color:#6b7280;margin-bottom:12px">Thank you for considering AI Bridge Solutions.</p>
<table style="width:100%;border-collapse:collapse;font-size:8pt;text-align:center;margin-bottom:8px">
  <tr>
    <td style="padding:0 6px;vertical-align:top">
      <p style="font-weight:bold;color:#111827;margin-bottom:2px">Address</p>
      <p style="color:#6b7280;font-size:7.5pt">
        ${esc(co.address.line1)}<br>
        ${co.address.line2 ? esc(co.address.line2) + '<br>' : ''}
        ${esc(co.address.city)}<br>
        ${esc(co.address.postcode)}<br>
        ${esc(co.address.country)}
      </p>
    </td>
    <td style="padding:0 6px;vertical-align:top">
      <p style="font-weight:bold;color:#111827;margin-bottom:2px">Website</p>
      <p style="color:#6b7280">${esc(co.website.replace('https://', ''))}</p>
    </td>
    <td style="padding:0 6px;vertical-align:top">
      <p style="font-weight:bold;color:#111827;margin-bottom:2px">Email</p>
      <p style="color:#6b7280">${esc(co.email)}</p>
    </td>
    <td style="padding:0 6px;vertical-align:top">
      <p style="font-weight:bold;color:#111827;margin-bottom:2px">Phone</p>
      <p style="color:#6b7280">${esc(co.phone)}</p>
    </td>
  </tr>
</table>
<p style="text-align:center;font-size:7.5pt;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:8px">
  ${esc(co.name)} | Company Registration No: ${esc(co.companyNumber)}
</p>

</body>
</html>`;
}
