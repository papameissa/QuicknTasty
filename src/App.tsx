import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import LoadingSpinner from './components/LoadingSpinner';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import Dashboard from './components/Dashboard';
import { User } from '@supabase/supabase-js';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        getUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        getUserRole(session.user.id);
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const getUserRole = async (userId: string) => {
    try {
      console.log('🔍 Fetching role for user:', userId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      console.log('📊 Role query result:', { data, error });

      if (error) {
        console.error('❌ Error fetching user role:', error);
        setUserRole('client');
        return;
      }
      
      const role = data?.role || 'client';
      console.log('✅ User role set to:', role);
      setUserRole(role);
    } catch (error) {
      console.error('❌ Exception fetching user role:', error);
      setUserRole('client');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (showLogin) {
    return (
      <AuthProvider>
        <LoginPage onBack={() => setShowLogin(false)} />
      </AuthProvider>
    );
  }

  if (user && userRole) {
    return (
      <AuthProvider>
        <Dashboard user={user} role={userRole} />
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <CartProvider>
        <HomePage onShowLogin={() => setShowLogin(true)} />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;