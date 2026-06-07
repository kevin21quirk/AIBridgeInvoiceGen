import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { COMPANY_DETAILS } from '@/lib/constants';

export const Settings: React.FC = () => {
  const [formData, setFormData] = useState({
    name: COMPANY_DETAILS.name,
    companyNumber: COMPANY_DETAILS.companyNumber,
    bankAccount: COMPANY_DETAILS.bankAccount,
    sortCode: COMPANY_DETAILS.sortCode,
    website: COMPANY_DETAILS.website,
    email: COMPANY_DETAILS.email,
    phone: COMPANY_DETAILS.phone,
    addressLine1: COMPANY_DETAILS.address.line1,
    addressLine2: COMPANY_DETAILS.address.line2 || '',
    city: COMPANY_DETAILS.address.city,
    postcode: COMPANY_DETAILS.address.postcode,
    country: COMPANY_DETAILS.address.country,
  });

  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Note: In a real application, this would update the company details in a database
    // For now, this is just a UI demonstration as the constants are static
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    
    alert('Settings saved! Note: To permanently update company details, please edit src/lib/constants.ts');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your company information and preferences</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  label="Company Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />

                <Input
                  label="Company Registration Number"
                  value={formData.companyNumber}
                  onChange={(e) => setFormData({ ...formData, companyNumber: e.target.value })}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://example.com"
                    required
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="support@example.com"
                    required
                  />

                  <Input
                    label="Phone Number"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+44 1234 567890"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Company Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  label="Address Line 1"
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  required
                />

                <Input
                  label="Address Line 2 (Optional)"
                  value={formData.addressLine2}
                  onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />

                  <Input
                    label="Postcode"
                    value={formData.postcode}
                    onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                    required
                  />

                  <Input
                    label="Country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bank Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Bank Account Number"
                    value={formData.bankAccount}
                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                    required
                  />

                  <Input
                    label="Sort Code"
                    value={formData.sortCode}
                    onChange={(e) => setFormData({ ...formData, sortCode: e.target.value })}
                    placeholder="00-00-00"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            {saved && (
              <div className="flex items-center text-green-600 text-sm font-medium">
                ✓ Settings saved successfully
              </div>
            )}
            <Button type="submit">
              <Save className="mr-2" size={18} />
              Save Settings
            </Button>
          </div>
        </div>
      </form>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Developer Note</h3>
        <p className="text-sm text-blue-800">
          Company details are currently stored in <code className="bg-blue-100 px-1 py-0.5 rounded">src/lib/constants.ts</code>. 
          To permanently update these values, please edit that file directly. In a production environment, 
          these settings would be stored in a database and updated through this interface.
        </p>
      </div>
    </div>
  );
};
