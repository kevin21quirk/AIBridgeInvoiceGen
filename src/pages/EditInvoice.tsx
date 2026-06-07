import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useStore } from '@/store/useStore';
import { InvoiceItem, InvoiceType, PaymentStatus } from '@/types';
import { generateId, formatCurrency } from '@/lib/utils';

export const EditInvoice: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clients, getInvoice, updateInvoice } = useStore();
  
  const invoice = id ? getInvoice(id) : undefined;

  const [formData, setFormData] = useState({
    clientId: '',
    type: 'work' as InvoiceType,
    issueDate: '',
    dueDate: '',
    notes: '',
    status: 'draft' as PaymentStatus,
    requiresUpfrontPayment: false,
    upfrontPaymentPaid: false,
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

  useEffect(() => {
    if (invoice) {
      setFormData({
        clientId: invoice.clientId,
        type: invoice.type,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        notes: invoice.notes || '',
        status: invoice.status,
        requiresUpfrontPayment: invoice.requiresUpfrontPayment,
        upfrontPaymentPaid: invoice.upfrontPaymentPaid,
      });
      setItems(invoice.items);
    }
  }, [invoice]);

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

    if (!id) return;

    updateInvoice(id, {
      clientId: formData.clientId,
      type: formData.type,
      items: items,
      status: formData.status,
      issueDate: formData.issueDate,
      dueDate: formData.dueDate,
      notes: formData.notes || undefined,
      requiresUpfrontPayment: formData.requiresUpfrontPayment,
      upfrontPaymentPaid: formData.requiresUpfrontPayment ? formData.upfrontPaymentPaid : false,
    });

    navigate(`/invoices/${id}`);
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div>
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate(`/invoices/${id}`)} className="mb-4">
          <ArrowLeft className="mr-2" size={20} />
          Back to Invoice
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Invoice {invoice.invoiceNumber}</h1>
        <p className="text-gray-600 mt-2">Update invoice details and line items</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Invoice Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client *
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as InvoiceType })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      <option value="work">Work Carried Out</option>
                      <option value="support">Monthly Support</option>
                      <option value="hosting">Hosting</option>
                      <option value="management">Management</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Issue Date *"
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                      required
                    />
                    <Input
                      label="Due Date *"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows={3}
                      placeholder="Add any additional notes or payment instructions..."
                    />
                  </div>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="upfrontPayment"
                      checked={formData.requiresUpfrontPayment}
                      onChange={(e) => setFormData({ ...formData, requiresUpfrontPayment: e.target.checked, upfrontPaymentPaid: false })}
                      className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="upfrontPayment" className="ml-2 block text-sm text-gray-700">
                      <span className="font-medium">Require 50% upfront payment</span>
                      <p className="text-gray-500 text-xs mt-1">
                        This will note on the invoice that 50% payment is required upfront before work begins
                      </p>
                    </label>
                  </div>

                  {formData.requiresUpfrontPayment && (
                    <div className="ml-6 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="upfrontPaymentPaid"
                          checked={formData.upfrontPaymentPaid}
                          onChange={(e) => setFormData({ ...formData, upfrontPaymentPaid: e.target.checked })}
                          className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="upfrontPaymentPaid" className="ml-2 block text-sm text-gray-700">
                          <span className="font-medium">Upfront payment has been received</span>
                          <p className="text-gray-500 text-xs mt-1">
                            Check this if the client has already paid the 50% deposit
                          </p>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Line Items</h2>
                  <Button type="button" onClick={addItem} size="sm">
                    <Plus className="mr-2" size={16} />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={item.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-700">Item {index + 1}</h3>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Input
                          label="Description *"
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          placeholder="e.g., Website Development"
                          required
                        />

                        <div className="grid grid-cols-3 gap-3">
                          <Input
                            label="Quantity *"
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value))}
                            required
                          />
                          <Input
                            label="Unit Price (£) *"
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value))}
                            required
                          />
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Total
                            </label>
                            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-900">
                              {formatCurrency(item.total)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-8">
              <CardContent>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="text-base font-semibold text-gray-900">Total:</span>
                    <span className="text-base font-bold text-primary-600">{formatCurrency(subtotal)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button type="submit" className="w-full">
                    Update Invoice
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(`/invoices/${id}`)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};
