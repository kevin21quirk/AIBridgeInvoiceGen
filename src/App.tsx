import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Clients } from '@/pages/Clients';
import { Invoices } from '@/pages/Invoices';
import { CreateInvoice } from '@/pages/CreateInvoice';
import { ViewInvoice } from '@/pages/ViewInvoice';
import { EditInvoice } from '@/pages/EditInvoice';
import { RecurringInvoices } from '@/pages/RecurringInvoices';
import { OutstandingPayments } from '@/pages/OutstandingPayments';
import { Receipts } from '@/pages/Receipts';
import { ViewReceipt } from '@/pages/ViewReceipt';
import { Settings } from '@/pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/create" element={<CreateInvoice />} />
          <Route path="/invoices/:id/edit" element={<EditInvoice />} />
          <Route path="/invoices/:id" element={<ViewInvoice />} />
          <Route path="/recurring-invoices" element={<RecurringInvoices />} />
          <Route path="/outstanding-payments" element={<OutstandingPayments />} />
          <Route path="/receipts" element={<Receipts />} />
          <Route path="/receipts/:id" element={<ViewReceipt />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
