import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Phone } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface LocationFinderProps {
  onLocationSelect?: (location: Location) => void;
  onDeliveryFeeCalculated?: (fee: number) => void;
}

const LocationFinder: React.FC<LocationFinderProps> = ({ 
  onLocationSelect, 
  onDeliveryFeeCalculated 
}) => {
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Quick'n'Tasty locations in Mouit
  const locations: Location[] = [
    {
      id: '1',
      name: 'Quick\'n\'Tasty Mouit Centre',
      address: 'Centre-ville de Mouit, Rue Principale',
      phone: '+221 33 123 45 67',
      hours: 'Ouvert tous les jours 7h-22h',
      coordinates: { lat: 14.7167, lng: -17.4677 }
    },
    {
      id: '2',
      name: 'Quick\'n\'Tasty Mouit Nord',
      address: 'Quartier Nord, Avenue de la Paix',
      phone: '+221 33 123 45 68',
      hours: 'Ouvert tous les jours 6h30-23h',
      coordinates: { lat: 14.7200, lng: -17.4650 }
    },
    {
      id: '3',
      name: 'Quick\'n\'Tasty Mouit Sud',
      address: 'Zone Sud, Boulevard de l\'Indépendance',
      phone: '+221 33 123 45 69',
      hours: 'Ouvert tous les jours 7h-21h',
      coordinates: { lat: 14.7100, lng: -17.4700 }
    }
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par ce navigateur');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(coords);
        
        // Find closest location and calculate delivery fee
        const closest = findClosestLocation(coords);
        setSelectedLocation(closest);
        
        if (onLocationSelect) {
          onLocationSelect(closest);
        }
        
        setLoading(false);
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        setError('Impossible d\'obtenir votre position. Veuillez autoriser la géolocalisation.');
        
        // Default to first location
        setSelectedLocation(locations[0]);
        if (onLocationSelect) {
          onLocationSelect(locations[0]);
        }
        
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const findClosestLocation = (userCoords: {lat: number, lng: number}): Location => {
    let closest = locations[0];
    let minDistance = calculateDistance(userCoords, locations[0].coordinates);

    locations.forEach(location => {
      const distance = calculateDistance(userCoords, location.coordinates);
      if (distance < minDistance) {
        minDistance = distance;
        closest = location;
      }
    });

    // Calculate delivery fee based on distance
    const fee = calculateDeliveryFee(minDistance);
    setDeliveryFee(fee);
    
    if (onDeliveryFeeCalculated) {
      onDeliveryFeeCalculated(fee);
    }

    return closest;
  };

  const calculateDistance = (
    coords1: {lat: number, lng: number}, 
    coords2: {lat: number, lng: number}
  ): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
    const dLng = (coords2.lng - coords1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateDeliveryFee = (distanceKm: number): number => {
    // Base delivery fee: 500 FCFA
    // Additional 100 FCFA per km beyond 2km
    const baseFee = 500;
    const freeDeliveryRadius = 2; // km
    const additionalFeePerKm = 100;

    if (distanceKm <= freeDeliveryRadius) {
      return baseFee;
    }

    const extraDistance = distanceKm - freeDeliveryRadius;
    return baseFee + Math.ceil(extraDistance) * additionalFeePerKm;
  };

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    
    if (userLocation) {
      const distance = calculateDistance(userLocation, location.coordinates);
      const fee = calculateDeliveryFee(distance);
      setDeliveryFee(fee);
      
      if (onDeliveryFeeCalculated) {
        onDeliveryFeeCalculated(fee);
      }
    }
    
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-orange-500" />
          Trouver un Quick'n'Tasty
        </h3>
        <button
          onClick={getCurrentLocation}
          disabled={loading}
          className="flex items-center space-x-2 text-orange-500 hover:text-orange-600 disabled:opacity-50"
        >
          <Navigation className="h-4 w-4" />
          <span className="text-sm">
            {loading ? 'Localisation...' : 'Me localiser'}
          </span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {userLocation && selectedLocation && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            <span>
              Restaurant le plus proche trouvé - Frais de livraison: {deliveryFee} FCFA
            </span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {locations.map((location) => (
          <div
            key={location.id}
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              selectedLocation?.id === location.id
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleLocationSelect(location)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{location.name}</h4>
                <p className="text-gray-600 text-sm mb-2">{location.address}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{location.hours}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    <span>{location.phone}</span>
                  </div>
                </div>
              </div>
              {selectedLocation?.id === location.id && (
                <div className="text-orange-500">
                  <MapPin className="h-5 w-5" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
        <p className="font-medium mb-1">Tarification de la livraison :</p>
        <ul className="space-y-1">
          <li>• Dans un rayon de 2km : 500 FCFA</li>
          <li>• Au-delà de 2km : +100 FCFA par km supplémentaire</li>
          <li>• Click & Collect : Gratuit</li>
        </ul>
      </div>
    </div>
  );
};

export default LocationFinder;