import { useEffect, useState } from 'react';
import { X, Calendar, MapPin, Users, Download, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateQuotationPDF } from '../utils/pdfGenerator';
import { useAuth } from '../contexts/AuthContext';

interface QuotationItem {
  id: string;
  item_type: string;
  item_name: string;
  description: string | null;
  unit_price: number;
  quantity: number;
  total: number;
}

interface Quotation {
  id: string;
  quotation_number: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  event_date: string;
  service_date: string | null;
  event_type: string;
  event_venue: string | null;
  number_of_guests: number;
  subtotal: number;
  service_charges: number;
  external_charges: number;
  tax_percentage: number;
  tax_amount: number;
  discount_percentage: number;
  discount_amount: number;
  grand_total: number;
  status: string;
  terms_and_conditions: string | null;
  validity_days: number;
  remarks: string | null;
  advance_paid: number;
  balance_due: number;
  payment_status: string;
}

interface QuotationPreviewModalProps {
  quotationId: string;
  onClose: () => void;
  onStatusChange?: () => void;
}

export function QuotationPreviewModal({ quotationId, onClose, onStatusChange }: QuotationPreviewModalProps) {
  const { user } = useAuth();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadQuotation();
  }, [quotationId]);

  const loadQuotation = async () => {
    try {
      const { data: quotationData, error: quotationError } = await supabase
        .from('quotations')
        .select('*')
        .eq('id', quotationId)
        .single();

      if (quotationError) throw quotationError;
      setQuotation(quotationData);

      const { data: itemsData, error: itemsError } = await supabase
        .from('quotation_items')
        .select('*')
        .eq('quotation_id', quotationId)
        .order('sort_order');

      if (itemsError) throw itemsError;
      setItems(itemsData || []);
    } catch (error) {
      console.error('Error loading quotation:', error);
      alert('Failed to load quotation');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!quotation) return;
    try {
      await generateQuotationPDF({
        ...quotation,
        items,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF');
    }
  };

  const handleAccept = async () => {
    if (!quotation || !user) return;

    if (!confirm('Accept this quotation? This will automatically create a calendar event and expense tracking entry.')) {
      return;
    }

    setProcessing(true);
    try {
      const { error: updateError } = await supabase
        .from('quotations')
        .update({ status: 'accepted' })
        .eq('id', quotationId);

      if (updateError) throw updateError;

      const { data: eventData, error: eventError } = await supabase
        .from('calendar_events')
        .insert({
          quotation_id: quotationId,
          event_name: `${quotation.event_type} - ${quotation.client_name}`,
          event_date: quotation.event_date,
          event_type: quotation.event_type,
          client_name: quotation.client_name,
          client_phone: quotation.client_phone,
          venue: quotation.event_venue || '',
          guest_count: quotation.number_of_guests,
          total_revenue: quotation.grand_total,
          status: 'Confirmed',
          created_by: user.id,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      const { error: expenseError } = await supabase
        .from('event_expenses')
        .insert({
          event_id: eventData.id,
          quotation_id: quotationId,
          total_expenses: 0,
          profit: quotation.grand_total,
          profit_percentage: 100,
          status: 'Pending',
          created_by: user.id,
        });

      if (expenseError) throw expenseError;

      alert('Quotation accepted! Calendar event and expense tracking entry created successfully.');
      onStatusChange?.();
      onClose();
    } catch (error) {
      console.error('Error accepting quotation:', error);
      alert('Failed to accept quotation. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!quotation) return;

    if (!confirm('Reject this quotation?')) {
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('quotations')
        .update({ status: 'rejected' })
        .eq('id', quotationId);

      if (error) throw error;

      alert('Quotation rejected successfully.');
      onStatusChange?.();
      onClose();
    } catch (error) {
      console.error('Error rejecting quotation:', error);
      alert('Failed to reject quotation. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="text-xl text-gray-600">Loading quotation...</div>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return null;
  }

  const menuItems = items.filter(item => item.item_type === 'menu_item');
  const services = items.filter(item => item.item_type === 'service');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-maroon-800 to-maroon-950 text-white p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold">Quotation Preview</h2>
              <p className="text-maroon-200 text-sm mt-1">{quotation.quotation_number}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-maroon-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {quotation.status !== 'accepted' && quotation.status !== 'rejected' && (
              <>
                <button
                  onClick={handleAccept}
                  disabled={processing}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {processing ? 'Processing...' : 'Accept Quotation'}
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </>
            )}
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 bg-white text-maroon-800 px-4 py-2 rounded-lg hover:bg-maroon-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>

        <div className="p-8">
          <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-maroon-100 to-maroon-50 p-6">
              <h3 className="text-2xl font-bold text-maroon-900 mb-4">Quotation Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-maroon-800 mb-2">Client Information</h4>
                  <div className="space-y-1 text-gray-700">
                    <p className="font-medium text-lg">{quotation.client_name}</p>
                    <p>{quotation.client_phone}</p>
                    {quotation.client_email && <p>{quotation.client_email}</p>}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-maroon-800 mb-2">Event Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4 text-maroon-600" />
                      <span>{new Date(quotation.event_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}</span>
                    </div>
                    {quotation.event_venue && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="w-4 h-4 text-maroon-600" />
                        <span>{quotation.event_venue}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-700">
                      <Users className="w-4 h-4 text-maroon-600" />
                      <span>{quotation.number_of_guests} Guests</span>
                    </div>
                    <p className="text-gray-700">
                      <span className="font-medium">Type:</span> {quotation.event_type}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {menuItems.length > 0 && (
              <div className="p-6 border-b border-gray-200">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Menu Items</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Item</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Unit Price</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Qty</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {menuItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.item_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.description || '-'}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">
                            ₹{item.unit_price.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                            ₹{item.total.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {services.length > 0 && (
              <div className="p-6 border-b border-gray-200">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Services</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Service</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Unit Price</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Qty</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {services.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.item_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.description || '-'}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">
                            ₹{item.unit_price.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                            ₹{item.total.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="p-6 bg-gray-50">
              <div className="max-w-md ml-auto space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span className="font-medium">₹{quotation.subtotal.toLocaleString('en-IN')}</span>
                </div>

                {quotation.service_charges > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Service Charges:</span>
                    <span className="font-medium">₹{quotation.service_charges.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {quotation.external_charges > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>External Charges:</span>
                    <span className="font-medium">₹{quotation.external_charges.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {quotation.discount_percentage > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({quotation.discount_percentage}%):</span>
                    <span className="font-medium">-₹{quotation.discount_amount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-700">
                  <span>Tax ({quotation.tax_percentage}%):</span>
                  <span className="font-medium">₹{quotation.tax_amount.toLocaleString('en-IN')}</span>
                </div>

                <div className="pt-3 border-t-2 border-gray-300">
                  <div className="flex justify-between text-xl font-bold text-maroon-800">
                    <span>Grand Total:</span>
                    <span>₹{quotation.grand_total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {quotation.advance_paid > 0 && (
                  <>
                    <div className="flex justify-between text-green-600 mt-3">
                      <span>Advance Paid:</span>
                      <span className="font-medium">₹{quotation.advance_paid.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span className="font-semibold">Balance Due:</span>
                      <span className="font-semibold">₹{quotation.balance_due.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-700">Payment Status:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        quotation.payment_status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : quotation.payment_status === 'partial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {quotation.payment_status === 'paid' ? 'Paid' : quotation.payment_status === 'partial' ? 'Partial Payment' : 'Pending'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {quotation.terms_and_conditions && (
                <div className="mt-6 pt-6 border-t border-gray-300">
                  <h5 className="font-semibold text-gray-800 mb-2">Terms & Conditions</h5>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{quotation.terms_and_conditions}</p>
                </div>
              )}

              {quotation.remarks && (
                <div className="mt-4">
                  <h5 className="font-semibold text-gray-800 mb-2">Remarks</h5>
                  <p className="text-sm text-gray-600">{quotation.remarks}</p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-300">
                <p className="text-sm text-gray-500 text-center">
                  This quotation is valid for {quotation.validity_days} days from the date of issue
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
