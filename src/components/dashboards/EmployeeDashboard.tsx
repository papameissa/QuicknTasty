import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { Clock, CheckCircle, AlertCircle, Package, Lock } from 'lucide-react';
import ChangePasswordModal from '../ChangePasswordModal';

interface EmployeeDashboardProps {
  user: User;
  userProfile: any;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  delivery_type: string;
  pickup_code?: string;
  scheduled_for?: string;
  preparation_time?: number;
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

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ user, userProfile }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    fetchOrders();
    
    // Subscribe to real-time order updates
    const subscription = supabase
      .channel('orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    // Polling de secours (toutes les 10 secondes)
    const interval = setInterval(() => {
      fetchOrders();
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      console.log('🔍 [Employee] Fetching orders...');
      console.log('🔍 [Employee] User ID:', user.id);
      console.log('🔍 [Employee] User Profile:', userProfile);
      
      // Requête simplifiée sans jointure
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ [Employee] Error fetching orders:', error);
        throw error;
      }
      
      console.log('✅ [Employee] Orders fetched:', data?.length);
      console.log('📦 [Employee] Orders data:', data);
      setOrders(data || []);
    } catch (error) {
      console.error('❌ [Employee] Exception fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (error) throw error;
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getStatusLabel = (status: string) => {
    const statuses = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      preparing: 'En préparation',
      ready: 'Prête',
      delivering: 'En livraison',
      delivered: 'Livrée',
      cancelled: 'Annulée'
    };
    return statuses[status as keyof typeof statuses] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      ready: 'bg-green-100 text-green-800',
      delivering: 'bg-purple-100 text-purple-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredOrders = selectedStatus === 'all' 
    ? orders  // Afficher TOUTES les commandes sans filtre
    : orders.filter(order => order.status === selectedStatus);

  const activeOrders = orders.filter(order => !['delivered', 'cancelled'].includes(order.status));

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Interface Employé - {userProfile?.full_name}
            </h1>
            <p className="text-gray-600">
              Gérez les commandes et suivez leur progression en temps réel.
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {orders.filter(o => o.status === 'pending').length}
              </div>
              <div className="text-gray-600">Nouvelles</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {orders.filter(o => o.status === 'preparing').length}
              </div>
              <div className="text-gray-600">En préparation</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {orders.filter(o => o.status === 'ready').length}
              </div>
              <div className="text-gray-600">Prêtes</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {orders.filter(o => o.status === 'delivered').length}
              </div>
              <div className="text-gray-600">Livrées aujourd'hui</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex space-x-1 mb-6">
          {[
            { id: 'all', label: 'Toutes', count: orders.length },
            { id: 'pending', label: 'En attente', count: orders.filter(o => o.status === 'pending').length },
            { id: 'confirmed', label: 'Confirmées', count: orders.filter(o => o.status === 'confirmed').length },
            { id: 'preparing', label: 'En préparation', count: orders.filter(o => o.status === 'preparing').length },
            { id: 'ready', label: 'Prêtes', count: orders.filter(o => o.status === 'ready').length },
            { id: 'delivering', label: 'En livraison', count: orders.filter(o => o.status === 'delivering').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedStatus === tab.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Aucune commande à afficher</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-lg">#{order.id.slice(-8)}</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                      {order.pickup_code && (
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm font-mono">
                          {order.pickup_code}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <strong>Client:</strong> {order.guest_name || 'Client anonyme'}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Contact:</strong> {order.guest_phone || 'N/A'}
                    </div>
                    {order.guest_address && (
                      <div className="text-sm text-gray-600">
                        <strong>Adresse:</strong> {order.guest_address}
                      </div>
                    )}
                    {order.scheduled_for && (
                      <div className="text-sm text-blue-600 font-medium">
                        📅 Programmée: {new Date(order.scheduled_for).toLocaleString()}
                      </div>
                    )}
                    <div className="text-sm text-gray-600">
                      {order.delivery_type === 'delivery' ? '🚚 Livraison' : '📦 Click & Collect'}
                    </div>
                    {order.preparation_time && order.preparation_time > 0 && (
                      <div className="text-sm text-green-600">
                        ⏱️ Temps de préparation: {order.preparation_time} min
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xl text-orange-600 mb-1">
                      {order.total_amount.toFixed(2)} FCFA
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'confirmed')}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      ✅ Confirmer la commande
                    </button>
                  )}
                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Commencer la préparation
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Marquer comme prête
                    </button>
                  )}
                  {order.status === 'ready' && order.delivery_type === 'delivery' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'delivering')}
                      className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                    >
                      Confier au livreur
                    </button>
                  )}
                  {order.status === 'ready' && order.delivery_type === 'pickup' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Client récupéré
                    </button>
                  )}
                  {order.status === 'delivering' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Confirmer livraison
                    </button>
                  )}
                  {['confirmed', 'preparing'].includes(order.status) && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Annuler
                    </button>
                  )}
                  {order.delivery_type === 'delivery' && order.guest_address && (
                    <button
                      onClick={() => window.open(`https://www.google.com/maps/dir/Quick'n'Tasty+Mouit/${encodeURIComponent(order.guest_address || order.users?.address || '')}`, '_blank')}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Voir itinéraire
                    </button>
                  )}
                  <button className="text-gray-500 text-sm hover:text-gray-700">
                    Voir détails
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Password Modal */}
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  );
};

export default EmployeeDashboard;