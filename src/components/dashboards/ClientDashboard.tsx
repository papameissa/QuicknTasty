import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { Clock, MapPin, Star, Package, Phone, ShoppingCart, Plus, Lock } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import MenuModal from '../MenuModal';
import CartModal from '../CartModal';
import OrderModal from '../OrderModal';
import ChangePasswordModal from '../ChangePasswordModal';

interface ClientDashboardProps {
  user: User;
  userProfile: any;
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
  updated_at: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  available: boolean;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ user, userProfile }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const { itemCount, addItem } = useCart();

  useEffect(() => {
    fetchOrders();
    fetchMenuItems();
  }, [user.id]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('available', true)
        .order('category');
      
      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      // Fallback to mock data when database is unavailable
      setMenuItems(getMockMenuItems());
    }
  };

  const getMockMenuItems = (): MenuItem[] => [
    {
      id: '1',
      name: 'Quickie Classique',
      description: 'Notre signature : pain artisanal, garniture savoureuse et sauce maison',
      price: 1500,
      category: 'quickies',
      image_url: 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
      available: true
    },
    {
      id: '2',
      name: 'Quickie Épicé',
      description: 'Pour les amateurs de sensations fortes, avec notre sauce pimentée',
      price: 1700,
      category: 'quickies',
      image_url: 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
      available: true
    },
    {
      id: '3',
      name: 'Quickie Végétarien',
      description: 'Délicieux mélange de légumes frais et fromage fondant',
      price: 1400,
      category: 'quickies',
      image_url: 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
      available: true
    },
    {
      id: '4',
      name: 'Café Expresso',
      description: 'Café corsé et aromatique, torréfaction artisanale',
      price: 800,
      category: 'hot-drinks',
      image_url: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
      available: true
    },
    {
      id: '5',
      name: 'Thé à la Menthe',
      description: 'Thé vert parfumé à la menthe fraîche',
      price: 600,
      category: 'hot-drinks',
      image_url: 'https://images.pexels.com/photos/230477/pexels-photo-230477.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
      available: true
    },
    {
      id: '6',
      name: 'Jus d\'Orange Frais',
      description: 'Jus d\'orange pressé à la minute',
      price: 1000,
      category: 'cold-drinks',
      image_url: 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
      available: true
    }
  ];

  const handleAddToCart = (item: MenuItem) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url
    });
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

  const currentOrders = orders.filter(order => 
    !['delivered', 'cancelled'].includes(order.status)
  );

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Bonjour {userProfile?.full_name || 'Client'} !
            </h1>
            <p className="text-gray-600">
              Suivez vos commandes et découvrez vos statistiques Quick'n'Tasty.
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <Lock className="h-4 w-4" />
              <span>Mot de passe</span>
            </button>
            <button
              onClick={() => setShowMenu(true)}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
            >
              <Package className="h-4 w-4" />
              <span>Menu</span>
            </button>
            <button
              onClick={() => setShowCart(true)}
              className="relative bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Panier</span>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowOrder(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Commander</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Menu Preview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Menu Quick'n'Tasty</h2>
          <button
            onClick={() => setShowMenu(true)}
            className="text-orange-500 hover:text-orange-600 text-sm"
          >
            Voir tout le menu →
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.slice(0, 6).map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <img
                src={item.image_url || 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop'}
                alt={item.name}
                className="w-full h-32 object-cover rounded-lg mb-3"
              />
              <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.description}</p>
              <div className="flex justify-between items-center">
                <span className="font-bold text-orange-600">{item.price.toFixed(2)} FCFA</span>
                <button
                  onClick={() => handleAddToCart(item)}
                  className="bg-orange-500 text-white px-3 py-1 rounded-lg hover:bg-orange-600 transition-colors text-sm flex items-center space-x-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Orders */}
      {currentOrders.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-orange-500" />
            Commandes en cours
          </h2>
          <div className="space-y-4">
            {currentOrders.map(order => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium">Commande #{order.id.slice(-8)}</span>
                    <div className="flex items-center mt-1">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {order.delivery_type === 'delivery' ? 'Livraison' : 'Click & Collect'}
                      </span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-orange-600">
                    {order.total_amount.toFixed(2)} FCFA
                  </span>
                  {order.pickup_code && (
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Code de récupération</div>
                      <div className="font-bold text-orange-600">{order.pickup_code}</div>
                    </div>
                  )}
                </div>
                {order.scheduled_for && (
                  <div className="mt-2 text-sm text-blue-600">
                    📅 Programmée pour le {new Date(order.scheduled_for).toLocaleString()}
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="text-orange-500 text-sm hover:text-orange-600"
                  >
                    Voir détails
                  </button>
                  {order.status === 'delivering' && (
                    <button className="text-blue-500 text-sm hover:text-blue-600 flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      Contacter livreur
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Package className="h-5 w-5 mr-2 text-orange-500" />
          Historique des commandes
        </h2>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Aucune commande pour le moment</p>
            <p className="text-sm text-gray-500">Votre première commande apparaîtra ici !</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium">#{order.id.slice(-8)}</span>
                  <div className="text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-orange-600">
                    {order.total_amount.toFixed(2)} FCFA
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
              </div>
            ))}
            {orders.length > 5 && (
              <button className="w-full text-orange-500 text-sm hover:text-orange-600 py-2">
                Voir toutes les commandes ({orders.length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">{orders.length}</div>
          <div className="text-gray-600">Commandes totales</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {orders.filter(o => o.status === 'delivered').length}
          </div>
          <div className="text-gray-600">Commandes livrées</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {orders.reduce((sum, order) => sum + order.total_amount, 0).toFixed(0)} FCFA
          </div>
          <div className="text-gray-600">Total dépensé</div>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              Commande #{selectedOrder.id.slice(-8)}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusLabel(selectedOrder.status)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Type:</span>
                <span>{selectedOrder.delivery_type === 'delivery' ? 'Livraison' : 'Click & Collect'}</span>
              </div>
              <div className="flex justify-between">
                <span>Montant:</span>
                <span className="font-bold">{selectedOrder.total_amount.toFixed(2)} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span>Commandé le:</span>
                <span>{new Date(selectedOrder.created_at).toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
              >
                Fermer
              </button>
              {selectedOrder.status === 'delivered' && (
                <button className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 flex items-center justify-center">
                  <Star className="h-4 w-4 mr-1" />
                  Noter
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showMenu && <MenuModal onClose={() => setShowMenu(false)} />}
      {showCart && <CartModal onClose={() => setShowCart(false)} onCheckout={() => {
        setShowCart(false);
        setShowOrder(true);
      }} />}
      {showOrder && <OrderModal onClose={() => setShowOrder(false)} />}
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  );
};

export default ClientDashboard;