import React, { useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, Printer, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { COMPANY_DETAILS } from '@/lib/constants';
import { QuoteStatus } from '@/types';
import html2pdf from 'html2pdf.js';
import { generateQuoteHtml, QUOTE_PDF_CSS } from '@/lib/quoteHtml';

export const ViewQuote: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getQuote, updateQuoteStatus } = useStore();
  const quoteRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<QuoteStatus | ''>('');
  const [generating, setGenerating] = useState(false);

  const quote = id ? getQuote(id) : undefined;

  if (!quote) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quote Not Found</h2>
        <Link to="/quotes">
          <Button>Back to Quotes</Button>
        </Link>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Download PDF
  // Renders a clean off-screen container (no Tailwind, no sidebar) and feeds
  // it to html2pdf.js with css-mode page breaks.
  // ---------------------------------------------------------------------------
  const handleDownloadPDF = async () => {
    if (generating) return;
    setGenerating(true);

    try {
      const fullHtml = generateQuoteHtml(quote);

      // Parse the generated HTML in a sandboxed DOMParser so we can extract
      // the body content cleanly.
      const parser = new DOMParser();
      const doc = parser.parseFromString(fullHtml, 'text/html');

      // Build an off-screen container with explicit A4 dimensions.
      // 210mm at 96 dpi ≈ 794px; 15mm padding ≈ 57px each side.
      const container = document.createElement('div');
      container.id = '__quote-pdf-render__';
      container.style.cssText = [
        'position:fixed',
        'left:-9999px',
        'top:0',
        'width:794px',
        'padding:57px',           // ~15mm at 96dpi
        'background:#ffffff',
        'font-family:Arial,Helvetica,sans-serif',
        'font-size:10pt',
        'color:#111827',
        'line-height:1.5',
        'z-index:-1',
      ].join(';');

      container.innerHTML = doc.body.innerHTML;
      document.body.appendChild(container);

      // Inject page-break CSS into the head so html2pdf.js / html2canvas see it.
      const styleEl = document.createElement('style');
      styleEl.id = '__quote-pdf-style__';
      styleEl.textContent = QUOTE_PDF_CSS;
      document.head.appendChild(styleEl);

      // Small pause to let the browser lay out the container.
      await new Promise((r) => setTimeout(r, 150));

      const opt = {
        margin: 0,
        filename: `${quote.quoteNumber}.pdf`,
        image: { type: 'png' as const, quality: 1 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          width: 794,
          windowWidth: 794,
          imageTimeout: 0,
        },
        jsPDF: {
          unit: 'mm' as const,
          format: 'a4' as const,
          orientation: 'portrait' as const,
        },
        pagebreak: { mode: ['css'] as const },
      };

      await html2pdf().set(opt).from(container).save();
    } finally {
      // Clean up
      const c = document.getElementById('__quote-pdf-render__');
      const s = document.getElementById('__quote-pdf-style__');
      if (c) document.body.removeChild(c);
      if (s) document.head.removeChild(s);
      setGenerating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Download Word (.doc)
  // Word can open HTML with Word XML namespaces as a native .doc file.
  // ---------------------------------------------------------------------------
  const handleDownloadWord = () => {
    const html = generateQuoteHtml(quote, true);
    const blob = new Blob(['\ufeff', html], {
      type: 'application/msword;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quote.quoteNumber}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---------------------------------------------------------------------------
  // Print
  // Opens the clean quote HTML in a new window – sidebar and UI are excluded.
  // ---------------------------------------------------------------------------
  const handlePrint = () => {
    const html = generateQuoteHtml(quote);
    const win = window.open('', '_blank');
    if (!win) {
      alert('Please allow popups for this page to use the print function.');
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    // Delay so images have time to load before printing.
    win.onload = () => {
      setTimeout(() => win.print(), 300);
    };
  };

  const handleStatusUpdate = async () => {
    if (!id || !status) return;
    try {
      await updateQuoteStatus(id, status);
      setStatus('');
    } catch (err) {
      console.error('Failed to update quote status:', err);
      alert('Failed to update quote status. Please try again.');
    }
  };

  return (
    <div>
      {/* ---- Toolbar ---- */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate('/quotes')} className="mb-4">
          <ArrowLeft className="mr-2" size={20} />
          Back to Quotes
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quote {quote.quoteNumber}</h1>
            <p className="text-gray-600 mt-2">View and manage quote details</p>
          </div>

          <div className="flex gap-3 flex-wrap justify-end">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2" size={20} />
              Print
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF} disabled={generating}>
              <Download className="mr-2" size={20} />
              {generating ? 'Generating…' : 'Download PDF'}
            </Button>
            <Button variant="outline" onClick={handleDownloadWord}>
              <FileText className="mr-2" size={20} />
              Download Word
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <StatusBadge status={quote.status} />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as QuoteStatus)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Update status...</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
          {status && (
            <Button size="sm" onClick={handleStatusUpdate}>
              Update
            </Button>
          )}
        </div>
      </div>

      {/* ---- On-screen quote preview ---- */}
      <Card>
        <CardContent>
          <div ref={quoteRef} className="bg-white p-8">
            <div className="flex items-start justify-between mb-8">
              <div className="flex flex-col gap-3">
                <img
                  src={COMPANY_DETAILS.logo}
                  alt="AI Bridge Solutions Logo"
                  className="h-20 w-auto object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div>
                  <h1 className="text-4xl font-bold text-primary-600 mb-1">QUOTE</h1>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{COMPANY_DETAILS.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Quote Number</p>
                <p className="text-xl font-bold text-gray-900">{quote.quoteNumber}</p>
                <p className="text-sm text-gray-600 mt-2">Issue Date</p>
                <p className="font-medium text-gray-900">{formatDate(quote.issueDate)}</p>
                <p className="text-sm text-gray-600 mt-2">Valid Until</p>
                <p className="font-medium text-gray-900">{formatDate(quote.validUntil)}</p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Prepared For:</h3>
              <div className="text-gray-900">
                <p className="font-semibold">{quote.client?.name}</p>
                {quote.client?.companyName && (
                  <p className="text-sm text-gray-600">{quote.client.companyName}</p>
                )}
                {quote.client?.address && (
                  <>
                    <p className="text-sm mt-1">{quote.client.address.line1}</p>
                    {quote.client.address.line2 && (
                      <p className="text-sm">{quote.client.address.line2}</p>
                    )}
                    <p className="text-sm">
                      {quote.client.address.city}, {quote.client.address.postcode}
                    </p>
                    <p className="text-sm">{quote.client.address.country}</p>
                  </>
                )}
              </div>
            </div>

            {quote.title && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{quote.title}</h2>
              </div>
            )}

            {quote.description && (
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Project Description</h3>
                <div
                  className="text-sm text-gray-900 rich-text-output"
                  dangerouslySetInnerHTML={{ __html: quote.description }}
                />
              </div>
            )}

            <div className="mb-8">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Description</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Quantity</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Unit Price</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td className="py-3 px-2 text-sm text-gray-900">{item.description}</td>
                      <td className="py-3 px-2 text-sm text-gray-900 text-right">{item.quantity}</td>
                      <td className="py-3 px-2 text-sm text-gray-900 text-right">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-3 px-2 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mb-8">
              <div className="w-64">
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(quote.subtotal)}</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-gray-300">
                  <span className="text-lg font-semibold text-gray-900">Estimated Total:</span>
                  <span className="text-lg font-bold text-primary-600">
                    {formatCurrency(quote.total)}
                  </span>
                </div>
                {quote.requiresUpfrontPayment && quote.upfrontPaymentAmount && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between py-1 text-sm">
                      <span className="font-semibold text-amber-700">50% Upfront Payment:</span>
                      <span className="font-bold text-amber-700">
                        {formatCurrency(quote.upfrontPaymentAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 text-sm">
                      <span className="text-gray-600">Balance on Completion:</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(quote.total - quote.upfrontPaymentAmount)}
                      </span>
                    </div>
                    <p className="text-xs text-amber-600 mt-1">
                      A 50% deposit is required before work begins.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {quote.notes && (
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes / Terms:</h3>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{quote.notes}</p>
              </div>
            )}

            <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Quote Validity</h3>
              <p className="text-sm text-gray-700">
                This quote is valid until <strong>{formatDate(quote.validUntil)}</strong>. Prices and availability are subject to change after this date. This document is an estimate and not a request for payment.
              </p>
            </div>

            <div className="border-t-2 border-gray-300 pt-6 mt-8">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">
                  Thank you for considering AI Bridge Solutions.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-700">
                  <div className="text-center">
                    <p className="font-semibold text-gray-900 mb-1">Address</p>
                    <p className="text-xs leading-relaxed">
                      {COMPANY_DETAILS.address.line1}<br />
                      {COMPANY_DETAILS.address.line2}<br />
                      {COMPANY_DETAILS.address.city}<br />
                      {COMPANY_DETAILS.address.postcode}<br />
                      {COMPANY_DETAILS.address.country}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900 mb-1">Website</p>
                    <a href={COMPANY_DETAILS.website} className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">
                      {COMPANY_DETAILS.website.replace('https://', '')}
                    </a>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900 mb-1">Email</p>
                    <a href={`mailto:${COMPANY_DETAILS.email}`} className="text-primary-600 hover:underline">
                      {COMPANY_DETAILS.email}
                    </a>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900 mb-1">Phone</p>
                    <a href={`tel:${COMPANY_DETAILS.phone}`} className="text-primary-600 hover:underline">
                      {COMPANY_DETAILS.phone}
                    </a>
                  </div>
                </div>
                <div className="text-center mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    {COMPANY_DETAILS.name} | Company Registration No: {COMPANY_DETAILS.companyNumber}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
