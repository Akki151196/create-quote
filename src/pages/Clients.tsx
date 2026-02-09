import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, Phone, Mail, Building } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AdminLayout } from '../components/AdminLayout';

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  secondary_phone: string | null;
  address: string | null;
  company_name: string | null;
  notes: string | null;
  created_at: string;
}

export function Clients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    secondary_phone: '',
    address: '',
    company_name: '',
    notes: '',
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        email: client.email || '',
        phone: client.phone,
        secondary_phone: client.secondary_phone || '',
        address: client.address || '',
        company_name: client.company_name || '',
        notes: client.notes || '',
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        secondary_phone: '',
        address: '',
        company_name: '',
        notes: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClient(null);
  };

  const handleSave = async () => {
    if (!user || !formData.name || !formData.phone) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update({
            name: formData.name,
            email: formData.email || null,
            phone: formData.phone,
            secondary_phone: formData.secondary_phone || null,
            address: formData.address || null,
            company_name: formData.company_name || null,
            notes: formData.notes || null,
          })
          .eq('id', editingClient.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('clients').insert({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone,
          secondary_phone: formData.secondary_phone || null,
          address: formData.address || null,
          company_name: formData.company_name || null,
          notes: formData.notes || null,
          created_by: user.id,
        });

        if (error) throw error;
      }

      alert(editingClient ? 'Client updated successfully!' : 'Client added successfully!');
      closeModal();
      loadClients();
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Failed to save client');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Failed to delete client');
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Clients" showHomeButton>
        <div className="flex items-center justify-center h-full">
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Clients" showHomeButton>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">Manage your client database and contacts</p>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-maroon-700 text-white px-4 py-2 rounded-lg hover:bg-maroon-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Client
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div key={client.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-800 mb-2">{client.name}</h3>
                {client.company_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Building className="w-4 h-4" />
                    {client.company_name}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Phone className="w-4 h-4" />
                  {client.phone}
                </div>
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    {client.email}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => openModal(client)}
                  className="flex-1 flex items-center justify-center gap-2 bg-maroon-100 text-maroon-700 px-4 py-2 rounded-lg hover:bg-maroon-200 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(client.id)}
                  className="flex items-center justify-center bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {clients.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 mb-4">No clients yet. Add your first client!</p>
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
              <div className="bg-maroon-700 text-white px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {editingClient ? 'Edit Client' : 'New Client'}
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
                        Client Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Secondary Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.secondary_phone}
                        onChange={(e) => setFormData({ ...formData, secondary_phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-600 focus:border-transparent outline-none"
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
                      placeholder="Private notes about this client"
                    />
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
                  Save Client
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
