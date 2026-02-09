import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      quotations: {
        Row: {
          id: string;
          quotation_number: string;
          client_name: string;
          client_phone: string;
          client_email: string | null;
          event_date: string;
          event_type: string;
          event_venue: string | null;
          number_of_guests: number;
          subtotal: number;
          tax_percentage: number;
          tax_amount: number;
          discount_percentage: number;
          discount_amount: number;
          grand_total: number;
          status: string;
          notes: string | null;
          terms_and_conditions: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['quotations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['quotations']['Insert']>;
      };
      quotation_items: {
        Row: {
          id: string;
          quotation_id: string;
          item_type: string;
          item_name: string;
          description: string | null;
          unit_price: number;
          quantity: number;
          total: number;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['quotation_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['quotation_items']['Insert']>;
      };
      quotation_responses: {
        Row: {
          id: string;
          quotation_id: string;
          response_type: string;
          response_message: string | null;
          responded_at: string;
        };
        Insert: Omit<Database['public']['Tables']['quotation_responses']['Row'], 'id' | 'responded_at'>;
        Update: Partial<Database['public']['Tables']['quotation_responses']['Insert']>;
      };
    };
  };
};
