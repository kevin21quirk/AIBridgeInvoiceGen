import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, DollarSign, TrendingUp, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatDate } from '@/lib/utils';

export const Dashboard: React.FC = () => {
  const { clients, invoices, recurringInvoices } = useStore();
  
  const stats = useMemo(() => {
    const totalRevenue = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);
    
    const pendingRevenue = invoices
      .filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + inv.total, 0);
    
    const overdueInvoices = invoices.filter((inv) => {
      if (inv.status === 'paid' || inv.status === 'cancelled') return false;
      return new Date(inv.dueDate) < new Date();
    }).length;
    
    return {
      totalClients: clients.length,
      totalInvoices: invoices.length,
      totalRevenue,
      pendingRevenue,
      overdueInvoices,
    };
  }, [clients, invoices]);
  
  const recentInvoices = useMemo(() => {
    return [...invoices]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [invoices]);
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to your invoice management system</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Clients</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalClients}</p>
              </div>
              <div className="bg-primary-100 p-3 rounded-lg">
                <Users className="text-primary-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Invoices</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalInvoices}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(stats.pendingRevenue)}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <TrendingUp className="text-yellow-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {stats.overdueInvoices > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p className="text-red-800 font-medium">
            You have {stats.overdueInvoices} overdue invoice{stats.overdueInvoices !== 1 ? 's' : ''} that require attention.
          </p>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Invoices</CardTitle>
            <Link to="/invoices" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentInvoices.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No invoices yet. Create your first invoice to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Invoice #</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Client</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Due Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((invoice) => {
                    const client = clients.find((c) => c.id === invoice.clientId);
                    return (
                      <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">{invoice.invoiceNumber}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{client?.name || 'Unknown'}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{formatCurrency(invoice.total)}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{formatDate(invoice.dueDate)}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={invoice.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="text-green-600" size={20} />
              <CardTitle>Monthly Recurring Invoices</CardTitle>
            </div>
            <Link to="/recurring-invoices">
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View All →
              </button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recurringInvoices.filter(r => r.isActive).length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recurring invoices set up yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Client</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Billing Day</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recurringInvoices.filter(r => r.isActive).map((recurring) => {
                    const client = clients.find((c) => c.id === recurring.clientId);
                    return (
                      <tr key={recurring.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">{client?.name || 'Unknown'}</td>
                        <td className="py-3 px-4 text-sm text-gray-900 capitalize">{recurring.type}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{formatCurrency(recurring.amount)}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">Day {recurring.dayOfMonth} of month</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
