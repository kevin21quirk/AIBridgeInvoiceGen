import React, { useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { COMPANY_DETAILS } from '@/lib/constants';
import { api } from '@/services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const ViewInvoice: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInvoice, updateInvoiceStatus, updateUpfrontPaymentStatus, receipts } = useStore();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const invoice = id ? getInvoice(id) : undefined;
  const receipt = id ? receipts.find((r) => r.invoiceId === id) : undefined;

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Invoice Not Found</h2>
        <Link to="/invoices">
          <Button>Back to Invoices</Button>
        </Link>
      </div>
    );
  }

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;

    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleStatusChange = async (newStatus: typeof invoice.status) => {
    if (!id) return;
    if (newStatus === 'paid') setMarkingPaid(true);
    try {
      await updateInvoiceStatus(id, newStatus);
    } catch (err) {
      console.error('Failed to update invoice status:', err);
      alert('Failed to update invoice status. Please try again.');
    } finally {
      setMarkingPaid(false);
    }
  };

  const handleEmailInvoice = async () => {
    if (!id) return;
    setSendingEmail(true);
    try {
      const result = await api.sendInvoiceEmail(id);
      alert(result.message);
    } catch (err: any) {
      alert(err.message || 'Failed to send email. Please check your email settings.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleUpfrontPaymentToggle = () => {
    if (id) {
      updateUpfrontPaymentStatus(id, !invoice.upfrontPaymentPaid);
    }
  };

  return (
    <div>
      <div className="mb-8 no-print">
        <Button variant="ghost" onClick={() => navigate('/invoices')} className="mb-4">
          <ArrowLeft className="mr-2" size={20} />
          Back to Invoices
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoice {invoice.invoiceNumber}</h1>
            <p className="text-gray-600 mt-2">View and manage invoice details</p>
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
            <Button variant="outline" onClick={handleEmailInvoice} disabled={sendingEmail}>
              <Mail className="mr-2" size={20} />
              {sendingEmail ? 'Sending...' : 'Email to Client'}
            </Button>
            {invoice.status !== 'paid' && (
              <Button onClick={() => handleStatusChange('paid')} disabled={markingPaid}>
                {markingPaid ? 'Processing...' : 'Mark as Paid'}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-2 items-center flex-wrap">
          <StatusBadge status={invoice.status} />
          {invoice.status === 'draft' && (
            <Button size="sm" variant="outline" onClick={() => handleStatusChange('sent')}>
              Mark as Sent
            </Button>
          )}
          {invoice.requiresUpfrontPayment && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg">
              <input
                type="checkbox"
                id="upfrontPaid"
                checked={invoice.upfrontPaymentPaid}
                onChange={handleUpfrontPaymentToggle}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="upfrontPaid" className="text-sm font-medium text-amber-900">
                50% Deposit Paid ({formatCurrency(invoice.upfrontPaymentAmount || 0)})
              </label>
            </div>
          )}
          {receipt && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-lg">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium text-green-900">
                Receipt Generated: {receipt.receiptNumber}
              </span>
              <Link to={`/receipts/${receipt.id}`} className="text-sm text-green-700 hover:text-green-800 underline ml-2">
                View Receipt
              </Link>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardContent>
          <div ref={invoiceRef} className="bg-white p-8">
            <div className="flex items-start justify-between mb-8">
              <div className="flex flex-col gap-3">
                <img 
                  src={COMPANY_DETAILS.logo} 
                  alt="AI Bridge Solutions Logo" 
                  className="h-20 w-auto object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div>
                  <h1 className="text-4xl font-bold text-primary-600 mb-1">INVOICE</h1>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{COMPANY_DETAILS.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Invoice Number</p>
                <p className="text-xl font-bold text-gray-900">{invoice.invoiceNumber}</p>
                <p className="text-sm text-gray-600 mt-2">Issue Date</p>
                <p className="font-medium text-gray-900">{formatDate(invoice.issueDate)}</p>
                <p className="text-sm text-gray-600 mt-2">Due Date</p>
                <p className="font-medium text-gray-900">{formatDate(invoice.dueDate)}</p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Bill To:</h3>
              <div className="text-gray-900">
                <p className="font-semibold">{invoice.client?.name}</p>
                {invoice.client?.companyName && (
                  <p className="text-sm text-gray-600">{invoice.client.companyName}</p>
                )}
                {invoice.client?.address && (
                  <>
                    <p className="text-sm mt-1">{invoice.client.address.line1}</p>
                    {invoice.client.address.line2 && (
                      <p className="text-sm">{invoice.client.address.line2}</p>
                    )}
                    <p className="text-sm">
                      {invoice.client.address.city}, {invoice.client.address.postcode}
                    </p>
                    <p className="text-sm">{invoice.client.address.country}</p>
                  </>
                )}
              </div>
            </div>

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
                  {invoice.items.map((item) => (
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
                  <span className="font-medium text-gray-900">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-gray-300">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-lg font-bold text-primary-600">
                    {formatCurrency(invoice.total)}
                  </span>
                </div>
                {invoice.requiresUpfrontPayment && invoice.upfrontPaymentPaid && (
                  <>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex justify-between py-1 text-sm">
                        <span className="text-green-700">Deposit Paid (50%):</span>
                        <span className="font-medium text-green-700">
                          -{formatCurrency(invoice.upfrontPaymentAmount || 0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between py-3 border-t-2 border-gray-300 mt-2">
                      <span className="text-lg font-semibold text-gray-900">Amount Due:</span>
                      <span className="text-lg font-bold text-primary-600">
                        {formatCurrency((invoice.total || 0) - (invoice.upfrontPaymentAmount || 0))}
                      </span>
                    </div>
                  </>
                )}
                {invoice.requiresUpfrontPayment && !invoice.upfrontPaymentPaid && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between py-1 text-sm">
                      <span className="font-semibold text-amber-700">50% Upfront Payment:</span>
                      <span className="font-bold text-amber-700">
                        {formatCurrency(invoice.upfrontPaymentAmount || 0)}
                      </span>
                    </div>
                    <p className="text-xs text-amber-600 mt-1">
                      Required before work begins
                    </p>
                  </div>
                )}
              </div>
            </div>

            {invoice.requiresUpfrontPayment && (
              <div className="mb-8 p-4 bg-amber-50 border-l-4 border-amber-400 rounded">
                <h3 className="text-sm font-semibold text-amber-900 mb-1">Payment Terms</h3>
                <p className="text-sm text-amber-800">
                  This project requires a 50% upfront payment of <strong>{formatCurrency(invoice.upfrontPaymentAmount || 0)}</strong> before work commences. 
                  The remaining balance of <strong>{formatCurrency((invoice.total || 0) - (invoice.upfrontPaymentAmount || 0))}</strong> is due upon completion.
                </p>
              </div>
            )}

            {invoice.notes && (
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes:</h3>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}

            <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Payment Details</h3>
              
              {invoice.recurringInvoiceId && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">Monthly Payment</h4>
                  <p className="text-sm text-blue-800 mb-3">
                    This is a recurring monthly payment. To ensure uninterrupted service, we recommend setting up a Direct Debit or Standing Order for automatic payments.
                  </p>
                  <p className="text-sm text-blue-800">
                    Alternatively, you may make individual monthly payments manually using the bank details below.
                  </p>
                </div>
              )}
              
              <p className="text-sm text-gray-700 mb-3">
                Please make all payments to:
              </p>
              <div className="text-sm text-gray-900 space-y-1">
                <p className="font-semibold">{COMPANY_DETAILS.name}</p>
                <p>Account Number: <span className="font-medium">{COMPANY_DETAILS.bankAccount}</span></p>
                <p>Sort Code: <span className="font-medium">{COMPANY_DETAILS.sortCode}</span></p>
                <p className="mt-3 text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                  <strong>Payment Reference:</strong> Please use <span className="font-bold">{invoice.invoiceNumber}</span> as your payment reference
                </p>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                Payment due by {formatDate(invoice.dueDate)}
              </p>
            </div>

            <div className="border-t-2 border-gray-300 pt-6 mt-8">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">
                  Thank you for your business!
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
