import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { Users, Settings, Package, TrendingUp, Plus, Edit, Trash2, Eye, Lock } from 'lucide-react';
import ChangePasswordModal from '../ChangePasswordModal';

interface AdminDashboardProps {
  user: User;
  userProfile: any;
}

interface UserData {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  created_at: string;
  user_roles?: {
    role: string;
  };
}

interface MenuItem {
  image_url: string;
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  created_at: string;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  payment_status: string;
  delivery_type: string;
  pickup_code?: string;
  scheduled_for?: string;
  created_at: string;
  guest_name?: string;
  guest_phone?: string;
  guest_address?: string;
  users?: {
    full_name: string;
    phone: string;
    address?: string;
  };
}
const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, userProfile }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<UserData[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);

  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'quickies',
    available: true,
    image_url: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch users from user_profiles (direct access, no admin API needed)
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select(`
          id,
          full_name,
          phone,
          address,
          role,
          created_at
        `)
        .order('created_at', { ascending: false });
      
      if (usersError) {
        console.error('Error fetching users:', usersError);
      }

      // Get auth.users data separately using RPC or just show user_profiles
      // For now, we'll just use user_profiles which is enough
      const usersWithEmailPlaceholder = (usersData || []).map(profile => ({
        ...profile,
        email: 'Voir dans Supabase' // Placeholder since we can't access auth.users from client
      }));

      // Fetch menu items
      const { data: menuData, error: menuError } = await supabase
        .from('menu_items')
        .select('*')
        .order('category');
      
      if (menuError) {
        console.error('Error fetching menu:', menuError);
      }

      // Fetch ALL orders (simplified query)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
      }

      console.log('Fetched users:', usersWithEmailPlaceholder?.length);
      console.log('Fetched orders:', ordersData?.length);

      setUsers(usersWithEmailPlaceholder || []);
      setMenuItems(menuData || []);
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleCreateMenuItem = async () => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .insert({
          ...newMenuItem,
          image_url: newMenuItem.image_url || 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop'
        });

      if (error) throw error;

      setNewMenuItem({ name: '', description: '', price: 0, category: 'quickies', available: true, image_url: '' });
      setShowMenuModal(false);
      fetchAllData();
    } catch (error: any) {
      alert('Erreur lors de la création de l\'article: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    try {
      // Supprimer l'utilisateur via l'API admin
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;

      fetchAllData();
      alert('Utilisateur supprimé avec succès!');
    } catch (error: any) {
      alert('Erreur lors de la suppression: ' + error.message);
    }
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return;

    try {
      await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId);

      fetchAllData();
    } catch (error: any) {
      alert('Erreur lors de la suppression: ' + error.message);
    }
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <Users className="h-8 w-8 text-blue-500" />
          <div className="ml-4">
            <div className="text-2xl font-bold text-gray-900">{users.length}</div>
            <div className="text-gray-600">Utilisateurs totaux</div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <Package className="h-8 w-8 text-green-500" />
          <div className="ml-4">
            <div className="text-2xl font-bold text-gray-900">{menuItems.length}</div>
            <div className="text-gray-600">Articles au menu</div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <TrendingUp className="h-8 w-8 text-orange-500" />
          <div className="ml-4">
            <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
            <div className="text-gray-600">Commandes totales</div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <Settings className="h-8 w-8 text-purple-500" />
          <div className="ml-4">
            <div className="text-2xl font-bold text-gray-900">
              {orders.reduce((sum, order) => sum + order.total_amount, 0).toFixed(0)}
            </div>
            <div className="text-gray-600">CA total (FCFA)</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Liste des utilisateurs (lecture seule)</h3>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utilisateur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rôle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Téléphone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date création
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((userData) => (
              <tr key={userData.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {userData.full_name}
                    </div>
                    <div className="text-sm text-gray-500">{userData.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    userData.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    userData.role === 'owner' ? 'bg-blue-100 text-blue-800' :
                    userData.role === 'employee' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {userData.role || 'client'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {userData.phone || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(userData.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleDeleteUser(userData.id)}
                    className="text-red-600 hover:text-red-900 ml-4"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMenuTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Gestion du menu</h3>
        <button
          onClick={() => setShowMenuModal(true)}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nouvel article</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-semibold text-lg">{item.name}</h4>
              <div className="flex space-x-2">
                <button className="text-blue-600 hover:text-blue-800">
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteMenuItem(item.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <img
              src={item.image_url || 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop'}
              alt={item.name}
              className="w-full h-32 object-cover rounded-lg mb-3"
            />
            <p className="text-gray-600 text-sm mb-3">{item.description}</p>
            <div className="flex justify-between items-center">
              <span className="font-bold text-orange-600">{item.price.toFixed(2)} FCFA</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {item.available ? 'Disponible' : 'Indisponible'}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Catégorie: {item.category}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Administration Quick'n'Tasty
            </h1>
            <p className="text-gray-600">
              Supervision complète du système - Connecté en tant que {userProfile?.full_name}
            </p>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
          >
            <Lock className="h-4 w-4" />
            <span>Mot de passe</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp },
              { id: 'users', label: 'Utilisateurs', icon: Users },
              { id: 'menu', label: 'Menu', icon: Package },
              { id: 'orders', label: 'Commandes', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'users' && renderUsersTab()}
          {activeTab === 'menu' && renderMenuTab()}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Gestion des commandes</h3>
              
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commande
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Paiement
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.slice(0, 20).map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              #{order.id.slice(-8)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.delivery_type === 'delivery' ? 'Livraison' : 'Click & Collect'}
                            </div>
                            {order.scheduled_for && (
                              <div className="text-xs text-blue-600">
                                Programmée: {new Date(order.scheduled_for).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {order.guest_name || order.user_profiles?.full_name || 'Anonyme'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.guest_phone || order.user_profiles?.phone || 'N/A'}
                            </div>
                            {(order.guest_address || order.user_profiles?.address) && (
                              <div className="text-xs text-gray-500">
                                {order.guest_address || order.user_profiles?.address}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            {order.pickup_code || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.payment_status === 'confirmed' 
                              ? 'bg-green-100 text-green-800'
                              : order.payment_status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.total_amount.toFixed(2)} FCFA
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Modal */}
      {/* Menu Item Modal */}
      {showMenuModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Créer un article</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nom *"
                value={newMenuItem.name}
                onChange={(e) => setNewMenuItem({...newMenuItem, name: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <textarea
                placeholder="Description *"
                value={newMenuItem.description}
                onChange={(e) => setNewMenuItem({...newMenuItem, description: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={3}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image du produit
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setNewMenuItem({...newMenuItem, image_url: reader.result as string});
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">Ou entrez une URL ci-dessous</p>
                <input
                  type="url"
                  placeholder="URL de l'image (optionnel)"
                  value={newMenuItem.image_url}
                  onChange={(e) => setNewMenuItem({...newMenuItem, image_url: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 mt-2"
                />
              </div>
              <input
                type="number"
                placeholder="Prix (FCFA) *"
                value={newMenuItem.price || ''}
                onChange={(e) => setNewMenuItem({...newMenuItem, price: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                min="0"
                step="100"
              />
              <select
                value={newMenuItem.category}
                onChange={(e) => setNewMenuItem({...newMenuItem, category: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="quickies">Quickies</option>
                <option value="hot-drinks">Boissons chaudes</option>
                <option value="cold-drinks">Boissons froides</option>
                <option value="sandwiches">Sandwichs & En-cas</option>
                <option value="sweets">Douceurs</option>
              </select>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newMenuItem.available}
                  onChange={(e) => setNewMenuItem({...newMenuItem, available: e.target.checked})}
                  className="mr-2"
                />
                <span>Disponible</span>
              </label>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowMenuModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateMenuItem}
                className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  );
};

export default AdminDashboard;