import { create } from 'zustand';
import { Client, Invoice, Receipt, RecurringInvoice, InvoiceItem, PaymentStatus } from '@/types';
import { api } from '@/services/api';

interface Store {
  clients: Client[];
  invoices: Invoice[];
  receipts: Receipt[];
  recurringInvoices: RecurringInvoice[];
  isLoading: boolean;

  loadData: () => Promise<void>;

  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Client>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  getClient: (id: string) => Client | undefined;

  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'subtotal' | 'total'>) => Promise<Invoice>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  getInvoice: (id: string) => Invoice | undefined;
  updateInvoiceStatus: (id: string, status: PaymentStatus) => Promise<void>;
  updateUpfrontPaymentStatus: (id: string, paid: boolean) => Promise<void>;

  addRecurringInvoice: (recurring: Omit<RecurringInvoice, 'id' | 'createdAt' | 'updatedAt'>) => Promise<RecurringInvoice>;
  updateRecurringInvoice: (id: string, recurring: Partial<RecurringInvoice>) => Promise<void>;
  deleteRecurringInvoice: (id: string) => Promise<void>;
  getRecurringInvoice: (id: string) => RecurringInvoice | undefined;
  generateInvoiceFromRecurring: (recurringId: string, issueDate: string) => Promise<Invoice | null>;

  addReceipt: (receipt: Omit<Receipt, 'id' | 'receiptNumber' | 'createdAt' | 'updatedAt'>) => Promise<Receipt>;
  deleteReceipt: (id: string) => Promise<void>;
  getReceiptsByInvoice: (invoiceId: string) => Receipt[];

  calculateInvoiceTotals: (items: InvoiceItem[]) => { subtotal: number; total: number };
}

export const useStore = create<Store>()((set, get) => ({
  clients: [],
  invoices: [],
  receipts: [],
  recurringInvoices: [],
  isLoading: false,

  loadData: async () => {
    set({ isLoading: true });
    try {
      const [clients, invoices, receipts, recurringInvoices] = await Promise.all([
        api.getClients(),
        api.getInvoices(),
        api.getReceipts(),
        api.getRecurringInvoices(),
      ]);
      set({ clients, invoices, receipts, recurringInvoices });
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  // ─── Clients ───────────────────────────────────────────────────────────────

  addClient: async (clientData) => {
    const client = await api.createClient(clientData);
    set((state) => ({ clients: [client, ...state.clients] }));
    return client;
  },

  updateClient: async (id, updates) => {
    const client = await api.updateClient(id, updates);
    set((state) => ({
      clients: state.clients.map((c) => (c.id === id ? client : c)),
    }));
  },

  deleteClient: async (id) => {
    await api.deleteClient(id);
    set((state) => ({ clients: state.clients.filter((c) => c.id !== id) }));
  },

  getClient: (id) => get().clients.find((c) => c.id === id),

  // ─── Invoices ──────────────────────────────────────────────────────────────

  addInvoice: async (invoiceData) => {
    const invoice = await api.createInvoice(invoiceData);
    set((state) => ({ invoices: [invoice, ...state.invoices] }));
    return invoice;
  },

  updateInvoice: async (id, updates) => {
    const invoice = await api.updateInvoice(id, updates);
    set((state) => ({
      invoices: state.invoices.map((inv) => (inv.id === id ? invoice : inv)),
    }));
  },

  deleteInvoice: async (id) => {
    await api.deleteInvoice(id);
    set((state) => ({ invoices: state.invoices.filter((inv) => inv.id !== id) }));
  },

  getInvoice: (id) => {
    const invoice = get().invoices.find((inv) => inv.id === id);
    if (invoice) {
      const client = get().getClient(invoice.clientId);
      return { ...invoice, client };
    }
    return undefined;
  },

  updateInvoiceStatus: async (id, status) => {
    const invoice = await api.updateInvoiceStatus(id, status);
    set((state) => ({
      invoices: state.invoices.map((inv) => (inv.id === id ? invoice : inv)),
    }));
    if (status === 'paid') {
      const receipts = await api.getReceipts();
      set({ receipts });
    }
  },

  updateUpfrontPaymentStatus: async (id, paid) => {
    const invoice = await api.updateUpfrontPayment(id, paid);
    set((state) => ({
      invoices: state.invoices.map((inv) => (inv.id === id ? invoice : inv)),
    }));
  },

  // ─── Recurring Invoices ────────────────────────────────────────────────────

  addRecurringInvoice: async (recurringData) => {
    const recurring = await api.createRecurringInvoice(recurringData);
    set((state) => ({ recurringInvoices: [recurring, ...state.recurringInvoices] }));
    return recurring;
  },

  updateRecurringInvoice: async (id, updates) => {
    const recurring = await api.updateRecurringInvoice(id, updates);
    set((state) => ({
      recurringInvoices: state.recurringInvoices.map((r) => (r.id === id ? recurring : r)),
    }));
  },

  deleteRecurringInvoice: async (id) => {
    await api.deleteRecurringInvoice(id);
    set((state) => ({ recurringInvoices: state.recurringInvoices.filter((r) => r.id !== id) }));
  },

  getRecurringInvoice: (id) => get().recurringInvoices.find((r) => r.id === id),

  generateInvoiceFromRecurring: async (recurringId, issueDate) => {
    try {
      const invoice = await api.generateInvoiceFromRecurring(recurringId, issueDate);
      set((state) => ({ invoices: [invoice, ...state.invoices] }));
      return invoice;
    } catch {
      return null;
    }
  },

  // ─── Receipts ──────────────────────────────────────────────────────────────

  addReceipt: async (receiptData) => {
    const receipt = await api.createReceipt(receiptData);
    set((state) => ({ receipts: [receipt, ...state.receipts] }));
    const invoices = await api.getInvoices();
    set({ invoices });
    return receipt;
  },

  deleteReceipt: async (id) => {
    await api.deleteReceipt(id);
    set((state) => ({ receipts: state.receipts.filter((r) => r.id !== id) }));
  },

  getReceiptsByInvoice: (invoiceId) =>
    get().receipts.filter((r) => r.invoiceId === invoiceId),

  // ─── Utils ─────────────────────────────────────────────────────────────────

  calculateInvoiceTotals: (items: InvoiceItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    return { subtotal, total: subtotal };
  },
}));
