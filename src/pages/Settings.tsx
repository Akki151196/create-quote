import { useState } from 'react';
import { Save, Building, Mail, Phone, MapPin, FileText } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';

export function Settings() {
  const [formData, setFormData] = useState({
    businessName: 'The Royal Catering Service & Events',
    email: 'info@royalcatering.com',
    phone: '+91 98765 43210',
    address: '123 Main Street, New Delhi, India',
    gstNumber: '',
    defaultTax: 18,
    defaultTerms: 'Payment terms: 50% advance at booking, 50% before event. Cancellation policy: Non-refundable after 7 days of booking.',
  });

  const handleSave = () => {
    alert('Settings saved successfully! (Note: Actual saving functionality will be implemented)');
  };

  return (
    <AdminLayout title="Settings" showHomeButton>
      <div className="max-w-4xl mx-auto">
        <p className="text-gray-600 mb-6">Configure your business settings and preferences</p>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-maroon-700 text-white px-6 py-4">
            <h2 className="text-xl font-bold">Business Information</h2>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Building className="w-4 h-4" />
                Business Name
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4" />
                Business Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4" />
                GST Number
              </label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                placeholder="e.g., 22AAAAA0000A1Z5"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden mt-6">
          <div className="bg-maroon-700 text-white px-6 py-4">
            <h2 className="text-xl font-bold">Default Settings</h2>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Tax Rate (%)
              </label>
              <input
                type="number"
                value={formData.defaultTax}
                onChange={(e) =>
                  setFormData({ ...formData, defaultTax: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                min="0"
                max="100"
                step="0.1"
              />
              <p className="text-sm text-gray-500 mt-1">
                This will be used as the default tax rate for new quotations
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Terms & Conditions
              </label>
              <textarea
                value={formData.defaultTerms}
                onChange={(e) => setFormData({ ...formData, defaultTerms: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
              />
              <p className="text-sm text-gray-500 mt-1">
                These terms will be automatically added to new quotations
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-maroon-700 text-white px-8 py-3 rounded-lg hover:bg-maroon-800 transition-colors"
          >
            <Save className="w-5 h-5" />
            Save Settings
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
          <h3 className="font-bold text-blue-900 mb-2">About Razorpay Integration</h3>
          <p className="text-blue-800 text-sm mb-3">
            To enable online payment collection through Razorpay, you need to configure your Razorpay
            API keys. This will allow your clients to pay directly through secure payment links.
          </p>
          <div className="space-y-2 text-sm text-blue-700">
            <p>1. Sign up for a Razorpay account at razorpay.com</p>
            <p>2. Get your API keys from the Razorpay Dashboard</p>
            <p>3. Contact your developer to configure the keys securely</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
