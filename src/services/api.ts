import { Client, Invoice, Receipt, RecurringInvoice } from '@/types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Clients
  getClients: () => request<Client[]>('/clients'),
  createClient: (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) =>
    request<Client>('/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id: string, data: Partial<Client>) =>
    request<Client>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClient: (id: string) =>
    request<{ success: boolean }>(`/clients/${id}`, { method: 'DELETE' }),

  // Invoices
  getInvoices: () => request<Invoice[]>('/invoices'),
  createInvoice: (data: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'subtotal' | 'total'>) =>
    request<Invoice>('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  updateInvoice: (id: string, data: Partial<Invoice>) =>
    request<Invoice>(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInvoice: (id: string) =>
    request<{ success: boolean }>(`/invoices/${id}`, { method: 'DELETE' }),
  updateInvoiceStatus: (id: string, status: string) =>
    request<Invoice>(`/invoices/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateUpfrontPayment: (id: string, paid: boolean) =>
    request<Invoice>(`/invoices/${id}/upfront-payment`, { method: 'PATCH', body: JSON.stringify({ paid }) }),

  // Receipts
  getReceipts: () => request<Receipt[]>('/receipts'),
  createReceipt: (data: Omit<Receipt, 'id' | 'receiptNumber' | 'createdAt' | 'updatedAt'>) =>
    request<Receipt>('/receipts', { method: 'POST', body: JSON.stringify(data) }),
  deleteReceipt: (id: string) =>
    request<{ success: boolean }>(`/receipts/${id}`, { method: 'DELETE' }),

  // Recurring invoices
  getRecurringInvoices: () => request<RecurringInvoice[]>('/recurring-invoices'),
  createRecurringInvoice: (data: Omit<RecurringInvoice, 'id' | 'createdAt' | 'updatedAt'>) =>
    request<RecurringInvoice>('/recurring-invoices', { method: 'POST', body: JSON.stringify(data) }),
  updateRecurringInvoice: (id: string, data: Partial<RecurringInvoice>) =>
    request<RecurringInvoice>(`/recurring-invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRecurringInvoice: (id: string) =>
    request<{ success: boolean }>(`/recurring-invoices/${id}`, { method: 'DELETE' }),
  generateInvoiceFromRecurring: (id: string, issueDate: string) =>
    request<Invoice>(`/recurring-invoices/${id}/generate`, { method: 'POST', body: JSON.stringify({ issueDate }) }),

  // Email
  sendInvoiceEmail: (id: string) =>
    request<{ success: boolean; message: string }>(`/invoices/${id}/send-email`, { method: 'POST' }),
  sendReceiptEmail: (id: string) =>
    request<{ success: boolean; message: string }>(`/receipts/${id}/send-email`, { method: 'POST' }),
};
