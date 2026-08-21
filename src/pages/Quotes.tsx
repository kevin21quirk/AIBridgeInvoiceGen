import React, { useState } from 'react';
import { Plus, Eye, Trash2, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatDate } from '@/lib/utils';

export const Quotes: React.FC = () => {
  const { quotes, clients, deleteQuote } = useStore();
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const handleDelete = (id: string, quoteNumber: string) => {
    if (confirm(`Are you sure you want to delete quote ${quoteNumber}? This action cannot be undone.`)) {
      deleteQuote(id);
    }
  };

  const filteredQuotes = quotes.filter((quote) => {
    if (filterStatus === 'all') return true;
    return quote.status === filterStatus;
  });

  const sortedQuotes = [...filteredQuotes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quotes</h1>
          <p className="text-gray-600 mt-2">Create and manage client quotes</p>
        </div>
        <Link to="/quotes/create">
          <Button>
            <Plus className="mr-2" size={20} />
            Create Quote
          </Button>
        </Link>
      </div>

      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <div className="flex gap-2 flex-wrap">
            {['all', 'draft', 'sent', 'accepted', 'rejected', 'expired'].map((status) => (
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

      {sortedQuotes.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Quote className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">
                {filterStatus === 'all'
                  ? 'No quotes yet. Create your first quote to get started.'
                  : `No ${filterStatus} quotes found.`}
              </p>
              <Link to="/quotes/create">
                <Button>
                  <Plus className="mr-2" size={20} />
                  Create Quote
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
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Quote #</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Client</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Title</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Issue Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Valid Until</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedQuotes.map((quote) => {
                    const client = clients.find((c) => c.id === quote.clientId);
                    return (
                      <tr key={quote.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{quote.quoteNumber}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{client?.name || 'Unknown Client'}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{quote.title || '-'}</td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{formatCurrency(quote.total)}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{formatDate(quote.issueDate)}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{formatDate(quote.validUntil)}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={quote.status} />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Link to={`/quotes/${quote.id}`}>
                              <button className="text-primary-600 hover:text-primary-700" title="View Quote">
                                <Eye size={18} />
                              </button>
                            </Link>
                            <button
                              onClick={() => handleDelete(quote.id, quote.quoteNumber)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete Quote"
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
