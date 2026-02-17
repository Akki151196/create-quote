import { useEffect, useState } from 'react';
import { Plus, Trash2, DollarSign, TrendingDown, TrendingUp, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AdminLayout } from '../components/AdminLayout';
import { useAuth } from '../contexts/AuthContext';

interface CalendarEvent {
  id: string;
  event_name: string;
  event_date: string;
  client_name: string;
  total_revenue: number;
}

interface EventExpense {
  id: string;
  event_id: string;
  total_expenses: number;
  profit: number;
  profit_percentage: number;
  status: string;
  event: CalendarEvent;
}

interface ExpenseItem {
  id: string;
  expense_id: string;
  vendor_name: string;
  category: string;
  amount: number;
  bill_url: string | null;
  bill_file_name: string | null;
  payment_date: string | null;
  payment_method: string | null;
  description: string | null;
}

interface ExpenseItemForm {
  vendor_name: string;
  category: 'Food' | 'Decoration' | 'Staff' | 'Venue' | 'Transport' | 'Other';
  amount: number;
  payment_date: string;
  payment_method: string;
  description: string;
}

export function Expenses() {
  const { user } = useAuth();
  const [eventExpenses, setEventExpenses] = useState<EventExpense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<EventExpense | null>(null);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState<ExpenseItemForm>({
    vendor_name: '',
    category: 'Food',
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    description: '',
  });

  useEffect(() => {
    loadEventExpenses();
  }, []);

  useEffect(() => {
    if (selectedExpense) {
      loadExpenseItems(selectedExpense.id);
    }
  }, [selectedExpense]);

  const loadEventExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('event_expenses')
        .select(`
          *,
          event:calendar_events(id, event_name, event_date, client_name, total_revenue)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setEventExpenses(data as any);
    } catch (error) {
      console.error('Error loading event expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExpenseItems = async (expenseId: string) => {
    try {
      const { data, error } = await supabase
        .from('event_expense_items')
        .select('*')
        .eq('expense_id', expenseId)
        .order('created_at', { ascending: false});

      if (error) throw error;
      if (data) setExpenseItems(data);
    } catch (error) {
      console.error('Error loading expense items:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;

    try {
      const { error } = await supabase
        .from('event_expense_items')
        .insert({
          expense_id: selectedExpense.id,
          ...formData,
          amount: parseFloat(formData.amount.toString()),
        });

      if (error) throw error;

      resetForm();
      await loadExpenseItems(selectedExpense.id);
      await loadEventExpenses();
    } catch (error) {
      console.error('Error saving expense item:', error);
      alert('Failed to save expense item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense item?')) return;

    try {
      const { error } = await supabase
        .from('event_expense_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (selectedExpense) {
        await loadExpenseItems(selectedExpense.id);
        await loadEventExpenses();
      }
    } catch (error) {
      console.error('Error deleting expense item:', error);
      alert('Failed to delete expense item');
    }
  };

  const resetForm = () => {
    setFormData({
      vendor_name: '',
      category: 'Food',
      amount: 0,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'Cash',
      description: '',
    });
    setShowForm(false);
  };

  const calculateTotals = () => {
    const totalRevenue = eventExpenses.reduce((sum, e) => sum + (e.event?.total_revenue || 0), 0);
    const totalExpenses = eventExpenses.reduce((sum, e) => sum + e.total_expenses, 0);
    const totalProfit = totalRevenue - totalExpenses;
    const avgProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalExpenses, totalProfit, avgProfitMargin };
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <AdminLayout title="Event Expense Tracker" showHomeButton>
        <div className="flex items-center justify-center h-full">
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  if (selectedExpense) {
    return (
      <AdminLayout title="Event Expense Tracker" showHomeButton>
        <div className="space-y-6">
          <button
            onClick={() => {
              setSelectedExpense(null);
              setExpenseItems([]);
            }}
            className="flex items-center gap-2 text-maroon-700 hover:text-maroon-800 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </button>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{selectedExpense.event.event_name}</h2>
                <p className="text-gray-600 mt-1">
                  {selectedExpense.event.client_name} • {new Date(selectedExpense.event.event_date).toLocaleDateString('en-IN')}
                </p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                selectedExpense.status === 'Complete' ? 'bg-green-100 text-green-700' :
                selectedExpense.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {selectedExpense.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-xl font-bold text-blue-700">₹{selectedExpense.event.total_revenue.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
                <p className="text-xl font-bold text-red-700">₹{selectedExpense.total_expenses.toLocaleString('en-IN')}</p>
              </div>
              <div className={`rounded-lg p-4 ${selectedExpense.profit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className="text-sm text-gray-600 mb-1">Profit</p>
                <p className={`text-xl font-bold ${selectedExpense.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  ₹{selectedExpense.profit.toLocaleString('en-IN')}
                </p>
              </div>
              <div className={`rounded-lg p-4 ${selectedExpense.profit_percentage >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className="text-sm text-gray-600 mb-1">Profit Margin</p>
                <p className={`text-xl font-bold ${selectedExpense.profit_percentage >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {selectedExpense.profit_percentage.toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Expense Items</h3>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-maroon-700 text-white px-4 py-2 rounded-lg hover:bg-maroon-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Expense
              </button>
            </div>

            {expenseItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No expense items added yet. Click "Add Expense" to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Date</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {expenseItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.vendor_name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            item.category === 'Food' ? 'bg-orange-100 text-orange-700' :
                            item.category === 'Decoration' ? 'bg-pink-100 text-pink-700' :
                            item.category === 'Staff' ? 'bg-blue-100 text-blue-700' :
                            item.category === 'Venue' ? 'bg-purple-100 text-purple-700' :
                            item.category === 'Transport' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {item.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{item.description || '-'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">₹{item.amount.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {item.payment_date ? new Date(item.payment_date).toLocaleDateString('en-IN') : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
              <div className="bg-maroon-700 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
                <h3 className="text-xl font-bold">Add Expense Item</h3>
                <button
                  onClick={resetForm}
                  className="text-white hover:text-maroon-200 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Name *</label>
                  <input
                    type="text"
                    value={formData.vendor_name}
                    onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                    required
                    placeholder="e.g., ABC Caterers"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                      required
                    >
                      <option value="Food">Food</option>
                      <option value="Decoration">Decoration</option>
                      <option value="Staff">Staff</option>
                      <option value="Venue">Venue</option>
                      <option value="Transport">Transport</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹) *</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                    <input
                      type="date"
                      value={formData.payment_date}
                      onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Card">Card</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                    placeholder="Additional details"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-maroon-700 text-white px-6 py-2 rounded-lg hover:bg-maroon-800 transition-colors"
                  >
                    Add Expense
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Event Expense Tracker" showHomeButton>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">₹{totals.totalRevenue.toLocaleString('en-IN')}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Expenses</p>
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">₹{totals.totalExpenses.toLocaleString('en-IN')}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Profit</p>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className={`text-2xl font-bold ${totals.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{totals.totalProfit.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Avg Profit Margin</p>
              <DollarSign className="w-5 h-5 text-maroon-700" />
            </div>
            <p className="text-2xl font-bold text-maroon-700">{totals.avgProfitMargin.toFixed(2)}%</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Event Expenses</h2>

          {eventExpenses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No events with expense tracking yet. Accept a quotation to create an event.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {eventExpenses.map((eventExpense) => (
                <button
                  key={eventExpense.id}
                  onClick={() => setSelectedExpense(eventExpense)}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-maroon-300 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{eventExpense.event.event_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {eventExpense.event.client_name} • {new Date(eventExpense.event.event_date).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Revenue</p>
                        <p className="text-sm font-semibold text-blue-700">₹{eventExpense.event.total_revenue.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Expenses</p>
                        <p className="text-sm font-semibold text-red-700">₹{eventExpense.total_expenses.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Profit</p>
                        <p className={`text-sm font-semibold ${eventExpense.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          ₹{eventExpense.profit.toLocaleString('en-IN')} ({eventExpense.profit_percentage.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
