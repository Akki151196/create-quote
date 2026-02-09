import { useEffect, useState } from 'react';
import { Plus, X, Save, IndianRupee } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AdminLayout } from '../components/AdminLayout';

interface Payment {
  id: string;
  quotation_id: string;
  amount: number;
  payment_type: string;
  payment_method: string;
  payment_status: string;
  payment_date: string | null;
  notes: string | null;
  transaction_reference: string | null;
  quotations: {
    quotation_number: string;
    client_name: string;
    grand_total: number;
  };
}

interface Quotation {
  id: string;
  quotation_number: string;
  client_name: string;
  grand_total: number;
}

export function Payments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    quotation_id: '',
    amount: 0,
    payment_type: 'advance',
    payment_method: 'cash',
    payment_status: 'completed',
    payment_date: new Date().toISOString().split('T')[0],
    transaction_reference: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [paymentsRes, quotationsRes] = await Promise.all([
        supabase
          .from('payments')
          .select('*, quotations(quotation_number, client_name, grand_total)')
          .order('created_at', { ascending: false }),
        supabase
          .from('quotations')
          .select('id, quotation_number, client_name, grand_total')
          .in('status', ['sent', 'accepted'])
          .order('created_at', { ascending: false }),
      ]);

      if (paymentsRes.data) setPayments(paymentsRes.data as any);
      if (quotationsRes.data) setQuotations(quotationsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setFormData({
      quotation_id: '',
      amount: 0,
      payment_type: 'advance',
      payment_method: 'cash',
      payment_status: 'completed',
      payment_date: new Date().toISOString().split('T')[0],
      transaction_reference: '',
      notes: '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSave = async () => {
    if (!user || !formData.quotation_id || !formData.amount) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase.from('payments').insert({
        quotation_id: formData.quotation_id,
        amount: formData.amount,
        payment_type: formData.payment_type,
        payment_method: formData.payment_method,
        payment_status: formData.payment_status,
        payment_date: formData.payment_date || null,
        transaction_reference: formData.transaction_reference || null,
        notes: formData.notes || null,
        created_by: user.id,
      });

      if (error) throw error;

      alert('Payment recorded successfully!');
      closeModal();
      loadData();
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Failed to record payment');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      refunded: 'bg-gray-100 text-gray-700',
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getPaymentTypeBadge = (type: string) => {
    const badges = {
      advance: 'bg-blue-100 text-blue-700',
      partial: 'bg-purple-100 text-purple-700',
      full: 'bg-green-100 text-green-700',
      refund: 'bg-red-100 text-red-700',
    };
    return badges[type as keyof typeof badges] || badges.advance;
  };

  if (loading) {
    return (
      <AdminLayout title="Payments" showHomeButton>
        <div className="flex items-center justify-center h-full">
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Payments" showHomeButton>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">Track and manage payments for quotations</p>
          <button
            onClick={openModal}
            className="flex items-center gap-2 bg-maroon-700 text-white px-4 py-2 rounded-lg hover:bg-maroon-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quotation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No payments recorded yet
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.quotations.quotation_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {payment.quotations.client_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ₹{payment.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentTypeBadge(payment.payment_type)}`}>
                        {payment.payment_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                      {payment.payment_method.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(payment.payment_status)}`}>
                        {payment.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {payment.payment_date
                        ? new Date(payment.payment_date).toLocaleDateString()
                        : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
              <div className="bg-maroon-700 text-white px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Record Payment</h2>
                <button onClick={closeModal} className="text-white hover:text-maroon-200">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quotation *
                    </label>
                    <select
                      value={formData.quotation_id}
                      onChange={(e) => setFormData({ ...formData, quotation_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                    >
                      <option value="">Select Quotation</option>
                      {quotations.map((quote) => (
                        <option key={quote.id} value={quote.id}>
                          {quote.quotation_number} - {quote.client_name} (₹{quote.grand_total.toLocaleString('en-IN')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount (₹) *
                      </label>
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Type *
                      </label>
                      <select
                        value={formData.payment_type}
                        onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                      >
                        <option value="advance">Advance</option>
                        <option value="partial">Partial</option>
                        <option value="full">Full</option>
                        <option value="refund">Refund</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method *
                      </label>
                      <select
                        value={formData.payment_method}
                        onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="upi">UPI</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="razorpay">Razorpay</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Status *
                      </label>
                      <select
                        value={formData.payment_status}
                        onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Date
                      </label>
                      <input
                        type="date"
                        value={formData.payment_date}
                        onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transaction Reference
                      </label>
                      <input
                        type="text"
                        value={formData.transaction_reference}
                        onChange={(e) => setFormData({ ...formData, transaction_reference: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                        placeholder="Transaction ID"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                      placeholder="Payment notes"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 bg-maroon-700 text-white px-6 py-2 rounded-lg hover:bg-maroon-800 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
