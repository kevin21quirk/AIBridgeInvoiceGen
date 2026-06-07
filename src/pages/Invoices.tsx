import React, { useState } from 'react';
import { Plus, Eye, Edit, Trash2, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatDate } from '@/lib/utils';

export const Invoices: React.FC = () => {
  const { invoices, clients, deleteInvoice } = useStore();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const handleDelete = (id: string, invoiceNumber: string) => {
    if (confirm(`Are you sure you want to delete invoice ${invoiceNumber}? This action cannot be undone.`)) {
      deleteInvoice(id);
    }
  };

  // Get monthly invoices (those generated from recurring invoices)
  const monthlyInvoices = invoices.filter((invoice) => invoice.recurringInvoiceId);
  
  // Get unique months from monthly invoices
  const availableMonths = Array.from(
    new Set(
      monthlyInvoices.map((inv) => {
        const date = new Date(inv.issueDate);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      })
    )
  ).sort().reverse();

  const filteredInvoices = invoices.filter((invoice) => {
    // Filter by type (all, one-time, monthly)
    if (filterType === 'monthly' && !invoice.recurringInvoiceId) return false;
    if (filterType === 'one-time' && invoice.recurringInvoiceId) return false;
    
    // Filter by month for monthly invoices
    if (filterType === 'monthly' && selectedMonth !== 'all') {
      const invoiceMonth = new Date(invoice.issueDate);
      const monthStr = `${invoiceMonth.getFullYear()}-${String(invoiceMonth.getMonth() + 1).padStart(2, '0')}`;
      if (monthStr !== selectedMonth) return false;
    }
    
    // Filter by status
    if (filterStatus === 'all') return true;
    return invoice.status === filterStatus;
  });

  const sortedInvoices = [...filteredInvoices].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-2">Manage and track your invoices</p>
        </div>
        <Link to="/invoices/create">
          <Button>
            <Plus className="mr-2" size={20} />
            Create Invoice
          </Button>
        </Link>
      </div>

      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Type</label>
          <div className="flex gap-2">
            {['all', 'one-time', 'monthly'].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setFilterType(type);
                  if (type !== 'monthly') {
                    setSelectedMonth('all');
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === type
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {type === 'one-time' ? 'One-Time' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filterType === 'monthly' && availableMonths.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Months</option>
              {availableMonths.map((month) => {
                const [year, monthNum] = month.split('-');
                const date = new Date(parseInt(year), parseInt(monthNum) - 1);
                const monthName = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
                return (
                  <option key={month} value={month}>
                    {monthName}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <div className="flex gap-2 flex-wrap">
            {['all', 'draft', 'sent', 'viewed', 'overdue', 'paid', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {sortedInvoices.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {filterStatus === 'all'
                  ? 'No invoices yet. Create your first invoice to get started.'
                  : `No ${filterStatus} invoices found.`}
              </p>
              <Link to="/invoices/create">
                <Button>
                  <Plus className="mr-2" size={20} />
                  Create Invoice
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Invoice #</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Client</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Issue Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Due Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedInvoices.map((invoice) => {
                    const client = clients.find((c) => c.id === invoice.clientId);
                    return (
                      <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            {invoice.invoiceNumber}
                            {invoice.recurringInvoiceId && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Monthly
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {client?.name || 'Unknown Client'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                          {invoice.type}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {formatCurrency(invoice.total)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(invoice.issueDate)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(invoice.dueDate)}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={invoice.status} />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Link to={`/invoices/${invoice.id}`}>
                              <button className="text-primary-600 hover:text-primary-700" title="View Invoice">
                                <Eye size={18} />
                              </button>
                            </Link>
                            <Link to={`/invoices/${invoice.id}/edit`}>
                              <button className="text-blue-600 hover:text-blue-700" title="Edit Invoice">
                                <Edit size={18} />
                              </button>
                            </Link>
                            <button 
                              onClick={() => handleDelete(invoice.id, invoice.invoiceNumber)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete Invoice"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
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
    </div>
  );
};
