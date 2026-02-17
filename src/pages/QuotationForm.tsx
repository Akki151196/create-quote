import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <header className="bg-gradient-to-r from-maroon-800 to-maroon-950 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin" className="text-white hover:text-maroon-200">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <h1 className="text-2xl font-bold text-white">
                {id ? 'Edit Quotation' : 'New Quotation'}
              </h1>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-white text-maroon-800 px-6 py-2 rounded-lg hover:bg-maroon-50 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Quotation'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Client Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quotation Number
                  </label>
                  <input
                    type="text"
                    value={formData.quotation_number}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="converted_to_invoice">Converted to Invoice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Approval Status
                  </label>
                  <select
                    value={formData.approval_status}
                    onChange={(e) => setFormData({ ...formData, approval_status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending">Pending Review</option>
                    <option value="approved">Approved</option>
                    <option value="revised">Revised</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Validity (Days)
                  </label>
                  <input
                    type="number"
                    value={formData.validity_days}
                    onChange={(e) => setFormData({ ...formData, validity_days: parseInt(e.target.value) || 30 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.client_phone}
                    onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Email
                  </label>
                  <input
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Date
                  </label>
                  <input
                    type="date"
                    value={formData.service_date}
                    onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type *
                  </label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                  >
                    <option value="Wedding">Wedding</option>
                    <option value="Birthday Party">Birthday Party</option>
                    <option value="Corporate Event">Corporate Event</option>
                    <option value="Anniversary">Anniversary</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Guests *
                  </label>
                  <input
                    type="number"
                    value={formData.number_of_guests}
                    onChange={(e) => setFormData({ ...formData, number_of_guests: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Venue
                  </label>
                  <input
                    type="text"
                    value={formData.event_venue}
                    onChange={(e) => setFormData({ ...formData, event_venue: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Line Items</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => addLineItem('menu_item')}
                    className="flex items-center gap-2 bg-maroon-700 text-white px-4 py-2 rounded-lg hover:bg-maroon-800 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Menu Item
                  </button>
                  <button
                    onClick={() => addLineItem('service')}
                    className="flex items-center gap-2 bg-maroon-700 text-white px-4 py-2 rounded-lg hover:bg-maroon-800 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Service
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {lineItems.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.item_type === 'menu_item'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {item.item_type === 'menu_item' ? 'Menu Item' : 'Service'}
                      </span>
                      <button
                        onClick={() => removeLineItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Item Name
                        </label>
                        <input
                          type="text"
                          value={item.item_name}
                          onChange={(e) => updateLineItem(index, 'item_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                          placeholder="e.g., Veg Thali, DJ Service, Decoration"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                          placeholder="Optional details"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Unit Price (₹)
                        </label>
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Total
                        </label>
                        <div className="text-xl font-bold text-gray-800">
                          ₹{item.total.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {lineItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No items added yet. Click the buttons above to add menu items or services.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Notes & Terms</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks (visible on PDF)
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                    placeholder="Additional remarks for the client"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Internal Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                    placeholder="Private notes for internal use"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Terms & Conditions
                  </label>
                  <textarea
                    value={formData.terms_and_conditions}
                    onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">₹{totals.subtotal.toLocaleString('en-IN')}</span>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-600">Discount (%)</label>
                    <input
                      type="number"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Discount Amount</span>
                    <span>-₹{totals.discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Service Charges (₹)</label>
                    <input
                      type="number"
                      value={formData.service_charges}
                      onChange={(e) => setFormData({ ...formData, service_charges: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">External Charges (₹)</label>
                    <input
                      type="number"
                      value={formData.external_charges}
                      onChange={(e) => setFormData({ ...formData, external_charges: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-600">GST/Tax (%)</label>
                    <input
                      type="number"
                      value={formData.tax_percentage}
                      onChange={(e) => setFormData({ ...formData, tax_percentage: parseFloat(e.target.value) || 0 })}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax Amount</span>
                    <span>₹{totals.taxAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="border-t-2 border-maroon-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-800">Grand Total</span>
                    <span className="text-2xl font-bold text-maroon-700">
                      ₹{totals.grandTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Advance Payment Received (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.advance_paid}
                      onChange={(e) => setFormData({ ...formData, advance_paid: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right"
                      min="0"
                      max={totals.grandTotal}
                      step="0.01"
                    />
                  </div>
                  {totals.advancePaid > 0 && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-green-700">Advance Paid:</span>
                        <span className="text-sm font-semibold text-green-700">
                          ₹{totals.advancePaid.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-bold text-red-700">Balance Due:</span>
                        <span className="text-sm font-bold text-red-700">
                          ₹{totals.balanceDue.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-green-200">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-green-600">Payment Status:</span>
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${
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
      </main>
    </div>
  );
}
