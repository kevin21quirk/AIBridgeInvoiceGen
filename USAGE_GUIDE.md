# AI Bridge Solutions - Invoice Management System
## User Guide

Welcome to your professional invoice management application! This guide will help you get started with managing clients, creating invoices, and tracking payments.

## 🚀 Getting Started

### Running the Application

1. **Install Dependencies** (first time only):
   ```bash
   npm install
   ```

2. **Start the Development Server**:
   ```bash
   npm run dev
   ```

3. **Open in Browser**:
   Navigate to `http://localhost:5173`

## 📋 Features Overview

### 1. Dashboard
- View key metrics: Total clients, invoices, revenue, and pending payments
- See recent invoices at a glance
- Get alerts for overdue invoices
- Quick navigation to all sections

### 2. Client Management

#### Adding a New Client
1. Navigate to **Clients** from the sidebar
2. Click **Add Client** button
3. Fill in the client details:
   - Client Name (required)
   - Email (required)
   - Phone (required)
   - Address details (required)
4. Click **Add Client** to save

#### Managing Clients
- **Edit**: Click the edit icon on any client card
- **Delete**: Click the trash icon (confirms before deletion)
- **View Details**: All client information is displayed on their card

### 3. Invoice Management

#### Creating an Invoice
1. Navigate to **Invoices** from the sidebar
2. Click **Create Invoice**
3. Fill in the invoice details:
   - **Client**: Select from your existing clients
   - **Invoice Type**: Choose from:
     - Work Carried Out
     - Monthly Support
     - Hosting
     - Management
     - Other
   - **Issue Date**: Date the invoice is created
   - **Due Date**: Payment deadline (defaults to 30 days)
   - **Notes**: Optional payment instructions or additional information

4. Add line items:
   - **Description**: What you're charging for
   - **Quantity**: Number of units
   - **Unit Price**: Price per unit
   - Total is calculated automatically

5. Click **Create Invoice**

#### Viewing Invoices
- **Filter by Status**: Use the filter buttons to view:
  - All invoices
  - Draft
  - Sent
  - Viewed
  - Overdue
  - Paid
  - Cancelled

- **View Invoice Details**: Click the eye icon to see full invoice
- **Edit Invoice**: Click the edit icon (for draft invoices)

#### Invoice Actions
When viewing an invoice, you can:
- **Print**: Print the invoice directly
- **Download PDF**: Save as PDF for emailing to clients
- **Mark as Sent**: Update status when sent to client
- **Mark as Paid**: Update status when payment received

### 4. Receipt Management

#### Creating a Receipt
1. Navigate to **Receipts** from the sidebar
2. Click **Create Receipt**
3. Fill in the receipt details:
   - **Invoice**: Select the invoice being paid
   - **Amount**: Payment amount (auto-fills with invoice total)
   - **Payment Method**: Bank Transfer, Cash, Cheque, Card, or Other
   - **Payment Date**: When payment was received
   - **Notes**: Optional additional information

4. Click **Create Receipt**

**Note**: Creating a receipt automatically marks the invoice as "Paid"

#### Viewing Receipts
- View all receipts in a table format
- See receipt number, invoice number, client, amount, payment method, and date
- Receipts are sorted by creation date (newest first)

## 💼 Company Information

Your company details are pre-configured:
- **Company Name**: AI BRIDGE SOLUTIONS LIMITED
- **Company Number**: 15999929
- **Bank Account**: 20688237
- **Sort Code**: 04-29-09
- **VAT Status**: Not VAT Registered

These details appear automatically on all invoices.

## 📊 Invoice Workflow

### Typical Invoice Lifecycle:
1. **Draft** → Create invoice, review details
2. **Sent** → Mark as sent when emailed to client
3. **Viewed** → (Optional) Track when client opens invoice
4. **Paid** → Mark as paid when payment received
5. **Receipt** → Create receipt to document payment

### Overdue Invoices:
- Invoices automatically show as "Overdue" when past due date and unpaid
- Dashboard alerts you to overdue invoices

## 💾 Data Storage

- All data is stored locally in your browser using **localStorage**
- Data persists between sessions
- **Important**: Clearing browser data will delete all invoices and clients
- Consider exporting important invoices as PDFs regularly

## 🎨 Professional Invoice Design

Your invoices include:
- Company branding and logo area
- Professional layout with clear sections
- Client billing information
- Itemized line items with calculations
- Payment details (bank account, sort code)
- Custom notes section
- Professional footer

## 📱 Tips & Best Practices

### For Clients:
1. Add all client details accurately for professional invoices
2. Keep client information up to date
3. Use consistent naming conventions

### For Invoices:
1. Use descriptive line item descriptions
2. Set realistic due dates (default is 30 days)
3. Add payment instructions in the notes section
4. Download PDFs before sending to clients
5. Mark invoices as "Sent" to track status

### For Payments:
1. Create receipts promptly when payments are received
2. Use the correct payment method for tracking
3. Add reference numbers in receipt notes

## 🔧 Customization

### To Update Company Details:
Edit the file: `src/lib/constants.ts`

```typescript
export const COMPANY_DETAILS: CompanyDetails = {
  name: 'AI BRIDGE SOLUTIONS LIMITED',
  companyNumber: '15999929',
  bankAccount: '20688237',
  sortCode: '04-29-09',
  vatRegistered: false,
  logo: '/Logos/Asset 1@4000x.png',
  address: {
    line1: 'Your Address Line 1',
    city: 'Your City',
    postcode: 'Your Postcode',
    country: 'United Kingdom',
  },
};
```

### To Change Payment Terms:
Edit `PAYMENT_TERMS_DAYS` in `src/lib/constants.ts` (default: 30 days)

## 🆘 Troubleshooting

### Invoice Not Showing?
- Check the status filter - you might be filtering it out
- Refresh the page to reload data

### Can't Create Invoice?
- Ensure you have at least one client created
- All required fields must be filled
- Line items must have valid quantities and prices

### PDF Download Not Working?
- Ensure you're viewing the invoice (not the list)
- Try using the Print function as an alternative
- Check browser console for errors

## 📈 Future Enhancements

Potential features for future development:
- Email integration to send invoices directly
- Recurring invoices for monthly services
- Multi-currency support
- Tax/VAT calculations
- Client portal for viewing invoices
- Payment reminders
- Reporting and analytics
- Data export/import

## 🔐 Security Notes

- This is a client-side application - data stays on your computer
- No data is sent to external servers
- For production use, consider adding authentication
- Regular backups recommended (export PDFs)

## 📞 Support

For issues or questions about the application:
- Review this guide
- Check the README.md file
- Inspect browser console for errors

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Built for**: AI Bridge Solutions Limited
