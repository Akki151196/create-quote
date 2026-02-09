import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Download, MessageSquare, Calendar, MapPin, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Quotation {
  id: string;
  quotation_number: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  event_date: string;
  event_type: string;
  event_venue: string | null;
  number_of_guests: number;
  subtotal: number;
  tax_percentage: number;
  tax_amount: number;
  discount_percentage: number;
  discount_amount: number;
  grand_total: number;
  status: string;
  terms_and_conditions: string | null;
  created_at: string;
}

interface QuotationItem {
  id: string;
  item_type: string;
  item_name: string;
  description: string | null;
  unit_price: number;
  quantity: number;
  total: number;
}

interface QuotationResponse {
  response_type: string;
  responded_at: string;
}

export function ClientView() {
  const { id } = useParams();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [response, setResponse] = useState<QuotationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');

  useEffect(() => {
    loadQuotation();
  }, [id]);

  const loadQuotation = async () => {
    if (!id) return;

    try {
      const { data: quotationData, error: quotationError } = await supabase
        .from('quotations')
        .select('*')
        .eq('id', id)
        .single();

      if (quotationError) throw quotationError;
      setQuotation(quotationData);

      const { data: itemsData, error: itemsError } = await supabase
        .from('quotation_items')
        .select('*')
        .eq('quotation_id', id)
        .order('sort_order');

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      const { data: responseData } = await supabase
        .from('quotation_responses')
        .select('*')
        .eq('quotation_id', id)
        .order('responded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (responseData) {
        setResponse(responseData);
      }
    } catch (error) {
      console.error('Error loading quotation:', error);
      alert('Failed to load quotation');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (type: 'accepted' | 'rejected') => {
    if (!id) return;

    const confirmed = confirm(
      `Are you sure you want to ${type === 'accepted' ? 'accept' : 'reject'} this quotation?`
    );

    if (!confirmed) return;

    setResponding(true);

    try {
      const { error: responseError } = await supabase
        .from('quotation_responses')
        .insert({
          quotation_id: id,
          response_type: type,
          response_message: responseMessage || null,
        });

      if (responseError) throw responseError;

      const { error: updateError } = await supabase
        .from('quotations')
        .update({ status: type })
        .eq('id', id);

      if (updateError) throw updateError;

      alert(`Quotation ${type} successfully!`);
      loadQuotation();
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit response');
    } finally {
      setResponding(false);
      setResponseMessage('');
    }
  };

  const handleWhatsAppShare = () => {
    if (!quotation) return;
    const url = window.location.href;
    const message = `Hi, please check this quotation from The Royal Catering Service & Events: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading quotation...</div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Quotation Not Found</h2>
          <p className="text-gray-600">The quotation you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const menuItems = items.filter(item => item.item_type === 'menu_item');
  const services = items.filter(item => item.item_type === 'service');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <header className="bg-gradient-to-r from-maroon-800 to-maroon-950 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center text-center">
            <img
              src="/xraakgc9_img_0167-removebg-preview.png"
              alt="The Royal Catering Service"
              className="h-20 w-20 bg-white rounded-full p-2 mb-4"
            />
            <h1 className="text-3xl font-bold text-white mb-2">
              The Royal Catering Service & Events
            </h1>
            <p className="text-maroon-200">Making Your Events Memorable</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {response && (
          <div className={`mb-6 rounded-xl p-6 ${
            response.response_type === 'accepted'
              ? 'bg-green-50 border-2 border-green-200'
              : 'bg-red-50 border-2 border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              {response.response_type === 'accepted' ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600" />
              )}
              <div>
                <h3 className={`text-xl font-bold ${
                  response.response_type === 'accepted' ? 'text-green-800' : 'text-red-800'
                }`}>
                  Quotation {response.response_type === 'accepted' ? 'Accepted' : 'Rejected'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {new Date(response.responded_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-maroon-700 to-maroon-900 px-6 py-4">
            <h2 className="text-xl font-bold text-white">Quotation Details</h2>
            <p className="text-maroon-200 text-sm">Quotation #{quotation.quotation_number}</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Client Name</h3>
                <p className="text-lg font-semibold text-gray-800">{quotation.client_name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Contact</h3>
                <p className="text-lg font-semibold text-gray-800">{quotation.client_phone}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
                <Calendar className="w-6 h-6 text-maroon-600" />
                <div>
                  <p className="text-xs text-gray-500">Event Date</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(quotation.event_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
                <Users className="w-6 h-6 text-maroon-600" />
                <div>
                  <p className="text-xs text-gray-500">Guests</p>
                  <p className="font-semibold text-gray-800">{quotation.number_of_guests}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
                <MapPin className="w-6 h-6 text-maroon-600" />
                <div>
                  <p className="text-xs text-gray-500">Event Type</p>
                  <p className="font-semibold text-gray-800">{quotation.event_type}</p>
                </div>
              </div>
            </div>

            {quotation.event_venue && (
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Venue</h3>
                <p className="text-gray-800">{quotation.event_venue}</p>
              </div>
            )}
          </div>
        </div>

        {menuItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Menu Items</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {menuItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-start border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{item.item_name}</h4>
                      {item.description && (
                        <p className="text-sm text-gray-600">{item.description}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        ₹{item.unit_price.toLocaleString('en-IN')} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">
                        ₹{item.total.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {services.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Services</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {services.map((item) => (
                  <div key={item.id} className="flex justify-between items-start border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{item.item_name}</h4>
                      {item.description && (
                        <p className="text-sm text-gray-600">{item.description}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        ₹{item.unit_price.toLocaleString('en-IN')} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">
                        ₹{item.total.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-maroon-700 to-maroon-900 px-6 py-4">
            <h2 className="text-xl font-bold text-white">Payment Summary</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span className="font-semibold">₹{quotation.subtotal.toLocaleString('en-IN')}</span>
              </div>
              {quotation.discount_percentage > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount ({quotation.discount_percentage}%)</span>
                  <span className="font-semibold">-₹{quotation.discount_amount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-700">
                <span>GST/Tax ({quotation.tax_percentage}%)</span>
                <span className="font-semibold">₹{quotation.tax_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t-2 border-maroon-200 pt-3 flex justify-between">
                <span className="text-xl font-bold text-gray-800">Grand Total</span>
                <span className="text-2xl font-bold text-maroon-700">
                  ₹{quotation.grand_total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {quotation.terms_and_conditions && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
            <div className="bg-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-800">Terms & Conditions</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 whitespace-pre-line">{quotation.terms_and_conditions}</p>
            </div>
          </div>
        )}

        {!response && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Your Response</h3>
              <textarea
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder="Add a message (optional)"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none mb-4"
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleResponse('accepted')}
                  disabled={responding}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" />
                  Accept Quotation
                </button>
                <button
                  onClick={() => handleResponse('rejected')}
                  disabled={responding}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                  Reject Quotation
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleWhatsAppShare}
            className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            Share via WhatsApp
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 bg-maroon-700 hover:bg-maroon-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
        </div>
      </main>

      <footer className="bg-gray-800 text-white mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">The Royal Catering Service & Events</h3>
            <p className="text-gray-400 mb-4">Making Your Events Memorable</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm text-gray-400">
              <span>Contact: +91 98765 43210</span>
              <span className="hidden sm:inline">•</span>
              <span>Email: info@royalcatering.com</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
