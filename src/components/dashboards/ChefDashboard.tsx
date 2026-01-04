import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { Clock, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import ChangePasswordModal from '../ChangePasswordModal';

interface ChefDashboardProps {
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
  created_at: string;
}

const ChefDashboard: React.FC<ChefDashboardProps> = ({ user, userProfile }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    fetchOrders();
    
    // Supabase Realtime (temps réel)
    const subscription = supabase
      .channel('orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    // Polling de secours (toutes les 10 secondes)
    const interval = setInterval(() => {
      fetchOrders();
    }, 10000); // 10 secondes

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
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

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const confirmedOrders = orders.filter(o => o.status === 'confirmed');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

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
              👨‍🍳 Espace Cuisinier - {userProfile?.full_name}
            </h1>
            <p className="text-gray-600">
              Gérez les préparations et suivez vos commandes en temps réel.
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
        <div className="bg-yellow-50 rounded-lg shadow p-6 border-2 border-yellow-200">
          <div className="flex items-center">
            <AlertCircle className="h-10 w-10 text-yellow-600" />
            <div className="ml-4">
              <div className="text-3xl font-bold text-yellow-900">
                {pendingOrders.length}
              </div>
              <div className="text-yellow-700 font-medium">Nouvelles</div>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg shadow p-6 border-2 border-orange-200">
          <div className="flex items-center">
            <Clock className="h-10 w-10 text-orange-600" />
            <div className="ml-4">
              <div className="text-3xl font-bold text-orange-900">
                {preparingOrders.length}
              </div>
              <div className="text-orange-700 font-medium">En préparation</div>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg shadow p-6 border-2 border-green-200">
          <div className="flex items-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
            <div className="ml-4">
              <div className="text-3xl font-bold text-green-900">
                {readyOrders.length}
              </div>
              <div className="text-green-700 font-medium">Prêtes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Nouvelles commandes (pending) */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-yellow-900">⚡ Nouvelles commandes - À CONFIRMER PAR APPEL</h2>
        {pendingOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucune nouvelle commande</p>
        ) : (
          <div className="space-y-4">
            {pendingOrders.map(order => (
              <div key={order.id} className="border-2 border-yellow-200 rounded-lg p-4 bg-yellow-50">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-xl text-yellow-900">#{order.id.slice(-8)}</span>
                      {order.pickup_code && (
                        <span className="bg-orange-500 text-white px-3 py-1 rounded font-mono font-bold">
                          {order.pickup_code}
                        </span>
                      )}
                      {order.payment_method === 'cash' && (
                        <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                          💵 CASH
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-gray-900 mt-2">
                      👤 {order.guest_name || 'Client anonyme'}
                    </div>
                    <div className="text-sm font-bold text-blue-600 mt-1 flex items-center">
                      📞 {order.guest_phone || 'Pas de téléphone'}
                    </div>
                    <div className="text-sm text-gray-700 mt-1">
                      {order.delivery_type === 'delivery' ? '🚚 Livraison' : '📦 Click & Collect'}
                      {order.delivery_type === 'delivery' && order.guest_address && (
                        <span className="block text-xs text-gray-600 mt-1">📍 {order.guest_address}</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Commandé à {new Date(order.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xl text-yellow-900">
                      {order.total_amount.toFixed(2)} FCFA
                    </div>
                    {order.payment_method === 'cash' && (
                      <div className="text-xs text-green-600 font-semibold mt-1">
                        À payer livraison
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Bouton d'appel */}
                {order.guest_phone && (
                  <a
                    href={`tel:${order.guest_phone}`}
                    className="w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-colors font-bold flex items-center justify-center mb-2"
                  >
                    📞 Appeler le client - {order.guest_phone}
                  </a>
                )}
                
                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-2 text-sm">
                  <p className="font-semibold text-blue-900 mb-1">⚠️ IMPORTANT - Confirmation obligatoire :</p>
                  <ol className="text-blue-800 space-y-1 ml-4 list-decimal">
                    <li>Appeler le client au numéro ci-dessus</li>
                    <li>Confirmer la commande et le montant ({order.total_amount.toFixed(2)} FCFA)</li>
                    {order.payment_method === 'cash' && (
                      <li className="font-semibold">Rappeler que le paiement est en CASH à la livraison</li>
                    )}
                    <li>Si OK → Cliquer "Confirmer et préparer"</li>
                    <li>Si problème → Contacter le gérant</li>
                  </ol>
                </div>
                
                <button
                  onClick={() => updateOrderStatus(order.id, 'confirmed')}
                  className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors font-bold"
                >
                  ✅ Client appelé et confirmé - Préparer la commande
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmées - À Préparer */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-blue-900">📋 Commandes confirmées</h2>
        {confirmedOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucune commande confirmée</p>
        ) : (
          <div className="space-y-4">
            {confirmedOrders.map(order => (
              <div key={order.id} className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-xl text-blue-900">#{order.id.slice(-8)}</span>
                      {order.pickup_code && (
                        <span className="bg-orange-500 text-white px-3 py-1 rounded font-mono font-bold">
                          {order.pickup_code}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-gray-900 mt-1">
                      👤 {order.guest_name || 'Client anonyme'}
                    </div>
                    <div className="text-sm text-gray-700 mt-1">
                      {order.delivery_type === 'delivery' ? '🚚 Livraison' : '📦 Click & Collect'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Commandé à {new Date(order.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xl text-blue-900">
                      {order.total_amount.toFixed(2)} FCFA
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => updateOrderStatus(order.id, 'preparing')}
                  className="w-full bg-orange-500 text-white px-4 py-3 rounded-lg hover:bg-orange-600 transition-colors font-bold"
                >
                  🔥 Commencer la préparation
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* En Préparation */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-orange-900">🔥 En cours de préparation</h2>
        {preparingOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucune commande en préparation</p>
        ) : (
          <div className="space-y-4">
            {preparingOrders.map(order => (
              <div key={order.id} className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-xl text-orange-900">#{order.id.slice(-8)}</span>
                      {order.pickup_code && (
                        <span className="bg-orange-500 text-white px-3 py-1 rounded font-mono font-bold">
                          {order.pickup_code}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-700 mt-1">
                      {order.delivery_type === 'delivery' ? '🚚 Livraison' : '📦 Click & Collect'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xl text-orange-900">
                      {order.total_amount.toFixed(2)} FCFA
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => updateOrderStatus(order.id, 'ready')}
                  className="w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-colors font-bold"
                >
                  ✅ Marquer comme prête
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prêtes */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-green-900">✅ Commandes prêtes</h2>
        {readyOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucune commande prête</p>
        ) : (
          <div className="space-y-4">
            {readyOrders.map(order => (
              <div key={order.id} className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-xl text-green-900">#{order.id.slice(-8)}</span>
                      {order.pickup_code && (
                        <span className="bg-orange-500 text-white px-3 py-1 rounded font-mono font-bold">
                          {order.pickup_code}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-700 mt-1">
                      {order.delivery_type === 'delivery' ? '🚚 En attente du livreur' : '📦 En attente du client'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xl text-green-900">
                      {order.total_amount.toFixed(2)} FCFA
                    </div>
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

export default ChefDashboard;
