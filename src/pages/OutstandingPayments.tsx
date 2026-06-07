import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Eye, AlertCircle, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatDate } from '@/lib/utils';

export const OutstandingPayments: React.FC = () => {
  const { invoices, clients } = useStore();

  const outstandingData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const unpaidInvoices = invoices.filter(
      (inv) => inv.status !== 'paid' && inv.status !== 'cancelled'
    );

    const overdue = unpaidInvoices.filter((inv) => {
      const dueDate = new Date(inv.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    });

    const outstanding = unpaidInvoices.filter((inv) => {
      const dueDate = new Date(inv.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate >= today;
    });

    const totalOverdue = overdue.reduce((sum, inv) => {
      const amountDue = inv.requiresUpfrontPayment && inv.upfrontPaymentPaid
        ? inv.total - (inv.upfrontPaymentAmount || 0)
        : inv.total;
      return sum + amountDue;
    }, 0);

    const totalOutstanding = outstanding.reduce((sum, inv) => {
      const amountDue = inv.requiresUpfrontPayment && inv.upfrontPaymentPaid
        ? inv.total - (inv.upfrontPaymentAmount || 0)
        : inv.total;
      return sum + amountDue;
    }, 0);

    return {
      overdue: overdue.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
      outstanding: outstanding.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
      totalOverdue,
      totalOutstanding,
      totalUnpaid: totalOverdue + totalOutstanding,
    };
  }, [invoices]);

  const getDaysOverdue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getAmountDue = (invoice: any) => {
    if (invoice.requiresUpfrontPayment && invoice.upfrontPaymentPaid) {
      return invoice.total - (invoice.upfrontPaymentAmount || 0);
    }
    return invoice.total;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Outstanding Payments</h1>
        <p className="text-gray-600 mt-2">Track and manage unpaid invoices</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Unpaid</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatCurrency(outstandingData.totalUnpaid)}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Clock className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {formatCurrency(outstandingData.totalOverdue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {outstandingData.overdue.length} invoice{outstandingData.overdue.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertCircle className="text-red-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Outstanding</p>
                <p className="text-3xl font-bold text-amber-600 mt-2">
                  {formatCurrency(outstandingData.totalOutstanding)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {outstandingData.outstanding.length} invoice{outstandingData.outstanding.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="bg-amber-100 p-3 rounded-lg">
                <Clock className="text-amber-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {outstandingData.overdue.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-600" size={20} />
              <CardTitle className="text-red-900">Overdue Invoices</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-red-200 bg-red-50">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-red-900">Invoice #</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-red-900">Client</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-red-900">Amount Due</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-red-900">Due Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-red-900">Days Overdue</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-red-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {outstandingData.overdue.map((invoice) => {
                    const client = clients.find((c) => c.id === invoice.clientId);
                    const daysOverdue = getDaysOverdue(invoice.dueDate);
                    return (
                      <tr key={invoice.id} className="border-b border-red-100 hover:bg-red-50">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {client?.name || 'Unknown Client'}
                        </td>
                        <td className="py-3 px-4 text-sm font-bold text-red-700">
                          {formatCurrency(getAmountDue(invoice))}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {formatDate(invoice.dueDate)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                            {daysOverdue} day{daysOverdue !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Link to={`/invoices/${invoice.id}`}>
                            <button className="text-primary-600 hover:text-primary-700" title="View Invoice">
                              <Eye size={18} />
                            </button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {outstandingData.outstanding.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="text-amber-600" size={20} />
              <CardTitle className="text-amber-900">Outstanding Invoices (Not Yet Due)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-amber-200 bg-amber-50">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-amber-900">Invoice #</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-amber-900">Client</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-amber-900">Amount Due</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-amber-900">Due Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-amber-900">Days Until Due</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-amber-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {outstandingData.outstanding.map((invoice) => {
                    const client = clients.find((c) => c.id === invoice.clientId);
                    const daysUntilDue = -getDaysOverdue(invoice.dueDate);
                    return (
                      <tr key={invoice.id} className="border-b border-amber-100 hover:bg-amber-50">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {client?.name || 'Unknown Client'}
                        </td>
                        <td className="py-3 px-4 text-sm font-bold text-amber-700">
                          {formatCurrency(getAmountDue(invoice))}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {formatDate(invoice.dueDate)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Link to={`/invoices/${invoice.id}`}>
                            <button className="text-primary-600 hover:text-primary-700" title="View Invoice">
                              <Eye size={18} />
                            </button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {outstandingData.overdue.length === 0 && outstandingData.outstanding.length === 0 && (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-gray-600">You have no outstanding payments at this time.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
