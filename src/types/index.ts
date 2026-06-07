export interface Client {
  id: string;
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type InvoiceType = 'work' | 'support' | 'hosting' | 'management' | 'other';

export type PaymentStatus = 'draft' | 'sent' | 'viewed' | 'overdue' | 'paid' | 'cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client?: Client;
  type: InvoiceType;
  items: InvoiceItem[];
  subtotal: number;
  total: number;
  status: PaymentStatus;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  notes?: string;
  requiresUpfrontPayment: boolean;
  upfrontPaymentAmount?: number;
  upfrontPaymentPaid: boolean;
  upfrontPaymentDate?: string;
  recurringInvoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringInvoice {
  id: string;
  clientId: string;
  client?: Client;
  type: InvoiceType;
  items: InvoiceItem[];
  amount: number;
  dayOfMonth: number;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  invoiceId: string;
  invoice?: Invoice;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyDetails {
  name: string;
  companyNumber: string;
  bankAccount: string;
  sortCode: string;
  vatRegistered: boolean;
  logo: string;
  website: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    country: string;
  };
}
