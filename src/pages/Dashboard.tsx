import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, Clock, XCircle, Eye, Pencil, Trash2, Plus, Download, Loader2 } from 'lucide-react';
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
  const [downloadingPDF, setDownloadingPDF] = useState<string | null>(null);
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
    setDownloadingPDF(id);
    try {
      const { data: quotation, error: quotationError } = await supabase
        .from('quotations')
        .select('*')
        .eq('id', id)
        .single();

      if (quotationError) {
        console.error('Quotation error:', quotationError);
        throw new Error('Failed to fetch quotation details');
      }

      if (!quotation) {
        throw new Error('Quotation not found');
      }

      const { data: items, error: itemsError } = await supabase
        .from('quotation_items')
        .select('*')
        .eq('quotation_id', id)
        .order('sort_order');

      if (itemsError) {
        console.error('Items error:', itemsError);
        throw new Error('Failed to fetch quotation items');
      }

      console.log('Generating PDF with data:', { quotation, items });

      await generateQuotationPDF({
        ...quotation,
        items: items || [],
      });

      console.log('PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF';
      alert(errorMessage);
    } finally {
      setDownloadingPDF(null);
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-b-4 md:border-l-4 md:border-b-0 border-red-900 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">Total</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-red-900" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-b-4 md:border-l-4 md:border-b-0 border-green-500 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">Accepted</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.accepted}</p>
              </div>
              <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-b-4 md:border-l-4 md:border-b-0 border-blue-500 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">Pending</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-b-4 md:border-l-4 md:border-b-0 border-red-500 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">Rejected</p>
                <p className="text-2xl sm:text-3xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-red-500" />
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
                            className="text-green-600 hover:text-green-700 disabled:opacity-50"
                            title="Download PDF"
                            disabled={downloadingPDF === quotation.id}
                          >
                            {downloadingPDF === quotation.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
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

          <div className="lg:hidden p-3 space-y-3">
            {quotations.length === 0 ? (
              <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl">
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="font-medium">No quotations yet</p>
                <p className="text-sm mt-1">Create your first quotation!</p>
              </div>
            ) : (
              quotations.map((quotation) => (
                <div key={quotation.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 active:bg-gray-50 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-gray-900 truncate">{quotation.client_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{quotation.quotation_number}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap ${getStatusBadge(quotation.status)}`}>
                      {quotation.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">Event</p>
                      <p className="text-sm text-gray-900 font-semibold">{quotation.event_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">Date</p>
                      <p className="text-sm text-gray-900 font-semibold">
                        {new Date(quotation.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Total Amount</p>
                      <p className="text-xl font-bold text-red-900">
                        ₹{quotation.grand_total.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewQuotationId(quotation.id)}
                        className="text-blue-600 active:text-blue-700 p-2.5 bg-blue-50 rounded-lg active:scale-95 transition-all"
                        title="View"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <Link
                        to={`/admin/quotations/${quotation.id}`}
                        className="text-maroon-600 active:text-maroon-700 p-2.5 bg-red-50 rounded-lg active:scale-95 transition-all"
                        title="Edit"
                      >
                        <Pencil className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDownloadPDF(quotation.id)}
                        className="text-green-600 active:text-green-700 p-2.5 bg-green-50 rounded-lg disabled:opacity-50 active:scale-95 transition-all"
                        title="Download PDF"
                        disabled={downloadingPDF === quotation.id}
                      >
                        {downloadingPDF === quotation.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Download className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(quotation.id)}
                        className="text-red-600 active:text-red-700 p-2.5 bg-red-50 rounded-lg active:scale-95 transition-all"
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
          onStatusChange={loadData}
        />
      )}
    </AdminLayout>
  );
}
