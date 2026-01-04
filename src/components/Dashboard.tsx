import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { CartProvider } from '../contexts/CartContext';
import ClientDashboard from './dashboards/ClientDashboard';
import EmployeeDashboard from './dashboards/EmployeeDashboard';
import ChefDashboard from './dashboards/ChefDashboard';
import DeliveryDashboard from './dashboards/DeliveryDashboard';
import OwnerDashboard from './dashboards/OwnerDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import { Coffee, LogOut, User as UserIcon } from 'lucide-react';

interface DashboardProps {
  user: User;
  role: string;
}

const Dashboard: React.FC<DashboardProps> = ({ user, role }) => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, [user.id]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const renderDashboard = () => {
    switch (role) {
      case 'client':
        return (
          <CartProvider>
            <ClientDashboard user={user} userProfile={userProfile} />
          </CartProvider>
        );
      case 'employee':
        // Router selon le type d'employé
        if (userProfile?.employee_type === 'cuisinier') {
          return <ChefDashboard user={user} userProfile={userProfile} />;
        } else if (userProfile?.employee_type === 'livreur') {
          return <DeliveryDashboard user={user} userProfile={userProfile} />;
        } else {
          // Dashboard général si pas de type spécifié
          return <EmployeeDashboard user={user} userProfile={userProfile} />;
        }
      case 'owner':
        return <OwnerDashboard user={user} userProfile={userProfile} />;
      case 'admin':
        return <AdminDashboard user={user} userProfile={userProfile} />;
      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-600">Rôle non reconnu: {role}</p>
          </div>
        );
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'client': return 'Client';
      case 'employee': return 'Employé';
      case 'owner': return 'Propriétaire';
      case 'admin': return 'Administrateur';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Coffee className="h-8 w-8 text-orange-500 mr-2" />
              <span className="text-2xl font-bold text-gray-900">Quick'n'Tasty</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {userProfile?.full_name || user.email}
                </span>
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                  {getRoleLabel(role)}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {renderDashboard()}
      </main>
    </div>
  );
};

export default Dashboard;