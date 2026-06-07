import React, { useState } from 'react';
import { Plus, ExternalLink, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatDate } from '@/lib/utils';

export const Receipts: React.FC = () => {
  const { receipts, invoices, clients, addReceipt } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    invoiceId: '',
    amount: '',
    paymentMethod: 'Bank Transfer',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const unpaidInvoices = invoices.filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.invoiceId || !formData.amount) {
      alert('Please fill in all required fields');
      return;
    }

    addReceipt({
      invoiceId: formData.invoiceId,
      amount: parseFloat(formData.amount),
      paymentMethod: formData.paymentMethod,
      paymentDate: formData.paymentDate,
      notes: formData.notes || undefined,
    });

    setFormData({
      invoiceId: '',
      amount: '',
      paymentMethod: 'Bank Transfer',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: '',
    });

    setIsModalOpen(false);
  };

  const sortedReceipts = [...receipts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Receipts</h1>
          <p className="text-gray-600 mt-2">Track payment receipts for invoices</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2" size={20} />
          Create Receipt
        </Button>
      </div>

      {sortedReceipts.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No receipts yet. Create your first receipt when you receive payment.</p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-2" size={20} />
                Create Receipt
              </Button>
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
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Receipt #</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Invoice #</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Client</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Payment Method</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Payment Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedReceipts.map((receipt) => {
                    const invoice = invoices.find((inv) => inv.id === receipt.invoiceId);
                    const client = invoice ? clients.find((c) => c.id === invoice.clientId) : undefined;
                    return (
                      <tr key={receipt.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {receipt.receiptNumber}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {invoice ? (
                            <Link 
                              to={`/invoices/${invoice.id}`}
                              className="text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
                            >
                              {invoice.invoiceNumber}
                              <ExternalLink size={14} />
                            </Link>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {client?.name || 'Unknown'}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {formatCurrency(receipt.amount)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {receipt.paymentMethod}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(receipt.paymentDate)}
                        </td>
                        <td className="py-3 px-4">
                          <Link to={`/receipts/${receipt.id}`}>
                            <button className="text-primary-600 hover:text-primary-700" title="View Receipt">
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Receipt"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice *
            </label>
            <select
              value={formData.invoiceId}
              onChange={(e) => {
                const selectedInvoice = invoices.find((inv) => inv.id === e.target.value);
                setFormData({
                  ...formData,
                  invoiceId: e.target.value,
                  amount: selectedInvoice ? selectedInvoice.total.toString() : '',
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Select an invoice</option>
              {unpaidInvoices.map((invoice) => {
                const client = clients.find((c) => c.id === invoice.clientId);
                return (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber} - {client?.name} - {formatCurrency(invoice.total)}
                  </option>
                );
              })}
            </select>
          </div>

          <Input
            label="Amount (£) *"
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method *
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Card">Card</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <Input
            label="Payment Date *"
            type="date"
            value={formData.paymentDate}
            onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="Add any additional notes..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1">
              Create Receipt
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
