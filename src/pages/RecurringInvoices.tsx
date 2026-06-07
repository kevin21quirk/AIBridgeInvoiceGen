import React, { useState } from 'react';
import { Plus, Edit, Trash2, RefreshCw, Pause, Play, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/store/useStore';
import { RecurringInvoice, InvoiceType, InvoiceItem } from '@/types';
import { formatCurrency, formatDate, generateId } from '@/lib/utils';

export const RecurringInvoices: React.FC = () => {
  const navigate = useNavigate();
  const { clients, recurringInvoices, addRecurringInvoice, updateRecurringInvoice, deleteRecurringInvoice, generateInvoiceFromRecurring } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringInvoice | null>(null);
  
  const [formData, setFormData] = useState({
    clientId: '',
    type: 'support' as InvoiceType,
    dayOfMonth: 1,
    isActive: true,
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: generateId(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    },
  ]);

  const handleOpenModal = (recurring?: RecurringInvoice) => {
    if (recurring) {
      setEditingRecurring(recurring);
      setFormData({
        clientId: recurring.clientId,
        type: recurring.type,
        dayOfMonth: recurring.dayOfMonth,
        isActive: recurring.isActive,
        startDate: recurring.startDate,
        notes: recurring.notes || '',
      });
      setItems(recurring.items);
    } else {
      setEditingRecurring(null);
      setFormData({
        clientId: '',
        type: 'support',
        dayOfMonth: 1,
        isActive: true,
        startDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setItems([
        {
          id: generateId(),
          description: '',
          quantity: 1,
          unitPrice: 0,
          total: 0,
        },
      ]);
    }
    setIsModalOpen(true);
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.total = Number(updatedItem.quantity) * Number(updatedItem.unitPrice);
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: generateId(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId) {
      alert('Please select a client');
      return;
    }

    if (items.some((item) => !item.description || item.quantity <= 0 || item.unitPrice <= 0)) {
      alert('Please fill in all item details with valid values');
      return;
    }

    const amount = items.reduce((sum, item) => sum + item.total, 0);

    const recurringData = {
      clientId: formData.clientId,
      type: formData.type,
      items: items,
      amount: amount,
      dayOfMonth: formData.dayOfMonth,
      isActive: formData.isActive,
      startDate: formData.startDate,
      notes: formData.notes || undefined,
    };

    if (editingRecurring) {
      updateRecurringInvoice(editingRecurring.id, recurringData);
    } else {
      addRecurringInvoice(recurringData);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this recurring invoice?')) {
      deleteRecurringInvoice(id);
    }
  };

  const toggleActive = (id: string, currentStatus: boolean) => {
    updateRecurringInvoice(id, { isActive: !currentStatus });
  };

  const handleGenerateInvoice = (recurringId: string) => {
    const issueDate = new Date().toISOString().split('T')[0];
    const invoice = generateInvoiceFromRecurring(recurringId, issueDate);
    if (invoice) {
      navigate(`/invoices/${invoice.id}`);
    } else {
      alert('Could not generate invoice. Please ensure the recurring invoice is active.');
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recurring Monthly Invoices</h1>
          <p className="text-gray-600 mt-2">Manage ongoing monthly charges for support, hosting, and maintenance</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2" size={20} />
          Add Recurring Invoice
        </Button>
      </div>

      {recurringInvoices.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <RefreshCw className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500 mb-4">No recurring invoices set up yet.</p>
              <Button onClick={() => handleOpenModal()}>
                <Plus className="mr-2" size={20} />
                Create First Recurring Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {recurringInvoices.map((recurring) => {
            const client = clients.find((c) => c.id === recurring.clientId);
            return (
              <Card key={recurring.id}>
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{client?.name || 'Unknown Client'}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          recurring.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {recurring.isActive ? 'Active' : 'Paused'}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {recurring.type}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-600">Monthly Amount</p>
                          <p className="text-xl font-bold text-primary-600">{formatCurrency(recurring.amount)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Billing Day</p>
                          <p className="text-lg font-medium text-gray-900">Day {recurring.dayOfMonth} of each month</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Start Date</p>
                          <p className="text-lg font-medium text-gray-900">{formatDate(recurring.startDate)}</p>
                        </div>
                      </div>

                      {recurring.items.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-2">Line Items:</p>
                          <ul className="space-y-1">
                            {recurring.items.map((item) => (
                              <li key={item.id} className="text-sm text-gray-600">
                                {item.description} - {item.quantity} × {formatCurrency(item.unitPrice)} = {formatCurrency(item.total)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {recurring.notes && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-600">{recurring.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleGenerateInvoice(recurring.id)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                        title="Generate Invoice"
                        disabled={!recurring.isActive}
                      >
                        <FileText size={18} />
                      </button>
                      <button
                        onClick={() => toggleActive(recurring.id, recurring.isActive)}
                        className={`p-2 rounded-lg ${
                          recurring.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={recurring.isActive ? 'Pause' : 'Activate'}
                      >
                        {recurring.isActive ? <Pause size={18} /> : <Play size={18} />}
                      </button>
                      <button
                        onClick={() => handleOpenModal(recurring)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(recurring.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRecurring ? 'Edit Recurring Invoice' : 'Add Recurring Invoice'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} {client.companyName ? `(${client.companyName})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as InvoiceType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="support">Monthly Support</option>
              <option value="hosting">Hosting</option>
              <option value="management">Management</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Billing Day of Month *"
              type="number"
              min="1"
              max="28"
              value={formData.dayOfMonth}
              onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
              required
            />
            <Input
              label="Start Date *"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={2}
              placeholder="Add any notes about this recurring invoice..."
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Line Items</h3>
              <Button type="button" onClick={addItem} size="sm">
                <Plus className="mr-1" size={14} />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-medium text-gray-700">Item {index + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Input
                      label="Description *"
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      placeholder="e.g., Monthly Support"
                      required
                    />

                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        label="Qty *"
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value))}
                        required
                      />
                      <Input
                        label="Price (£) *"
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value))}
                        required
                      />
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Total</label>
                        <div className="px-2 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-medium text-gray-900">
                          {formatCurrency(item.total)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-900">Monthly Total:</span>
                <span className="text-lg font-bold text-primary-600">{formatCurrency(subtotal)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {editingRecurring ? 'Update Recurring Invoice' : 'Create Recurring Invoice'}
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
