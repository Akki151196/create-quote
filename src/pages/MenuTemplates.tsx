import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AdminLayout } from '../components/AdminLayout';

interface MenuItem {
  id: string;
  name: string;
  category_id: string;
  description: string | null;
  base_price: number;
  unit: string;
  is_vegetarian: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
}

interface MenuTemplate {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

interface TemplateItem {
  menu_item_id: string;
  quantity_multiplier: number;
  menu_items: MenuItem;
}

export function MenuTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MenuTemplate[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MenuTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
  });

  const [selectedItems, setSelectedItems] = useState<Array<{ menu_item_id: string; quantity_multiplier: number }>>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [templatesRes, itemsRes, categoriesRes] = await Promise.all([
        supabase.from('menu_templates').select('*').order('created_at', { ascending: false }),
        supabase.from('menu_items').select('*').eq('is_active', true).order('name'),
        supabase.from('menu_categories').select('*').order('display_order'),
      ]);

      if (templatesRes.data) setTemplates(templatesRes.data);
      if (itemsRes.data) setMenuItems(itemsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = async (template?: MenuTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        description: template.description || '',
        is_active: template.is_active,
      });

      const { data } = await supabase
        .from('menu_template_items')
        .select('menu_item_id, quantity_multiplier')
        .eq('template_id', template.id);

      if (data) {
        setSelectedItems(data);
      }
    } else {
      setEditingTemplate(null);
      setFormData({ name: '', description: '', is_active: true });
      setSelectedItems([]);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
    setFormData({ name: '', description: '', is_active: true });
    setSelectedItems([]);
  };

  const handleSave = async () => {
    if (!user || !formData.name) {
      alert('Please fill in the template name');
      return;
    }

    try {
      let templateId = editingTemplate?.id;

      if (editingTemplate) {
        const { error } = await supabase
          .from('menu_templates')
          .update({
            name: formData.name,
            description: formData.description || null,
            is_active: formData.is_active,
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;

        await supabase.from('menu_template_items').delete().eq('template_id', editingTemplate.id);
      } else {
        const { data, error } = await supabase
          .from('menu_templates')
          .insert({
            name: formData.name,
            description: formData.description || null,
            is_active: formData.is_active,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        templateId = data.id;
      }

      if (selectedItems.length > 0 && templateId) {
        const itemsToInsert = selectedItems.map((item, index) => ({
          template_id: templateId,
          menu_item_id: item.menu_item_id,
          quantity_multiplier: item.quantity_multiplier,
          sort_order: index,
        }));

        const { error } = await supabase.from('menu_template_items').insert(itemsToInsert);
        if (error) throw error;
      }

      alert(editingTemplate ? 'Template updated successfully!' : 'Template created successfully!');
      closeModal();
      loadData();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase.from('menu_templates').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const toggleItem = (itemId: string) => {
    const existing = selectedItems.find((item) => item.menu_item_id === itemId);
    if (existing) {
      setSelectedItems(selectedItems.filter((item) => item.menu_item_id !== itemId));
    } else {
      setSelectedItems([...selectedItems, { menu_item_id: itemId, quantity_multiplier: 1 }]);
    }
  };

  const updateMultiplier = (itemId: string, multiplier: number) => {
    setSelectedItems(
      selectedItems.map((item) =>
        item.menu_item_id === itemId ? { ...item, quantity_multiplier: multiplier } : item
      )
    );
  };

  const filteredMenuItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout title="Menu Templates" showHomeButton>
        <div className="flex items-center justify-center h-full">
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Menu Templates" showHomeButton>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">Create reusable menu templates for quick quotation generation</p>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-maroon-700 text-white px-4 py-2 rounded-lg hover:bg-maroon-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">{template.name}</h3>
                  {template.description && (
                    <p className="text-sm text-gray-600">{template.description}</p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    template.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {template.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => openModal(template)}
                  className="flex-1 flex items-center justify-center gap-2 bg-maroon-100 text-maroon-700 px-4 py-2 rounded-lg hover:bg-maroon-200 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="flex items-center justify-center bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {templates.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 mb-4">No templates yet. Create your first template!</p>
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="bg-maroon-700 text-white px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {editingTemplate ? 'Edit Template' : 'New Template'}
                </h2>
                <button onClick={closeModal} className="text-white hover:text-maroon-200">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Template Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                        placeholder="e.g., Wedding Package - Basic"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={formData.is_active.toString()}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
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
                      placeholder="Template description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Menu Items</label>
                    <div className="mb-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                          placeholder="Search menu items..."
                        />
                      </div>
                    </div>

                    <div className="space-y-4 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                      {categories.map((category) => {
                        const categoryItems = filteredMenuItems.filter(
                          (item) => item.category_id === category.id
                        );
                        if (categoryItems.length === 0) return null;

                        return (
                          <div key={category.id}>
                            <h4 className="font-semibold text-gray-800 mb-2">{category.name}</h4>
                            <div className="space-y-2">
                              {categoryItems.map((item) => {
                                const selected = selectedItems.find((si) => si.menu_item_id === item.id);
                                return (
                                  <div
                                    key={item.id}
                                    className={`border rounded-lg p-3 ${
                                      selected ? 'border-maroon-600 bg-maroon-50' : 'border-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <input
                                        type="checkbox"
                                        checked={!!selected}
                                        onChange={() => toggleItem(item.id)}
                                        className="mt-1 w-4 h-4 text-maroon-600 rounded focus:ring-maroon-500"
                                      />
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <h5 className="font-medium text-gray-800">{item.name}</h5>
                                          <span
                                            className={`text-xs px-2 py-0.5 rounded-full ${
                                              item.is_vegetarian
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                            }`}
                                          >
                                            {item.is_vegetarian ? 'Veg' : 'Non-Veg'}
                                          </span>
                                        </div>
                                        {item.description && (
                                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                        )}
                                        <p className="text-sm text-gray-500 mt-1">
                                          ₹{item.base_price.toLocaleString('en-IN')} {item.unit}
                                        </p>
                                        {selected && (
                                          <div className="mt-2">
                                            <label className="text-xs text-gray-600 block mb-1">
                                              Quantity Multiplier
                                            </label>
                                            <input
                                              type="number"
                                              value={selected.quantity_multiplier}
                                              onChange={(e) =>
                                                updateMultiplier(item.id, parseFloat(e.target.value) || 1)
                                              }
                                              min="0"
                                              step="0.1"
                                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
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
                  Save Template
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
