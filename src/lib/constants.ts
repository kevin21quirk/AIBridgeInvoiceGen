import { CompanyDetails } from '@/types';

export const COMPANY_DETAILS: CompanyDetails = {
  name: 'AI BRIDGE SOLUTIONS LIMITED',
  companyNumber: '15999929',
  bankAccount: '20688237',
  sortCode: '04-29-09',
  vatRegistered: false,
  logo: '/Logos/Asset 2@4000x.png',
  website: 'https://aibridgesolutions.co.uk',
  email: 'support@aibridgesolutions.co.uk',
  phone: '+44 7359 969266',
  address: {
    line1: '77 Church Street',
    line2: 'Burton Latimer',
    city: 'Northamptonshire',
    postcode: 'NN15 5LU',
    country: 'United Kingdom',
  },
};

export const PAYMENT_TERMS_DAYS = 30;

export const INVOICE_PREFIX = 'INV';
export const RECEIPT_PREFIX = 'REC';
