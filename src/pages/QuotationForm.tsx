import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AdminLayout } from '../components/AdminLayout';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface LineItem {
  id?: string;
  item_type: 'menu_item' | 'service';
  item_name: string;
  description: string;
  unit_price: number;
  quantity: number;
  total: number;
  sort_order: number;
}

export function QuotationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    quotation_number: '',
    client_name: '',
    client_phone: '',
    client_email: '',
    event_date: '',
    service_date: '',
    event_type: 'Wedding',
    event_venue: '',
    number_of_guests: 100,
    tax_percentage: 18,
    discount_percentage: 0,
    service_charges: 0,
    external_charges: 0,
    validity_days: 30,
    remarks: '',
    notes: '',
    terms_and_conditions: 'Payment terms: 50% advance at booking, 50% before event. Cancellation policy: Non-refundable after 7 days of booking.',
    status: 'draft',
    approval_status: 'draft',
    advance_paid: 0,
    payment_status: 'pending' as 'pending' | 'partial' | 'paid',
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  useEffect(() => {
    if (id) {
      loadQuotation();
    } else {
      generateQuotationNumber();
    }
  }, [id]);

  const generateQuotationNumber = async () => {
    const { data } = await supabase
      .from('quotations')
      .select('quotation_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextNumber = 1;
    if (data?.quotation_number) {
      const match = data.quotation_number.match(/QUOTE-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    setFormData(prev => ({
      ...prev,
      quotation_number: `QUOTE-${nextNumber.toString().padStart(4, '0')}`,
    }));
  };

  const loadQuotation = async () => {
    if (!id) return;
    setLoading(true);

    try {
      const { data: quotation, error: quotationError } = await supabase
        .from('quotations')
        .select('*')
        .eq('id', id)
        .single();

      if (quotationError) throw quotationError;

      setFormData({
        quotation_number: quotation.quotation_number,
        client_name: quotation.client_name,
        client_phone: quotation.client_phone,
        client_email: quotation.client_email || '',
        event_date: quotation.event_date,
        service_date: quotation.service_date || '',
        event_type: quotation.event_type,
        event_venue: quotation.event_venue || '',
        number_of_guests: quotation.number_of_guests,
        tax_percentage: quotation.tax_percentage,
        discount_percentage: quotation.discount_percentage,
        service_charges: quotation.service_charges || 0,
        external_charges: quotation.external_charges || 0,
        validity_days: quotation.validity_days || 30,
        remarks: quotation.remarks || '',
        notes: quotation.notes || '',
        terms_and_conditions: quotation.terms_and_conditions || '',
        status: quotation.status,
        approval_status: quotation.approval_status || 'draft',
        advance_paid: quotation.advance_paid || 0,
        payment_status: quotation.payment_status || 'pending',
      });

      const { data: items, error: itemsError } = await supabase
        .from('quotation_items')
        .select('*')
        .eq('quotation_id', id)
        .order('sort_order');

      if (itemsError) throw itemsError;
      setLineItems(items || []);
    } catch (error) {
      console.error('Error loading quotation:', error);
      alert('Failed to load quotation');
    } finally {
      setLoading(false);
    }
  };

  const addLineItem = (type: 'menu_item' | 'service') => {
    setLineItems([
      ...lineItems,
      {
        item_type: type,
        item_name: '',
        description: '',
        unit_price: 0,
        quantity: formData.number_of_guests,
        total: 0,
        sort_order: lineItems.length,
      },
    ]);
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'unit_price' || field === 'quantity') {
      updated[index].total = updated[index].unit_price * updated[index].quantity;
    }

    setLineItems(updated);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (subtotal * formData.discount_percentage) / 100;
    const subtotalAfterDiscount = subtotal - discountAmount;
    const serviceCharges = parseFloat(formData.service_charges.toString()) || 0;
    const externalCharges = parseFloat(formData.external_charges.toString()) || 0;
    const subtotalWithCharges = subtotalAfterDiscount + serviceCharges + externalCharges;
    const taxAmount = (subtotalWithCharges * formData.tax_percentage) / 100;
    const grandTotal = subtotalWithCharges + taxAmount;
    const totalCharges = subtotal + serviceCharges + externalCharges;
    const advancePaid = parseFloat(formData.advance_paid.toString()) || 0;
    const balanceDue = grandTotal - advancePaid;

    return {
      subtotal,
      discountAmount,
      serviceCharges,
      externalCharges,
      totalCharges,
      taxAmount,
      grandTotal,
      advancePaid,
      balanceDue,
    };
  };

  const handleSave = async () => {
    if (!user) return;

    if (!formData.client_name || !formData.client_phone || !formData.event_date) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      const totals = calculateTotals();

      let paymentStatus: 'pending' | 'partial' | 'paid' = 'pending';
      if (totals.advancePaid >= totals.grandTotal) {
        paymentStatus = 'paid';
      } else if (totals.advancePaid > 0) {
        paymentStatus = 'partial';
      }

      const baseQuotationData = {
        quotation_number: formData.quotation_number,
        client_name: formData.client_name,
        client_phone: formData.client_phone,
        client_email: formData.client_email || null,
        event_date: formData.event_date,
        service_date: formData.service_date || null,
        event_type: formData.event_type,
        event_venue: formData.event_venue || null,
        number_of_guests: formData.number_of_guests,
        subtotal: totals.subtotal,
        tax_percentage: formData.tax_percentage,
        tax_amount: totals.taxAmount,
        discount_percentage: formData.discount_percentage,
        discount_amount: totals.discountAmount,
        service_charges: totals.serviceCharges,
        external_charges: totals.externalCharges,
        total_charges: totals.totalCharges,
        grand_total: totals.grandTotal,
        advance_paid: totals.advancePaid,
        balance_due: totals.balanceDue,
        payment_status: paymentStatus,
        validity_days: formData.validity_days,
        remarks: formData.remarks || null,
        status: formData.status,
        approval_status: formData.approval_status,
        notes: formData.notes || null,
        terms_and_conditions: formData.terms_and_conditions,
      };

      let quotationId = id;

      if (id) {
        const { error } = await supabase
          .from('quotations')
          .update(baseQuotationData)
          .eq('id', id);

        if (error) throw error;

        await supabase
          .from('quotation_items')
          .delete()
          .eq('quotation_id', id);
      } else {
        const { data, error } = await supabase
          .from('quotations')
          .insert({
            ...baseQuotationData,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        quotationId = data.id;
      }

      if (lineItems.length > 0 && quotationId) {
        const itemsToInsert = lineItems.map((item, index) => ({
          quotation_id: quotationId,
          item_type: item.item_type,
          item_name: item.item_name,
          description: item.description || null,
          unit_price: item.unit_price,
          quantity: item.quantity,
          total: item.total,
          sort_order: index,
        }));

        const { error: itemsError } = await supabase
          .from('quotation_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      alert('Quotation saved successfully!');
      navigate('/admin');
    } catch (error) {
      console.error('Error saving quotation:', error);
      alert('Failed to save quotation');
    } finally {
      setSaving(false);
    }
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <AdminLayout title={id ? 'Edit Quotation' : 'New Quotation'} showHomeButton>
        <LoadingSpinner fullScreen />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={id ? 'Edit Quotation' : 'New Quotation'} showHomeButton>
      <div className="max-w-7xl mx-auto app-fade-in">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <p className="text-sm text-gray-500">Fill in the details below to create a quotation</p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 btn-primary text-sm"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save Quotation'}</span>
            <span className="sm:hidden">{saving ? '...' : 'Save'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h2 className="text-base font-bold text-gray-800 mb-4">Client Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Quotation Number</label>
                  <input
                    type="text"
                    value={formData.quotation_number}
                    readOnly
                    className="input-field bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="converted_to_invoice">Converted to Invoice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Approval Status</label>
                  <select
                    value={formData.approval_status}
                    onChange={(e) => setFormData({ ...formData, approval_status: e.target.value })}
                    className="input-field"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending">Pending Review</option>
                    <option value="approved">Approved</option>
                    <option value="revised">Revised</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Validity (Days)</label>
                  <input
                    type="number"
                    value={formData.validity_days}
                    onChange={(e) => setFormData({ ...formData, validity_days: parseInt(e.target.value) || 30 })}
                    className="input-field"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Client Name *</label>
                  <input
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Client Phone *</label>
                  <input
                    type="tel"
                    value={formData.client_phone}
                    onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Client Email</label>
                  <input
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Event Date *</label>
                  <input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Service Date</label>
                  <input
                    type="date"
                    value={formData.service_date}
                    onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Event Type *</label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    className="input-field"
                  >
                    <option value="Wedding">Wedding</option>
                    <option value="Birthday Party">Birthday Party</option>
                    <option value="Corporate Event">Corporate Event</option>
                    <option value="Anniversary">Anniversary</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Number of Guests *</label>
                  <input
                    type="number"
                    value={formData.number_of_guests}
                    onChange={(e) => setFormData({ ...formData, number_of_guests: parseInt(e.target.value) || 0 })}
                    className="input-field"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Event Venue</label>
                  <input
                    type="text"
                    value={formData.event_venue}
                    onChange={(e) => setFormData({ ...formData, event_venue: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-800">Line Items</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => addLineItem('menu_item')}
                    className="flex items-center gap-1.5 bg-maroon-700 text-white px-3 py-1.5 rounded-lg hover:bg-maroon-800 transition-colors text-xs sm:text-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Menu Item</span>
                    <span className="sm:hidden">Menu</span>
                  </button>
                  <button
                    onClick={() => addLineItem('service')}
                    className="flex items-center gap-1.5 bg-maroon-700 text-white px-3 py-1.5 rounded-lg hover:bg-maroon-800 transition-colors text-xs sm:text-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Service
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.item_type === 'menu_item'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {item.item_type === 'menu_item' ? 'Menu Item' : 'Service'}
                      </span>
                      <button
                        onClick={() => removeLineItem(index)}
                        className="text-red-500 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Item Name</label>
                        <input
                          type="text"
                          value={item.item_name}
                          onChange={(e) => updateLineItem(index, 'item_name', e.target.value)}
                          className="input-field text-sm"
                          placeholder="e.g., Veg Thali, DJ Service"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          className="input-field text-sm"
                          placeholder="Optional details"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Unit Price</label>
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="input-field text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="input-field text-sm"
                        />
                      </div>
                      <div className="sm:col-span-2 flex justify-between items-center pt-1 border-t border-gray-100">
                        <span className="text-xs text-gray-500">Total</span>
                        <span className="text-base font-bold text-gray-800">
                          {'\u20B9'}{item.total.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {lineItems.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No items added yet. Tap the buttons above to add items.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h2 className="text-base font-bold text-gray-800 mb-4">Notes & Terms</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Remarks (visible on PDF)</label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    rows={2}
                    className="input-field text-sm"
                    placeholder="Additional remarks for the client"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Internal Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="input-field text-sm"
                    placeholder="Private notes for internal use"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Terms & Conditions</label>
                  <textarea
                    value={formData.terms_and_conditions}
                    onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
                    rows={3}
                    className="input-field text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 lg:sticky lg:top-4">
              <h2 className="text-base font-bold text-gray-800 mb-4">Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{'\u20B9'}{totals.subtotal.toLocaleString('en-IN')}</span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-gray-600">Discount (%)</label>
                    <input
                      type="number"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Discount</span>
                    <span>-{'\u20B9'}{totals.discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Service Charges</label>
                    <input
                      type="number"
                      value={formData.service_charges}
                      onChange={(e) => setFormData({ ...formData, service_charges: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-right text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">External Charges</label>
                    <input
                      type="number"
                      value={formData.external_charges}
                      onChange={(e) => setFormData({ ...formData, external_charges: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-right text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-gray-600">GST/Tax (%)</label>
                    <input
                      type="number"
                      value={formData.tax_percentage}
                      onChange={(e) => setFormData({ ...formData, tax_percentage: parseFloat(e.target.value) || 0 })}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax Amount</span>
                    <span>{'\u20B9'}{totals.taxAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="border-t-2 border-maroon-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800">Grand Total</span>
                    <span className="text-xl font-bold text-maroon-700">
                      {'\u20B9'}{totals.grandTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Advance Payment Received</label>
                    <input
                      type="number"
                      value={formData.advance_paid}
                      onChange={(e) => setFormData({ ...formData, advance_paid: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-right text-sm"
                      min="0"
                      max={totals.grandTotal}
                      step="0.01"
                    />
                  </div>
                  {totals.advancePaid > 0 && (
                    <div className="bg-green-50 p-3 rounded-lg text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-green-700">Advance Paid:</span>
                        <span className="font-semibold text-green-700">
                          {'\u20B9'}{totals.advancePaid.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-red-700">Balance Due:</span>
                        <span className="font-bold text-red-700">
                          {'\u20B9'}{totals.balanceDue.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-green-200">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-green-600">Payment Status:</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            totals.advancePaid >= totals.grandTotal
                              ? 'bg-green-200 text-green-800'
                              : 'bg-yellow-200 text-yellow-800'
                          }`}>
                            {totals.advancePaid >= totals.grandTotal ? 'Paid' : 'Partial Payment'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
