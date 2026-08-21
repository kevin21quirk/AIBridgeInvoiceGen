import React, { useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { COMPANY_DETAILS } from '@/lib/constants';
import { QuoteStatus } from '@/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const ViewQuote: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getQuote, updateQuoteStatus } = useStore();
  const quoteRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<QuoteStatus | ''>('');

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

  const handleDownloadPDF = async () => {
    if (!quoteRef.current) return;

    try {
      const canvas = await html2canvas(quoteRef.current, {
        scale: 2.5,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff',
        imageTimeout: 0,
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const pxPerMm = canvas.width / pdfWidth;
      const pageHeightPx = pdfHeight * pxPerMm;

      let offsetY = 0;
      let pageIndex = 0;
      while (offsetY < canvas.height) {
        const sliceHeight = Math.min(pageHeightPx, canvas.height - offsetY);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeight;
        const ctx = sliceCanvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(canvas, 0, offsetY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

        const imgData = sliceCanvas.toDataURL('image/png');
        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, sliceHeight / pxPerMm);

        offsetY += pageHeightPx;
        pageIndex++;
      }

      pdf.save(`${quote.quoteNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handlePrint = () => {
    window.print();
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
      <div className="mb-8 no-print">
        <Button variant="ghost" onClick={() => navigate('/quotes')} className="mb-4">
          <ArrowLeft className="mr-2" size={20} />
          Back to Quotes
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quote {quote.quoteNumber}</h1>
            <p className="text-gray-600 mt-2">View and manage quote details</p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2" size={20} />
              Print
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="mr-2" size={20} />
              Download PDF
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

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
};
