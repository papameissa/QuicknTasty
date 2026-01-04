import React, { useState } from 'react';
import { CreditCard, Smartphone, Save, AlertCircle, CheckCircle } from 'lucide-react';

interface PaymentSettings {
  wave_enabled: boolean;
  wave_api_key: string;
  wave_secret_key: string;
  card_enabled: boolean;
  card_api_key: string;
  card_merchant_id: string;
}

const PaymentIntegration: React.FC = () => {
  const [settings, setSettings] = useState<PaymentSettings>({
    wave_enabled: false,
    wave_api_key: '',
    wave_secret_key: '',
    card_enabled: false,
    card_api_key: '',
    card_merchant_id: ''
  });

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = () => {
    // Validation
    if (settings.wave_enabled && (!settings.wave_api_key || !settings.wave_secret_key)) {
      setError('Veuillez remplir tous les champs Wave');
      return;
    }
    if (settings.card_enabled && (!settings.card_api_key || !settings.card_merchant_id)) {
      setError('Veuillez remplir tous les champs Carte bancaire');
      return;
    }

    // TODO: Sauvegarder dans Supabase
    console.log('💾 Saving payment settings:', settings);
    
    setSaved(true);
    setError('');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Intégration des paiements
          </h1>
          <p className="text-gray-600">
            Configurez vos méthodes de paiement Wave et Carte bancaire
          </p>
        </div>

        {/* Success/Error Messages */}
        {saved && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800">Configuration enregistrée avec succès !</span>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Wave Payment */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Smartphone className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Wave</h2>
                  <p className="text-sm text-gray-600">Paiement mobile via Wave</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.wave_enabled}
                  onChange={(e) => setSettings({ ...settings, wave_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {settings.wave_enabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <input
                    type="text"
                    value={settings.wave_api_key}
                    onChange={(e) => setSettings({ ...settings, wave_api_key: e.target.value })}
                    placeholder="wave_sn_prod_xxxxxxxxxxxxxx"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secret Key
                  </label>
                  <input
                    type="password"
                    value={settings.wave_secret_key}
                    onChange={(e) => setSettings({ ...settings, wave_secret_key: e.target.value })}
                    placeholder="••••••••••••••••••••"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Comment obtenir vos clés Wave :</strong>
                  </p>
                  <ol className="mt-2 text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Connectez-vous à votre compte Wave Business</li>
                    <li>Allez dans Paramètres → API</li>
                    <li>Copiez votre API Key et Secret Key</li>
                    <li>Collez-les dans les champs ci-dessus</li>
                  </ol>
                </div>
              </div>
            )}
          </div>

          {/* Card Payment */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Carte bancaire</h2>
                  <p className="text-sm text-gray-600">Visa, Mastercard, American Express</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.card_enabled}
                  onChange={(e) => setSettings({ ...settings, card_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {settings.card_enabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <input
                    type="text"
                    value={settings.card_api_key}
                    onChange={(e) => setSettings({ ...settings, card_api_key: e.target.value })}
                    placeholder="pk_live_xxxxxxxxxxxxxx"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Merchant ID
                  </label>
                  <input
                    type="text"
                    value={settings.card_merchant_id}
                    onChange={(e) => setSettings({ ...settings, card_merchant_id: e.target.value })}
                    placeholder="merchant_xxxxxxxxxxxxxx"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-800">
                    <strong>Fournisseurs de paiement supportés :</strong>
                  </p>
                  <ul className="mt-2 text-sm text-purple-700 space-y-1 list-disc list-inside">
                    <li>Stripe (Recommandé)</li>
                    <li>PayPal</li>
                    <li>Cinetpay (Afrique)</li>
                    <li>PayTech (Sénégal)</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2 font-medium"
            >
              <Save className="h-5 w-5" />
              <span>Enregistrer la configuration</span>
            </button>
          </div>

          {/* Test Payment Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Tester l'intégration
            </h3>
            <p className="text-gray-600 mb-4">
              Une fois vos clés configurées, testez le paiement avec une commande test.
            </p>
            <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
              Effectuer un paiement test
            </button>
          </div>

          {/* Documentation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              📚 Documentation
            </h3>
            <div className="space-y-2">
              <a
                href="https://docs.wave.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-700 hover:text-blue-800 underline"
              >
                → Documentation Wave API
              </a>
              <a
                href="https://stripe.com/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-700 hover:text-blue-800 underline"
              >
                → Documentation Stripe (Carte bancaire)
              </a>
              <a
                href="https://cinetpay.com/documentation"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-700 hover:text-blue-800 underline"
              >
                → Documentation Cinetpay (Afrique)
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentIntegration;
