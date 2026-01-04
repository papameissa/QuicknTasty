import React, { useState, useEffect } from 'react';
import { X, Plus, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';

interface MenuModalProps {
  onClose: () => void;
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

const MenuModal: React.FC<MenuModalProps> = ({ onClose }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  const categories = [
    { id: 'all', name: 'Tout' },
    { id: 'quickies', name: 'Quickies ⭐' },
    { id: 'hot-drinks', name: 'Boissons chaudes' },
    { id: 'cold-drinks', name: 'Boissons froides' },
    { id: 'sandwiches', name: 'Sandwichs & En-cas' },
    { id: 'sweets', name: 'Douceurs' }
  ];

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
      
      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      // Fallback to mock data when database is unavailable
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
    },
    {
      id: '7',
      name: 'Sandwich Jambon-Fromage',
      description: 'Pain frais, jambon de qualité et fromage fondant',
      price: 2000,
      category: 'sandwiches',
      image_url: 'https://images.pexels.com/photos/1603901/pexels-photo-1603901.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
      available: true
    },
    {
      id: '8',
      name: 'Croissant aux Amandes',
      description: 'Croissant feuilleté garni de crème d\'amandes',
      price: 1200,
      category: 'sweets',
      image_url: 'https://images.pexels.com/photos/205961/pexels-photo-205961.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
      available: true
    }
  ];

  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const handleAddToCart = (item: MenuItem) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Notre Menu</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Categories */}
        <div className="p-6 border-b">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-6 overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Aucun produit disponible dans cette catégorie.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img
                      src={item.image_url || 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop'}
                      alt={item.name}
                      className="w-full h-48 object-cover"
                    />
                    {item.category === 'quickies' && (
                      <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded-lg text-xs font-semibold flex items-center">
                        <Star className="h-3 w-3 mr-1" />
                        Phare
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-orange-600 font-bold text-lg">
                        {item.price.toFixed(2)} FCFA
                      </span>
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-1"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Ajouter</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuModal;