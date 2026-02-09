import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, Download, Eye, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AdminLayout } from '../components/AdminLayout';
import { generatePackagePDF } from '../utils/pdfGenerator';

interface Package {
  id: string;
  name: string;
  description: string | null;
  base_price_per_person: number | null;
  is_active: boolean;
  created_at: string;
}

interface PackageItem {
  id: string;
  item_type: string;
  item_name: string;
  description: string | null;
  unit_price: number;
  quantity_multiplier: number;
  sort_order: number;
}

export function Packages() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [previewPackage, setPreviewPackage] = useState<Package | null>(null);
  const [previewItems, setPreviewItems] = useState<PackageItem[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price_per_person: 0,
    is_active: true,
  });

  const [packageItems, setPackageItems] = useState<Array<Omit<PackageItem, 'id'>>>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setPackages(data);
    } catch (error) {
      console.error('Error loading packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = async (pkg?: Package) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        name: pkg.name,
        description: pkg.description || '',
        base_price_per_person: pkg.base_price_per_person || 0,
        is_active: pkg.is_active,
      });

      const { data } = await supabase
        .from('package_items')
        .select('*')
        .eq('package_id', pkg.id)
        .order('sort_order');

      if (data) {
        setPackageItems(
          data.map((item) => ({
            item_type: item.item_type,
            item_name: item.item_name,
            description: item.description,
            unit_price: item.unit_price,
            quantity_multiplier: item.quantity_multiplier,
            sort_order: item.sort_order,
          }))
        );
      }
    } else {
      setEditingPackage(null);
      setFormData({ name: '', description: '', base_price_per_person: 0, is_active: true });
      setPackageItems([]);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPackage(null);
    setFormData({ name: '', description: '', base_price_per_person: 0, is_active: true });
    setPackageItems([]);
  };

  const addPackageItem = (type: 'menu_item' | 'service') => {
    setPackageItems([
      ...packageItems,
      {
        item_type: type,
        item_name: '',
        description: '',
        unit_price: 0,
        quantity_multiplier: 1,
        sort_order: packageItems.length,
      },
    ]);
  };

  const updatePackageItem = (index: number, field: keyof Omit<PackageItem, 'id'>, value: any) => {
    const updated = [...packageItems];
    updated[index] = { ...updated[index], [field]: value };
    setPackageItems(updated);
  };

  const removePackageItem = (index: number) => {
    setPackageItems(packageItems.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!user || !formData.name) {
      alert('Please fill in the package name');
      return;
    }

    try {
      let packageId = editingPackage?.id;

      if (editingPackage) {
        const { error } = await supabase
          .from('packages')
          .update({
            name: formData.name,
            description: formData.description || null,
            base_price_per_person: formData.base_price_per_person || null,
            is_active: formData.is_active,
          })
          .eq('id', editingPackage.id);

        if (error) throw error;

        await supabase.from('package_items').delete().eq('package_id', editingPackage.id);
      } else {
        const { data, error } = await supabase
          .from('packages')
          .insert({
            name: formData.name,
            description: formData.description || null,
            base_price_per_person: formData.base_price_per_person || null,
            is_active: formData.is_active,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        packageId = data.id;
      }

      if (packageItems.length > 0 && packageId) {
        const itemsToInsert = packageItems.map((item, index) => ({
          package_id: packageId,
          item_type: item.item_type,
          item_name: item.item_name,
          description: item.description || null,
          unit_price: item.unit_price,
          quantity_multiplier: item.quantity_multiplier,
          sort_order: index,
        }));

        const { error } = await supabase.from('package_items').insert(itemsToInsert);
        if (error) throw error;
      }

      alert(editingPackage ? 'Package updated successfully!' : 'Package created successfully!');
      closeModal();
      loadData();
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Failed to save package');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;

    try {
      const { error } = await supabase.from('packages').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting package:', error);
      alert('Failed to delete package');
    }
  };

  const handleDownloadPDF = async (pkg: Package) => {
    try {
      const { data: items } = await supabase
        .from('package_items')
        .select('*')
        .eq('package_id', pkg.id)
        .order('sort_order');

      await generatePackagePDF({
        name: pkg.name,
        description: pkg.description,
        base_price_per_person: pkg.base_price_per_person,
        items: items || [],
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF');
    }
  };

  const handlePreview = async (pkg: Package) => {
    try {
      const { data: items } = await supabase
        .from('package_items')
        .select('*')
        .eq('package_id', pkg.id)
        .order('sort_order');

      setPreviewPackage(pkg);
      setPreviewItems(items || []);
    } catch (error) {
      console.error('Error loading package items:', error);
      alert('Failed to load package details');
    }
  };

  const handleSharePackage = (pkg: Package) => {
    const shareText = `Check out our ${pkg.name} package from The Royal Catering Service & Events!`;
    const shareUrl = window.location.origin;

    if (navigator.share) {
      navigator.share({
        title: pkg.name,
        text: shareText,
        url: shareUrl,
      }).catch(err => console.log('Error sharing:', err));
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Service Packages" showHomeButton>
        <div className="flex items-center justify-center h-full">
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Service Packages" showHomeButton>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">Create complete service packages with menu and additional services</p>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-maroon-700 text-white px-4 py-2 rounded-lg hover:bg-maroon-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Package
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">{pkg.name}</h3>
                  {pkg.description && (
                    <p className="text-sm text-gray-600 mb-2">{pkg.description}</p>
                  )}
                  {pkg.base_price_per_person && (
                    <p className="text-lg font-semibold text-maroon-700">
                      ₹{pkg.base_price_per_person.toLocaleString('en-IN')} per person
                    </p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    pkg.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {pkg.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePreview(pkg)}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(pkg)}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-100 text-green-700 px-3 py-2 rounded-lg hover:bg-green-200 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => handleSharePackage(pkg)}
                    className="flex-1 flex items-center justify-center gap-2 bg-orange-100 text-orange-700 px-3 py-2 rounded-lg hover:bg-orange-200 transition-colors text-sm"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openModal(pkg)}
                    className="flex-1 flex items-center justify-center gap-2 bg-maroon-100 text-maroon-700 px-3 py-2 rounded-lg hover:bg-maroon-200 transition-colors text-sm"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pkg.id)}
                    className="flex items-center justify-center bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {packages.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 mb-4">No packages yet. Create your first package!</p>
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="bg-maroon-700 text-white px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {editingPackage ? 'Edit Package' : 'New Package'}
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
                        Package Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                        placeholder="e.g., Gold Wedding Package"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Base Price Per Person (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.base_price_per_person}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            base_price_per_person: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                        placeholder="Package description"
                      />
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

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800">Package Items</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => addPackageItem('menu_item')}
                          className="flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Menu Item
                        </button>
                        <button
                          onClick={() => addPackageItem('service')}
                          className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Service
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {packageItems.map((item, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                item.item_type === 'menu_item'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {item.item_type === 'menu_item' ? 'Menu Item' : 'Service'}
                            </span>
                            <button
                              onClick={() => removePackageItem(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Item Name *
                              </label>
                              <input
                                type="text"
                                value={item.item_name}
                                onChange={(e) =>
                                  updatePackageItem(index, 'item_name', e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none text-sm"
                                placeholder="e.g., Paneer Tikka"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Unit Price (₹)
                              </label>
                              <input
                                type="number"
                                value={item.unit_price}
                                onChange={(e) =>
                                  updatePackageItem(
                                    index,
                                    'unit_price',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none text-sm"
                                min="0"
                                step="0.01"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Description
                              </label>
                              <input
                                type="text"
                                value={item.description || ''}
                                onChange={(e) =>
                                  updatePackageItem(index, 'description', e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none text-sm"
                                placeholder="Optional description"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Quantity Multiplier
                              </label>
                              <input
                                type="number"
                                value={item.quantity_multiplier}
                                onChange={(e) =>
                                  updatePackageItem(
                                    index,
                                    'quantity_multiplier',
                                    parseFloat(e.target.value) || 1
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none text-sm"
                                min="0"
                                step="0.1"
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {packageItems.length === 0 && (
                        <div className="text-center py-8 text-gray-500 text-sm">
                          No items added yet. Click the buttons above to add menu items or services.
                        </div>
                      )}
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
                  Save Package
                </button>
              </div>
            </div>
          </div>
        )}

        {previewPackage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-maroon-800 to-maroon-950 text-white p-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">{previewPackage.name}</h2>
                  {previewPackage.base_price_per_person && (
                    <p className="text-maroon-200 text-sm mt-1">
                      ₹{previewPackage.base_price_per_person.toLocaleString('en-IN')} per person
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleDownloadPDF(previewPackage)}
                    className="flex items-center gap-2 bg-white text-maroon-800 px-4 py-2 rounded-lg hover:bg-maroon-50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => setPreviewPackage(null)}
                    className="text-white hover:text-maroon-200 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-8">
                {previewPackage.description && (
                  <div className="mb-6">
                    <p className="text-gray-700 text-center italic">{previewPackage.description}</p>
                  </div>
                )}

                {previewItems.filter(item => item.item_type === 'menu_item').length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-maroon-800 mb-4">Menu Items</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                        <thead className="bg-maroon-700 text-white">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Item Name</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold">Unit Price</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold">Qty Multiplier</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {previewItems
                            .filter(item => item.item_type === 'menu_item')
                            .map((item, index) => (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  {item.item_name}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {item.description || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">
                                  ₹{item.unit_price.toLocaleString('en-IN')}
                                </td>
                                <td className="px-4 py-3 text-sm text-center text-gray-900">
                                  x{item.quantity_multiplier}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {previewItems.filter(item => item.item_type === 'service').length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-maroon-800 mb-4">Additional Services</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                        <thead className="bg-maroon-700 text-white">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Service Name</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold">Unit Price</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold">Qty Multiplier</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {previewItems
                            .filter(item => item.item_type === 'service')
                            .map((item, index) => (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  {item.item_name}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {item.description || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">
                                  ₹{item.unit_price.toLocaleString('en-IN')}
                                </td>
                                <td className="px-4 py-3 text-sm text-center text-gray-900">
                                  x{item.quantity_multiplier}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {previewItems.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No items in this package
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
