import React, { useState } from 'react';
import { X, CreditCard, Smartphone, MapPin, User } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import LocationFinder from './LocationFinder';
import OrderCodeDisplay from './OrderCodeDisplay';

interface OrderModalProps {
  onClose: () => void;
}

const OrderModal: React.FC<OrderModalProps> = ({ onClose }) => {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1); // 1: Details, 2: Payment, 3: Confirmation
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [calculatedDeliveryFee, setCalculatedDeliveryFee] = useState<number>(500);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  
  const [orderData, setOrderData] = useState({
    deliveryType: 'delivery', // 'delivery' or 'pickup'
    paymentMethod: 'cash', // 'card', 'wave', or 'cash'
    guestName: '',
    guestPhone: '',
    guestAddress: '',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: '',
    wavePhone: '',
    intouchPhone: '',
    scheduledFor: null as string | null
  });

  const deliveryFee = orderData.deliveryType === 'delivery' ? calculatedDeliveryFee : 0;
  const totalAmount = total + deliveryFee;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setOrderData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmitOrder = async () => {
    // Validation
    if (!user) {
      if (!orderData.guestName || !orderData.guestPhone) {
        alert('Veuillez remplir vos informations ou créer un compte');
        return;
      }
      if (orderData.deliveryType === 'delivery' && !orderData.guestAddress) {
        alert('Veuillez saisir votre adresse de livraison');
        return;
      }
    } else {
      // Validation pour utilisateurs connectés
      if (!orderData.guestPhone) {
        alert('Veuillez entrer votre numéro de téléphone pour la confirmation');
        return;
      }
      if (orderData.deliveryType === 'delivery' && !orderData.guestAddress) {
        alert('Veuillez saisir votre adresse de livraison');
        return;
      }
    }

    if (isScheduled && !scheduledDateTime) {
      alert('Veuillez sélectionner une date et heure pour la commande programmée');
      return;
    }

    setLoading(true);

    try {
      // Préparer les données de commande
      const orderPayload: any = {
        total_amount: totalAmount,
        delivery_fee: deliveryFee,
        payment_method: orderData.paymentMethod,
        delivery_type: orderData.deliveryType,
        scheduled_for: isScheduled ? scheduledDateTime : null,
        status: 'pending',
        payment_status: 'pending'
      };

      // Ajouter les informations utilisateur ou invité
      if (user) {
        orderPayload.user_id = user.id;
        
        // Récupérer le profil utilisateur pour les infos
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('full_name, phone, address')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('Profile fetch error:', profileError);
        }
        
        // Ajouter les infos avec fallback sur l'email si pas de full_name
        orderPayload.guest_name = profile?.full_name || user.email?.split('@')[0] || 'Client';
        orderPayload.guest_phone = profile?.phone || orderData.guestPhone || '';
        
        if (orderData.deliveryType === 'delivery') {
          orderPayload.guest_address = profile?.address || orderData.guestAddress || '';
        }
      } else {
        orderPayload.user_id = null;
        orderPayload.guest_name = orderData.guestName;
        orderPayload.guest_phone = orderData.guestPhone;
        if (orderData.deliveryType === 'delivery') {
          orderPayload.guest_address = orderData.guestAddress;
        }
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select()
        .maybeSingle();

      if (orderError) {
        console.error('Order insert error:', orderError);
        throw orderError;
      }
      if (!order) {
        console.error('No order returned from insert');
        throw new Error('Failed to create order');
      }

      // Générer le code de récupération
      const generatePickupCode = (orderId: string) => {
        const shortId = orderId.slice(-8);
        const numericPart = parseInt(shortId, 16) % 1000000;
        return numericPart.toString().padStart(6, '0');
      };

      const pickupCode = generatePickupCode(order.id);

      // Mettre à jour la commande avec le code de récupération
      await supabase
        .from('orders')
        .update({ pickup_code: pickupCode })
        .eq('id', order.id);

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      setOrderId(order.id);
      setStep(2); // Go to payment step
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Erreur lors de la création de la commande: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);

    try {
      // Si paiement Cash, pas de traitement de paiement
      if (orderData.paymentMethod === 'cash') {
        // Commande créée avec payment_status: 'pending'
        // L'employé appellera pour confirmer
        // Le livreur collectera l'argent
        clearCart();
        setStep(3); // Go to confirmation step
        return;
      }

      // Si Wave ou Carte : Simulation de traitement
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update payment status ONLY (status reste pending)
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'confirmed'
          // status reste 'pending' - sera confirmé par l'employé
        })
        .eq('id', orderId);

      if (error) throw error;

      clearCart();
      setStep(3); // Go to confirmation step
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Détails de la commande</h3>
      
      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium mb-2">Résumé ({items.length} articles)</h4>
        <div className="space-y-2 text-sm">
          {items.map(item => (
            <div key={item.id} className="flex justify-between">
              <span>{item.name} x{item.quantity}</span>
              <span>{(item.price * item.quantity).toFixed(2)} FCFA</span>
            </div>
          ))}
          <div className="border-t pt-2 font-semibold flex justify-between">
            <span>Total</span>
            <span>{totalAmount.toFixed(2)} FCFA</span>
          </div>
        </div>
      </div>

      {/* Delivery Type */}
      <div>
        <label className="block text-sm font-medium mb-2">Type de service</label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="deliveryType"
              value="delivery"
              checked={orderData.deliveryType === 'delivery'}
              onChange={handleInputChange}
              className="mr-3"
            />
            <MapPin className="h-5 w-5 mr-2 text-orange-500" />
            <div>
              <div className="font-medium">Livraison</div>
              <div className="text-xs text-gray-500">+{calculatedDeliveryFee} FCFA</div>
            </div>
          </label>
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="deliveryType"
              value="pickup"
              checked={orderData.deliveryType === 'pickup'}
              onChange={handleInputChange}
              className="mr-3"
            />
            <div>
              <div className="font-medium">Click & Collect</div>
              <div className="text-xs text-gray-500">Gratuit</div>
            </div>
          </label>
        </div>
      </div>

      {/* Location Finder */}
      <LocationFinder 
        onLocationSelect={setSelectedLocation}
        onDeliveryFeeCalculated={setCalculatedDeliveryFee}
      />

      {/* Guest Information */}
      {!user ? (
        <div className="space-y-4">
          <h4 className="font-medium flex items-center">
            <User className="h-5 w-5 mr-2 text-orange-500" />
            Vos informations
          </h4>
          <div className="grid grid-cols-1 gap-4">
            <input
              type="text"
              name="guestName"
              placeholder="Nom complet *"
              value={orderData.guestName}
              onChange={handleInputChange}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <input
              type="tel"
              name="guestPhone"
              placeholder="Téléphone *"
              value={orderData.guestPhone}
              onChange={handleInputChange}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            {orderData.deliveryType === 'delivery' && (
              <input
                type="text"
                name="guestAddress"
                placeholder="Adresse de livraison *"
                value={orderData.guestAddress}
                onChange={handleInputChange}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            )}
          </div>
        </div>
      ) : (
        /* Utilisateur connecté - Afficher aussi le formulaire */
        <div className="space-y-4">
          <h4 className="font-medium flex items-center">
            <User className="h-5 w-5 mr-2 text-orange-500" />
            Vos informations de contact
          </h4>
          <div className="grid grid-cols-1 gap-4">
            <input
              type="tel"
              name="guestPhone"
              placeholder="Téléphone (obligatoire pour confirmation) *"
              value={orderData.guestPhone}
              onChange={handleInputChange}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            {orderData.deliveryType === 'delivery' && (
              <input
                type="text"
                name="guestAddress"
                placeholder="Adresse de livraison *"
                value={orderData.guestAddress}
                onChange={handleInputChange}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            )}
          </div>
        </div>
      )}

      {/* Scheduled Order */}
      <div className="space-y-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={isScheduled}
            onChange={(e) => setIsScheduled(e.target.checked)}
            className="mr-3"
          />
          <span className="font-medium">Commande programmée</span>
        </label>
        
        {isScheduled && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Date et heure souhaitées
            </label>
            <input
              type="datetime-local"
              value={scheduledDateTime}
              onChange={(e) => setScheduledDateTime(e.target.value)}
              min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)} // Minimum 1 heure à l'avance
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Commande minimum 1 heure à l'avance
            </p>
          </div>
        )}
      </div>
      <button
        onClick={handleSubmitOrder}
        disabled={loading}
        className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
      >
        {loading ? 'Création...' : 'Continuer vers le paiement'}
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Paiement ({totalAmount.toFixed(2)} FCFA)</h3>
      
      {/* Payment Method Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Méthode de paiement</label>
        <div className="space-y-3">
          <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-green-50 border-green-500 bg-green-50">
            <input
              type="radio"
              name="paymentMethod"
              value="cash"
              checked={orderData.paymentMethod === 'cash'}
              onChange={handleInputChange}
              className="mr-3"
            />
            <span className="text-2xl mr-2">💵</span>
            <div>
              <span className="font-medium text-green-700">Paiement à la livraison (Cash)</span>
              <p className="text-xs text-green-600 mt-1">Payez en espèces quand vous recevez votre commande</p>
            </div>
          </label>
          
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={orderData.paymentMethod === 'card'}
              onChange={handleInputChange}
              className="mr-3"
            />
            <CreditCard className="h-5 w-5 mr-2 text-blue-500" />
            <span className="font-medium">Carte bancaire</span>
          </label>
          
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="paymentMethod"
              value="wave"
              checked={orderData.paymentMethod === 'wave'}
              onChange={handleInputChange}
              className="mr-3"
            />
            <Smartphone className="h-5 w-5 mr-2 text-blue-500" />
            <span className="font-medium">Wave Mobile Money</span>
          </label>
        </div>
      </div>

      {/* Payment Form */}
      {orderData.paymentMethod === 'cash' ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-2xl mr-3">ℹ️</span>
            <div>
              <h4 className="font-semibold text-green-800 mb-2">Paiement à la livraison</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>✅ Préparez le montant exact : <strong>{totalAmount.toFixed(2)} FCFA</strong></li>
                <li>✅ Un employé vous appellera pour confirmer votre commande</li>
                <li>✅ Payez en espèces au livreur lors de la réception</li>
                <li>⚠️ Assurez-vous d'être disponible au {orderData.guestPhone}</li>
              </ul>
            </div>
          </div>
        </div>
      ) : orderData.paymentMethod === 'card' ? (
        <div className="space-y-4">
          <input
            type="text"
            name="cardName"
            placeholder="Nom sur la carte *"
            value={orderData.cardName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
          <input
            type="text"
            name="cardNumber"
            placeholder="Numéro de carte *"
            value={orderData.cardNumber}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            maxLength={19}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="cardExpiry"
              placeholder="MM/YY *"
              value={orderData.cardExpiry}
              onChange={handleInputChange}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              maxLength={5}
              required
            />
            <input
              type="text"
              name="cardCvv"
              placeholder="CVV *"
              value={orderData.cardCvv}
              onChange={handleInputChange}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              maxLength={4}
              required
            />
          </div>
        </div>
      ) : (
        <div>
          <input
            type="tel"
            name="wavePhone"
            placeholder="Numéro Wave *"
            value={orderData.wavePhone || orderData.intouchPhone}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
          <p className="text-sm text-gray-600 mt-2">
            Vous recevrez une notification Wave pour confirmer le paiement.
          </p>
        </div>
      )}

      <div className="flex space-x-4">
        <button
          onClick={() => setStep(1)}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Retour
        </button>
        <button
          onClick={handlePayment}
          disabled={loading}
          className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Traitement...' : 'Confirmer le paiement'}
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Commande confirmée !</h3>
      <p className="text-gray-600 mb-4">
        Votre commande #{orderId?.slice(-8)} a été enregistrée avec succès.
      </p>
      {orderId && <OrderCodeDisplay orderId={orderId} />}
      <p className="text-sm text-gray-500 mb-6">
        {isScheduled 
          ? `Commande programmée pour le ${new Date(scheduledDateTime).toLocaleString()}`
          : orderData.deliveryType === 'delivery' 
            ? 'Nous préparons votre commande. Livraison estimée : 30-45 minutes.'
            : 'Nous préparons votre commande. Prête dans 15-20 minutes.'}
      </p>
      <button
        onClick={onClose}
        className="bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
      >
        Fermer
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {step === 1 ? 'Commander' : step === 2 ? 'Paiement' : 'Confirmation'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center p-4 bg-gray-50">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-8 h-0.5 ${step > stepNum ? 'bg-orange-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </div>
    </div>
  );
};

export default OrderModal;