import React, { useState, useEffect } from 'react';
import { Coffee, MapPin, ShoppingCart, Clock, Users, Heart, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import MenuModal from '../components/MenuModal';
import CartModal from '../components/CartModal';
import OrderModal from '../components/OrderModal';
import LocationFinder from '../components/LocationFinder';

interface HomePageProps {
  onShowLogin: () => void;
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

const HomePage: React.FC<HomePageProps> = ({ onShowLogin }) => {
  const { itemCount } = useCart();
  const [showMenu, setShowMenu] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [showLocationFinder, setShowLocationFinder] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('available', true)
        .order('category');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (data && data.length > 0) {
        setMenuItems(data);
      } else {
        console.warn('No menu items found in database, using mock data');
        setMenuItems(getMockMenuItems());
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setMenuItems(getMockMenuItems());
    } finally {
      setLoading(false);
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

  const quickies = menuItems.filter(item => item.category === 'quickies');

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Coffee className="h-8 w-8 text-orange-500 mr-2" />
              <span className="text-2xl font-bold text-gray-900">Quick'n'Tasty</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowMenu(true)}
                className="text-gray-700 hover:text-orange-500 transition-colors"
              >
                Menu
              </button>
              <button
                onClick={onShowLogin}
                className="text-gray-700 hover:text-orange-500 transition-colors"
              >
                Se connecter
              </button>
              <button
                onClick={() => setShowCart(true)}
                className="relative p-2 text-gray-700 hover:text-orange-500 transition-colors"
              >
                <ShoppingCart className="h-6 w-6" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Quick'n'Tasty
          </h1>
          <p className="text-xl md:text-2xl mb-4 opacity-90">
            Rapide. Savoureux. Convivial.
          </p>
          <p className="text-lg max-w-3xl mx-auto mb-8 opacity-80">
            Bienvenue chez Quick'nTasty, l'adresse incontournable pour vos pauses gourmandes. 
            Que ce soit pour un café du matin, un déjeuner rapide ou une douceur sucrée dans l'après-midi, 
            nous avons ce qu'il vous faut. Ici, la rapidité rencontre le goût, pour une expérience simple, 
            chaleureuse et délicieuse.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => setShowMenu(true)}
              className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Découvrir notre menu
            </button>
            <button
              onClick={() => setShowOrder(true)}
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors"
            >
              Commander en ligne
            </button>
          </div>
        </div>
      </section>

      {/* Quickies Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nos Quickies - Le produit phare de Quick'n'Tasty
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Découvrez nos petites bouchées uniques, parfaites à partager ou à savourer seul. 
              Sucrées ou salées, nos Quickies sont préparées fraîchement pour vous offrir 
              des saveurs authentiques et gourmandes.
            </p>
          </div>
          
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickies.slice(0, 6).map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <img
                    src={item.image_url || 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop'}
                    alt={item.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-orange-600 font-bold text-lg">{item.price.toFixed(2)} FCFA</span>
                      <button
                        onClick={() => setShowMenu(true)}
                        className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        Voir plus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Notre concept</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-orange-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Rapide</h3>
              <p className="text-gray-600">
                Un service efficace pour s'adapter à vos journées chargées.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Heart className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Savoureux</h3>
              <p className="text-gray-600">
                Des recettes gourmandes, préparées avec des ingrédients de qualité.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Convivial</h3>
              <p className="text-gray-600">
                Un lieu où chacun peut se sentir chez soi, seul ou entre amis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Location Finder */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Trouver un Quick'nTasty
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Trouvez le Quick'nTasty le plus proche de vous et profitez d'une pause gourmande où que vous soyez.
          </p>
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="h-5 w-5 text-orange-500" />
              <span className="font-semibold">Quick'nTasty Mouit</span>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Centre-ville de Mouit<br />
              Ouvert tous les jours 7h-22h
            </p>
            <button 
              onClick={() => {
                // Coordonnées du restaurant (à remplacer par les vraies coordonnées)
                const latitude = 14.6928; // Exemple: Dakar
                const longitude = -17.4467;
                const restaurantName = "Quick'nTasty Mouit";
                
                // Ouvrir Google Maps avec l'itinéraire
                const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${encodeURIComponent(restaurantName)}`;
                window.open(mapsUrl, '_blank');
              }}
              className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Voir l'itinéraire
            </button>
            <button 
              onClick={() => setShowLocationFinder(true)}
              className="w-full mt-2 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Trouver le plus proche
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Coffee className="h-8 w-8 text-orange-500 mr-2" />
                <span className="text-xl font-bold">Quick'n'Tasty</span>
              </div>
              <p className="text-gray-400">
                L'adresse incontournable pour vos pauses gourmandes.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Liens utiles</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => setShowMenu(true)} className="hover:text-white">Menu</button></li>
                <li><a href="#" className="hover:text-white">Nos valeurs</a></li>
                <li><a href="#" className="hover:text-white">Trouver un Quick'nTasty</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Commander</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => setShowOrder(true)} className="hover:text-white">Click & Collect</button></li>
                <li><button onClick={() => setShowOrder(true)} className="hover:text-white">Livraison</button></li>
                <li><a href="#" className="hover:text-white">Commande programmée</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Newsletter</h3>
              <p className="text-gray-400 text-sm mb-4">
                Recevez nos actus et nos nouveautés gourmandes directement par mail !
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Votre email"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-l-lg focus:outline-none focus:border-orange-500"
                />
                <button className="bg-orange-500 px-4 py-2 rounded-r-lg hover:bg-orange-600 transition-colors">
                  OK
                </button>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2025 Quick'n'Tasty. Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showMenu && <MenuModal onClose={() => setShowMenu(false)} />}
      {showCart && <CartModal onClose={() => setShowCart(false)} onCheckout={() => {
        setShowCart(false);
        setShowOrder(true);
      }} />}
      {showOrder && <OrderModal onClose={() => setShowOrder(false)} />}
      {showLocationFinder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Localisation Quick'n'Tasty</h2>
              <button
                onClick={() => setShowLocationFinder(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <LocationFinder />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;