import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please connect to Supabase first.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js/web'
    }
  }
});

export type Database = {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string;
          name: string;
          address: string;
          phone: string;
          latitude?: number;
          longitude?: number;
          created_at: string;
        };
        Insert: {
          name: string;
          address: string;
          phone: string;
          latitude?: number;
          longitude?: number;
        };
        Update: {
          name?: string;
          address?: string;
          phone?: string;
          latitude?: number;
          longitude?: number;
        };
      };
      menu_items: {
        Row: {
          id: string;
          restaurant_id?: string;
          name: string;
          description?: string;
          price: number;
          category: string;
          image_url?: string;
          available: boolean;
          created_at: string;
        };
        Insert: {
          restaurant_id?: string;
          name: string;
          description?: string;
          price: number;
          category: string;
          image_url?: string;
          available?: boolean;
        };
        Update: {
          restaurant_id?: string;
          name?: string;
          description?: string;
          price?: number;
          category?: string;
          image_url?: string;
          available?: boolean;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          role?: string;
          full_name?: string;
          phone?: string;
          address?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: string;
          full_name?: string;
          phone?: string;
          address?: string;
        };
        Update: {
          role?: string;
          full_name?: string;
          phone?: string;
          address?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id?: string;
          guest_name?: string;
          guest_phone?: string;
          guest_address?: string;
          total_amount: number;
          delivery_fee?: number;
          payment_method: string;
          delivery_type: string;
          scheduled_for?: string;
          status?: string;
          payment_status?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id?: string;
          guest_name?: string;
          guest_phone?: string;
          guest_address?: string;
          total_amount: number;
          delivery_fee?: number;
          payment_method: string;
          delivery_type: string;
          scheduled_for?: string;
          status?: string;
          payment_status?: string;
        };
        Update: {
          user_id?: string;
          guest_name?: string;
          guest_phone?: string;
          guest_address?: string;
          total_amount?: number;
          delivery_fee?: number;
          payment_method?: string;
          delivery_type?: string;
          scheduled_for?: string;
          status?: string;
          payment_status?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id?: string;
          quantity: number;
          price: number;
          created_at: string;
        };
        Insert: {
          order_id: string;
          menu_item_id?: string;
          quantity: number;
          price: number;
        };
        Update: {
          quantity?: number;
          price?: number;
        };
      };
    };
  };
};