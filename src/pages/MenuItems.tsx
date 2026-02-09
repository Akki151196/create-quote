import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AdminLayout } from '../components/AdminLayout';

interface MenuItem {
  id: string;
  name: string;
  category_id: string;
  description: string | null;
  base_price: number;
  unit: string;
  is_vegetarian: boolean;
  is_active: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
}

export function MenuItems() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    description: '',
    base_price: 0,
    unit: 'per person',
    is_vegetarian: true,
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemsRes, categoriesRes] = await Promise.all([
        supabase.from('menu_items').select('*').order('name'),
        supabase.from('menu_categories').select('*').order('display_order'),
      ]);

      if (itemsRes.data) setMenuItems(itemsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category_id: item.category_id,
        description: item.description || '',
        base_price: item.base_price,
        unit: item.unit,
        is_vegetarian: item.is_vegetarian,
        is_active: item.is_active,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        category_id: categories[0]?.id || '',
        description: '',
        base_price: 0,
        unit: 'per person',
        is_vegetarian: true,
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.category_id) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('menu_items')
          .update({
            name: formData.name,
            category_id: formData.category_id,
            description: formData.description || null,
            base_price: formData.base_price,
            unit: formData.unit,
            is_vegetarian: formData.is_vegetarian,
            is_active: formData.is_active,
          })
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('menu_items').insert({
          name: formData.name,
          category_id: formData.category_id,
          description: formData.description || null,
          base_price: formData.base_price,
          unit: formData.unit,
          is_vegetarian: formData.is_vegetarian,
          is_active: formData.is_active,
        });

        if (error) throw error;
      }

      alert(editingItem ? 'Menu item updated successfully!' : 'Menu item created successfully!');
      closeModal();
      loadData();
    } catch (error) {
      console.error('Error saving menu item:', error);
      alert('Failed to save menu item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      alert('Failed to delete menu item');
    }
  };

  const filteredItems =
    selectedCategory === 'all'
      ? menuItems
      : menuItems.filter((item) => item.category_id === selectedCategory);

  if (loading) {
    return (
      <AdminLayout title="Menu Items Library" showHomeButton>
        <div className="flex items-center justify-center h-full">
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Menu Items Library" showHomeButton>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">Manage your menu items catalog</p>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-maroon-700 text-white px-4 py-2 rounded-lg hover:bg-maroon-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Menu Item
          </button>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-maroon-700 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Items
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-maroon-700 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
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
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No menu items found. Create your first item!
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const category = categories.find((c) => c.id === item.category_id);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-gray-500">{item.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {category?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{item.base_price.toLocaleString('en-IN')}
                        <div className="text-xs text-gray-500">{item.unit}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.is_vegetarian
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {item.is_vegetarian ? 'Veg' : 'Non-Veg'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openModal(item)}
                            className="text-maroon-600 hover:text-maroon-700"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
              <div className="bg-maroon-700 text-white px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {editingItem ? 'Edit Menu Item' : 'New Menu Item'}
                </h2>
                <button onClick={closeModal} className="text-white hover:text-maroon-200">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Item Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                        placeholder="e.g., Paneer Tikka"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                      >
                        <option value="">Select Category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                      placeholder="Item description"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Base Price (₹) *
                      </label>
                      <input
                        type="number"
                        value={formData.base_price}
                        onChange={(e) =>
                          setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
                      <select
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                      >
                        <option value="per person">per person</option>
                        <option value="per plate">per plate</option>
                        <option value="per item">per item</option>
                        <option value="per kg">per kg</option>
                        <option value="per service">per service</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <select
                        value={formData.is_vegetarian.toString()}
                        onChange={(e) =>
                          setFormData({ ...formData, is_vegetarian: e.target.value === 'true' })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                      >
                        <option value="true">Vegetarian</option>
                        <option value="false">Non-Vegetarian</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={formData.is_active.toString()}
                        onChange={(e) =>
                          setFormData({ ...formData, is_active: e.target.value === 'true' })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </div>
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
                  Save Item
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
