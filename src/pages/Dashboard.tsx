import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, Clock, XCircle, Eye, Pencil, Trash2, Plus, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AdminLayout } from '../components/AdminLayout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { generateQuotationPDF } from '../utils/pdfGenerator';
import { QuotationPreviewModal } from '../components/QuotationPreviewModal';

interface QuotationStats {
  total: number;
  accepted: number;
  pending: number;
  rejected: number;
}

interface Quotation {
  id: string;
  quotation_number: string;
  client_name: string;
  event_date: string;
  event_type: string;
  grand_total: number;
  status: string;
  created_at: string;
}

export function Dashboard() {
  const [stats, setStats] = useState<QuotationStats>({
    total: 0,
    accepted: 0,
    pending: 0,
    rejected: 0,
  });
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewQuotationId, setPreviewQuotationId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: allQuotations, error } = await supabase
        .from('quotations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (allQuotations) {
        setQuotations(allQuotations);

        setStats({
          total: allQuotations.length,
          accepted: allQuotations.filter(q => q.status === 'accepted').length,
          pending: allQuotations.filter(q => q.status === 'sent' || q.status === 'draft').length,
          rejected: allQuotations.filter(q => q.status === 'rejected').length,
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quotation?')) return;

    try {
      const { error } = await supabase
        .from('quotations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting quotation:', error);
      alert('Failed to delete quotation');
    }
  };

  const handleDownloadPDF = async (id: string) => {
    try {
      const { data: quotation, error: quotationError } = await supabase
        .from('quotations')
        .select('*')
        .eq('id', id)
        .single();

      if (quotationError) throw quotationError;

      const { data: items, error: itemsError } = await supabase
        .from('quotation_items')
        .select('*')
        .eq('quotation_id', id)
        .order('sort_order');

      if (itemsError) throw itemsError;

      await generateQuotationPDF({
        ...quotation,
        items: items || [],
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-100 text-blue-700',
      accepted: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      converted_to_invoice: 'bg-purple-100 text-purple-700',
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <LoadingSpinner fullScreen />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="max-w-7xl mx-auto app-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-maroon-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Quotations</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total}</p>
              </div>
              <FileText className="w-12 h-12 text-maroon-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Accepted</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.accepted}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.pending}</p>
              </div>
              <Clock className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Rejected</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.rejected}</p>
              </div>
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Recent Quotations</h2>
            <Link
              to="/admin/quotations/new"
              className="flex items-center gap-2 bg-gradient-to-r from-maroon-700 to-maroon-900 text-white px-4 py-2 rounded-lg hover:from-maroon-800 hover:to-maroon-950 transition-all text-sm w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              New Quotation
            </Link>
          </div>

          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quotation #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quotations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No quotations yet. Create your first quotation!
                    </td>
                  </tr>
                ) : (
                  quotations.map((quotation) => (
                    <tr key={quotation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {quotation.quotation_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {quotation.client_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {quotation.event_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(quotation.event_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{quotation.grand_total.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(quotation.status)}`}>
                          {quotation.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPreviewQuotationId(quotation.id)}
                            className="text-blue-600 hover:text-blue-700"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <Link
                            to={`/admin/quotations/${quotation.id}`}
                            className="text-maroon-600 hover:text-maroon-700"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDownloadPDF(quotation.id)}
                            className="text-green-600 hover:text-green-700"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(quotation.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden divide-y divide-gray-200">
            {quotations.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No quotations yet. Create your first quotation!
              </div>
            ) : (
              quotations.map((quotation) => (
                <div key={quotation.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{quotation.quotation_number}</p>
                      <p className="text-sm text-gray-600 mt-1">{quotation.client_name}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(quotation.status)}`}>
                      {quotation.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <p className="text-gray-500">Event Type</p>
                      <p className="text-gray-900 font-medium">{quotation.event_type}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Event Date</p>
                      <p className="text-gray-900 font-medium">
                        {new Date(quotation.event_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-gray-900">
                      ₹{quotation.grand_total.toLocaleString('en-IN')}
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setPreviewQuotationId(quotation.id)}
                        className="text-blue-600 hover:text-blue-700 p-2"
                        title="View"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <Link
                        to={`/admin/quotations/${quotation.id}`}
                        className="text-maroon-600 hover:text-maroon-700 p-2"
                        title="Edit"
                      >
                        <Pencil className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDownloadPDF(quotation.id)}
                        className="text-green-600 hover:text-green-700 p-2"
                        title="Download PDF"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(quotation.id)}
                        className="text-red-600 hover:text-red-700 p-2"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {previewQuotationId && (
        <QuotationPreviewModal
          quotationId={previewQuotationId}
          onClose={() => setPreviewQuotationId(null)}
        />
      )}
    </AdminLayout>
  );
}
