import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface OrderCodeDisplayProps {
  orderId: string;
}

const OrderCodeDisplay: React.FC<OrderCodeDisplayProps> = ({ orderId }) => {
  const [pickupCode, setPickupCode] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPickupCode();
  }, [orderId]);

  const fetchPickupCode = async () => {
    try {
      // Petit délai pour l'UX
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data, error } = await supabase
        .from('orders')
        .select('pickup_code')
        .eq('id', orderId)
        .maybeSingle();

      if (error) throw error;

      // Si le code existe dans la BDD, l'utiliser, sinon le générer
      if (data?.pickup_code) {
        setPickupCode(data.pickup_code);
      } else {
        // Générer le code comme fallback
        const shortId = orderId.slice(-8);
        const numericPart = parseInt(shortId, 16) % 1000000;
        const code = numericPart.toString().padStart(6, '0');
        setPickupCode(code);
      }
    } catch (error) {
      console.error('Error fetching pickup code:', error);
      // En cas d'erreur, générer le code
      const shortId = orderId.slice(-8);
      const numericPart = parseInt(shortId, 16) % 1000000;
      const code = numericPart.toString().padStart(6, '0');
      setPickupCode(code);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-orange-800 mb-2">Code de récupération</h4>
        <div className="text-2xl font-bold text-orange-600 tracking-wider">
          <div className="animate-pulse">Génération...</div>
        </div>
        <p className="text-sm text-orange-700 mt-2">
          Génération du code en cours...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
      <h4 className="font-semibold text-orange-800 mb-2">Code de récupération</h4>
      <div className="text-3xl font-bold text-orange-600 tracking-widest font-mono bg-white rounded px-4 py-3 text-center">
        {pickupCode}
      </div>
      <p className="text-sm text-orange-700 mt-2">
        Présentez ce code pour récupérer votre commande
      </p>
    </div>
  );
};

export default OrderCodeDisplay;