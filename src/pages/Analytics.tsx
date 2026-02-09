import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Users, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AdminLayout } from '../components/AdminLayout';

interface AnalyticsData {
  totalRevenue: number;
  acceptedRevenue: number;
  totalQuotations: number;
  acceptedQuotations: number;
  rejectedQuotations: number;
  totalClients: number;
  conversionRate: number;
  averageOrderValue: number;
}

export function Analytics() {
  const [data, setData] = useState<AnalyticsData>({
    totalRevenue: 0,
    acceptedRevenue: 0,
    totalQuotations: 0,
    acceptedQuotations: 0,
    rejectedQuotations: 0,
    totalClients: 0,
    conversionRate: 0,
    averageOrderValue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [quotationsRes, clientsRes] = await Promise.all([
        supabase.from('quotations').select('status, grand_total'),
        supabase.from('clients').select('id'),
      ]);

      if (quotationsRes.data && clientsRes.data) {
        const quotations = quotationsRes.data;
        const totalQuotations = quotations.length;
        const acceptedQuotations = quotations.filter((q) => q.status === 'accepted').length;
        const rejectedQuotations = quotations.filter((q) => q.status === 'rejected').length;

        const totalRevenue = quotations.reduce((sum, q) => sum + q.grand_total, 0);
        const acceptedRevenue = quotations
          .filter((q) => q.status === 'accepted')
          .reduce((sum, q) => sum + q.grand_total, 0);

        const conversionRate =
          totalQuotations > 0 ? (acceptedQuotations / totalQuotations) * 100 : 0;
        const averageOrderValue = acceptedQuotations > 0 ? acceptedRevenue / acceptedQuotations : 0;

        setData({
          totalRevenue,
          acceptedRevenue,
          totalQuotations,
          acceptedQuotations,
          rejectedQuotations,
          totalClients: clientsRes.data.length,
          conversionRate,
          averageOrderValue,
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Analytics" showHomeButton>
        <div className="flex items-center justify-center h-full">
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Analytics" showHomeButton>
      <div className="max-w-7xl mx-auto">
        <p className="text-gray-600 mb-6">Business performance and insights</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-12 h-12 opacity-80" />
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-green-100 text-sm mb-1">Total Revenue</p>
            <p className="text-3xl font-bold">₹{data.totalRevenue.toLocaleString('en-IN')}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-12 h-12 opacity-80" />
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-blue-100 text-sm mb-1">Accepted Revenue</p>
            <p className="text-3xl font-bold">₹{data.acceptedRevenue.toLocaleString('en-IN')}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-12 h-12 opacity-80" />
            </div>
            <p className="text-purple-100 text-sm mb-1">Total Clients</p>
            <p className="text-3xl font-bold">{data.totalClients}</p>
          </div>

          <div className="bg-gradient-to-br from-maroon-600 to-maroon-700 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-12 h-12 opacity-80" />
            </div>
            <p className="text-maroon-200 text-sm mb-1">Total Quotations</p>
            <p className="text-3xl font-bold">{data.totalQuotations}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Conversion Rate</h3>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold text-maroon-700">
                  {data.conversionRate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {data.acceptedQuotations} of {data.totalQuotations} accepted
                </p>
              </div>
              <CheckCircle className="w-16 h-16 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Average Order Value</h3>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold text-maroon-700">
                  ₹{Math.round(data.averageOrderValue).toLocaleString('en-IN')}
                </p>
                <p className="text-sm text-gray-600 mt-2">Per accepted quotation</p>
              </div>
              <DollarSign className="w-16 h-16 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Rejection Rate</h3>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold text-red-700">
                  {data.totalQuotations > 0
                    ? ((data.rejectedQuotations / data.totalQuotations) * 100).toFixed(1)
                    : 0}
                  %
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {data.rejectedQuotations} of {data.totalQuotations} rejected
                </p>
              </div>
              <XCircle className="w-16 h-16 text-red-500 opacity-20" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Quotation Status Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-gray-800">Accepted</span>
                </div>
                <span className="text-2xl font-bold text-green-600">{data.acceptedQuotations}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="font-medium text-gray-800">Rejected</span>
                </div>
                <span className="text-2xl font-bold text-red-600">{data.rejectedQuotations}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-gray-800">Pending</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {data.totalQuotations - data.acceptedQuotations - data.rejectedQuotations}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Revenue Insights</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Accepted Revenue</span>
                  <span className="font-semibold text-gray-800">
                    ₹{data.acceptedRevenue.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full"
                    style={{
                      width: `${data.totalRevenue > 0 ? (data.acceptedRevenue / data.totalRevenue) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Potential Revenue</span>
                  <span className="font-semibold text-gray-800">
                    ₹{(data.totalRevenue - data.acceptedRevenue).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full"
                    style={{
                      width: `${data.totalRevenue > 0 ? ((data.totalRevenue - data.acceptedRevenue) / data.totalRevenue) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
