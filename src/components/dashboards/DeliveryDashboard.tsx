import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { Truck, CheckCircle, MapPin, Lock } from 'lucide-react';
import ChangePasswordModal from '../ChangePasswordModal';

interface DeliveryDashboardProps {
  user: User;
  userProfile: any;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  delivery_type: string;
  pickup_code?: string;
  guest_name?: string;
  guest_phone?: string;
  guest_address?: string;
  created_at: string;
}

const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({ user, userProfile }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    fetchOrders();
    
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
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('delivery_type', 'delivery')
        .in('status', ['ready', 'delivering', 'delivered'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      fetchOrders();
    } catch (error) {
      console.error('Error:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const readyOrders = orders.filter(o => o.status === 'ready');
  const deliveringOrders = orders.filter(o => o.status === 'delivering');
  const deliveredToday = orders.filter(o => {
    if (o.status !== 'delivered') return false;
    const today = new Date().toDateString();
    return new Date(o.created_at).toDateString() === today;
  });

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              🚚 Espace Livreur - {userProfile?.full_name}
            </h1>
            <p className="text-gray-600">
              Gérez vos livraisons et suivez vos courses en temps réel.
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-purple-50 rounded-lg shadow p-6 border-2 border-purple-200">
          <div className="flex items-center">
            <MapPin className="h-10 w-10 text-purple-600" />
            <div className="ml-4">
              <div className="text-3xl font-bold text-purple-900">
                {readyOrders.length}
              </div>
              <div className="text-purple-700 font-medium">Prêtes à livrer</div>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg shadow p-6 border-2 border-blue-200">
          <div className="flex items-center">
            <Truck className="h-10 w-10 text-blue-600" />
            <div className="ml-4">
              <div className="text-3xl font-bold text-blue-900">
                {deliveringOrders.length}
              </div>
              <div className="text-blue-700 font-medium">En cours</div>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg shadow p-6 border-2 border-green-200">
          <div className="flex items-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
            <div className="ml-4">
              <div className="text-3xl font-bold text-green-900">
                {deliveredToday.length}
              </div>
              <div className="text-green-700 font-medium">Livrées aujourd'hui</div>
            </div>
          </div>
        </div>
      </div>

      {/* Prêtes à livrer */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-purple-900">📦 Commandes prêtes à livrer</h2>
        {readyOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucune commande prête à livrer</p>
        ) : (
          <div className="space-y-4">
            {readyOrders.map(order => (
              <div key={order.id} className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="font-bold text-xl text-purple-900">#{order.id.slice(-8)}</span>
                      {order.pickup_code && (
                        <span className="bg-orange-500 text-white px-3 py-1 rounded font-mono font-bold">
                          {order.pickup_code}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-900">
                        👤 {order.guest_name || 'Client'}
                      </div>
                      <div className="text-sm text-gray-700">
                        📞 {order.guest_phone || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-700">
                        📍 {order.guest_address || 'Adresse non fournie'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xl text-purple-900">
                      {order.total_amount.toFixed(2)} FCFA
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => updateOrderStatus(order.id, 'delivering')}
                  className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors font-bold"
                >
                  🚚 Prendre en charge
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* En cours de livraison */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-blue-900">🚚 Livraisons en cours</h2>
        {deliveringOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucune livraison en cours</p>
        ) : (
          <div className="space-y-4">
            {deliveringOrders.map(order => (
              <div key={order.id} className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="font-bold text-xl text-blue-900">#{order.id.slice(-8)}</span>
                      {order.pickup_code && (
                        <span className="bg-orange-500 text-white px-3 py-1 rounded font-mono font-bold">
                          {order.pickup_code}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-900">
                        👤 {order.guest_name || 'Client'}
                      </div>
                      <div className="text-sm text-gray-700">
                        📞 {order.guest_phone || 'N/A'}
                      </div>
                      <div className="text-sm text-blue-700 font-medium">
                        📍 {order.guest_address || 'Adresse non fournie'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xl text-blue-900">
                      {order.total_amount.toFixed(2)} FCFA
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => updateOrderStatus(order.id, 'delivered')}
                  className="w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-colors font-bold"
                >
                  ✅ Confirmer la livraison
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Livrées aujourd'hui */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-green-900">✅ Livraisons effectuées aujourd'hui</h2>
        {deliveredToday.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucune livraison effectuée aujourd'hui</p>
        ) : (
          <div className="space-y-3">
            {deliveredToday.map(order => (
              <div key={order.id} className="border border-green-200 rounded-lg p-3 bg-green-50">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-green-900">#{order.id.slice(-8)}</span>
                    <span className="text-sm text-gray-600 ml-2">- {order.guest_name || 'Client'}</span>
                  </div>
                  <div className="font-bold text-green-900">
                    {order.total_amount.toFixed(2)} FCFA
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  );
};

export default DeliveryDashboard;
