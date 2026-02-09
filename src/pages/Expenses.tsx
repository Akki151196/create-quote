import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AdminLayout } from '../components/AdminLayout';
import { useAuth } from '../contexts/AuthContext';

interface Expense {
  id: string;
  quotation_id: string;
  category: 'internal' | 'external' | 'miscellaneous';
  description: string;
  amount: number;
  expense_date: string;
  notes: string;
  document_url: string | null;
  created_at: string;
  quotation: {
    quotation_number: string;
    client_name: string;
    grand_total: number;
  };
}

interface ExpenseForm {
  quotation_id: string;
  category: 'internal' | 'external' | 'miscellaneous';
  description: string;
  amount: number;
  expense_date: string;
  notes: string;
}

export function Expenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<string>('all');

  const [formData, setFormData] = useState<ExpenseForm>({
    quotation_id: '',
    category: 'internal',
    description: '',
    amount: 0,
    expense_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    loadQuotations();
    loadExpenses();
  }, [selectedOrder]);

  const loadQuotations = async () => {
    try {
      const { data, error } = await supabase
        .from('quotations')
        .select('id, quotation_number, client_name, grand_total, approval_status')
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setQuotations(data);
    } catch (error) {
      console.error('Error loading quotations:', error);
    }
  };

  const loadExpenses = async () => {
    try {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          quotation:quotations(quotation_number, client_name, grand_total)
        `)
        .order('expense_date', { ascending: false });

      if (selectedOrder !== 'all') {
        query = query.eq('quotation_id', selectedOrder);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (data) setExpenses(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount.toString()),
        created_by: user.id,
      };

      if (editingId) {
        const { error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('expenses')
          .insert(expenseData);

        if (error) throw error;
      }

      resetForm();
      loadExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Failed to save expense');
    }
  };

  const handleEdit = (expense: Expense) => {
    setFormData({
      quotation_id: expense.quotation_id,
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      expense_date: expense.expense_date,
      notes: expense.notes,
    });
    setEditingId(expense.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense');
    }
  };

  const resetForm = () => {
    setFormData({
      quotation_id: '',
      category: 'internal',
      description: '',
      amount: 0,
      expense_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const calculateOrderExpenses = (orderId: string) => {
    return expenses
      .filter(e => e.quotation_id === orderId)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const calculateTotalsByCategory = () => {
    return {
      internal: expenses.filter(e => e.category === 'internal').reduce((sum, e) => sum + e.amount, 0),
      external: expenses.filter(e => e.category === 'external').reduce((sum, e) => sum + e.amount, 0),
      miscellaneous: expenses.filter(e => e.category === 'miscellaneous').reduce((sum, e) => sum + e.amount, 0),
    };
  };

  const totals = calculateTotalsByCategory();
  const grandTotalExpenses = totals.internal + totals.external + totals.miscellaneous;

  if (loading) {
    return (
      <AdminLayout title="Expense Tracker" showHomeButton>
        <div className="flex items-center justify-center h-full">
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Expense Tracker" showHomeButton>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Expenses</p>
              <DollarSign className="w-5 h-5 text-maroon-700" />
            </div>
            <p className="text-2xl font-bold text-maroon-700">₹{grandTotalExpenses.toLocaleString('en-IN')}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Internal</p>
              <TrendingDown className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">₹{totals.internal.toLocaleString('en-IN')}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">External</p>
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-orange-600">₹{totals.external.toLocaleString('en-IN')}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Miscellaneous</p>
              <DollarSign className="w-5 h-5 text-gray-600" />
            </div>
            <p className="text-2xl font-bold text-gray-600">₹{totals.miscellaneous.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-gray-800">Expense Records</h2>
              <select
                value={selectedOrder}
                onChange={(e) => setSelectedOrder(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
              >
                <option value="all">All Orders</option>
                {quotations.map(q => (
                  <option key={q.id} value={q.id}>
                    {q.quotation_number} - {q.client_name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-maroon-700 text-white px-6 py-2 rounded-lg hover:bg-maroon-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </div>

          {expenses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No expenses recorded yet. Click "Add Expense" to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(expense.expense_date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div>
                          <p className="font-medium text-gray-800">{expense.quotation.quotation_number}</p>
                          <p className="text-xs text-gray-500">{expense.quotation.client_name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          expense.category === 'internal'
                            ? 'bg-blue-100 text-blue-700'
                            : expense.category === 'external'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div>
                          <p className="font-medium">{expense.description}</p>
                          {expense.notes && (
                            <p className="text-xs text-gray-500 mt-1">{expense.notes}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                        ₹{expense.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(expense)}
                            className="text-maroon-600 hover:text-maroon-700"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
              <div className="bg-maroon-700 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
                <h3 className="text-xl font-bold">{editingId ? 'Edit Expense' : 'Add New Expense'}</h3>
                <button
                  onClick={resetForm}
                  className="text-white hover:text-maroon-200 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order *
                  </label>
                  <select
                    value={formData.quotation_id}
                    onChange={(e) => setFormData({ ...formData, quotation_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                    required
                  >
                    <option value="">Select Order</option>
                    {quotations.map(q => (
                      <option key={q.id} value={q.id}>
                        {q.quotation_number} - {q.client_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                      required
                    >
                      <option value="internal">Internal</option>
                      <option value="external">External</option>
                      <option value="miscellaneous">Miscellaneous</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={formData.expense_date}
                      onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                    required
                    placeholder="e.g., Transportation, Raw materials, Staff payment"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (₹) *
                  </label>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                    placeholder="Additional notes or details"
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
                    {editingId ? 'Update Expense' : 'Add Expense'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
