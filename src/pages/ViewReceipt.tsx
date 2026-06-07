import React, { useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { COMPANY_DETAILS } from '@/lib/constants';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const ViewReceipt: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { receipts, invoices, clients } = useStore();
  const receiptRef = useRef<HTMLDivElement>(null);

  const receipt = receipts.find((r) => r.id === id);
  const invoice = receipt ? invoices.find((inv) => inv.id === receipt.invoiceId) : undefined;
  const client = invoice ? clients.find((c) => c.id === invoice.clientId) : undefined;

  if (!receipt || !invoice || !client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Receipt Not Found</h2>
        <Link to="/receipts">
          <Button>Back to Receipts</Button>
        </Link>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${receipt.receiptNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div>
      <div className="mb-8 print:hidden">
        <Link to="/receipts" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
          <ArrowLeft className="mr-2" size={20} />
          Back to Receipts
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Receipt {receipt.receiptNumber}</h1>
            <p className="text-gray-600 mt-2">Payment receipt for invoice {invoice.invoiceNumber}</p>
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
      </div>

      <Card>
        <CardContent>
          <div ref={receiptRef} className="bg-white p-8">
            <div className="text-center mb-8 pb-6 border-b-2 border-gray-300">
              <div className="flex items-center justify-center gap-4 mb-4">
                <img 
                  src={COMPANY_DETAILS.logo} 
                  alt="Company Logo" 
                  className="h-16 w-auto object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">PAYMENT RECEIPT</h1>
              <p className="text-xl text-gray-600">Receipt #{receipt.receiptNumber}</p>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase">From:</h3>
                <div className="text-sm text-gray-900">
                  <p className="font-semibold text-base mb-1">{COMPANY_DETAILS.name}</p>
                  <p>{COMPANY_DETAILS.address.line1}</p>
                  {COMPANY_DETAILS.address.line2 && <p>{COMPANY_DETAILS.address.line2}</p>}
                  <p>{COMPANY_DETAILS.address.city}</p>
                  <p>{COMPANY_DETAILS.address.postcode}</p>
                  <p>{COMPANY_DETAILS.address.country}</p>
                  <p className="mt-2">Company No: {COMPANY_DETAILS.companyNumber}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase">To:</h3>
                <div className="text-sm text-gray-900">
                  <p className="font-semibold text-base mb-1">{client.companyName || client.name}</p>
                  <p>{client.name}</p>
                  {client.address && (
                    <>
                      <p>{client.address.line1}</p>
                      {client.address.line2 && <p>{client.address.line2}</p>}
                      <p>{client.address.city}</p>
                      <p>{client.address.postcode}</p>
                      <p>{client.address.country}</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-8 p-6 bg-green-50 border-2 border-green-200 rounded-lg">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payment Date</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(receipt.paymentDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                  <p className="text-lg font-semibold text-gray-900">{receipt.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Invoice Reference</p>
                  <p className="text-lg font-semibold text-gray-900">{invoice.invoiceNumber}</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-3 text-sm font-semibold text-gray-700">Description</th>
                    <th className="text-right py-3 text-sm font-semibold text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 text-sm text-gray-900">
                      Payment received for Invoice {invoice.invoiceNumber}
                      <br />
                      <span className="text-xs text-gray-600">{invoice.type.charAt(0).toUpperCase() + invoice.type.slice(1)} Services</span>
                    </td>
                    <td className="py-4 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(receipt.amount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mb-8">
              <div className="w-64">
                <div className="bg-green-600 text-white p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Paid</span>
                    <span className="text-2xl font-bold">{formatCurrency(receipt.amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {receipt.notes && (
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes:</h3>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{receipt.notes}</p>
              </div>
            )}

            <div className="pt-8 border-t-2 border-gray-300 text-center">
              <p className="text-lg font-semibold text-green-600 mb-4">✓ PAYMENT RECEIVED - THANK YOU</p>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium text-gray-900">{COMPANY_DETAILS.name}</p>
                <p>{COMPANY_DETAILS.address.line1}, {COMPANY_DETAILS.address.city}, {COMPANY_DETAILS.address.postcode}</p>
                <p>
                  <a href={`mailto:${COMPANY_DETAILS.email}`} className="text-primary-600 hover:underline">{COMPANY_DETAILS.email}</a>
                  {' | '}
                  <a href={`tel:${COMPANY_DETAILS.phone}`} className="text-primary-600 hover:underline">{COMPANY_DETAILS.phone}</a>
                  {' | '}
                  <a href={COMPANY_DETAILS.website} className="text-primary-600 hover:underline">{COMPANY_DETAILS.website}</a>
                </p>
                <p className="text-xs mt-2">Company Registration Number: {COMPANY_DETAILS.companyNumber}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
