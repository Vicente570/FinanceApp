import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para la base de datos
export interface UserProfile {
  id: string;
  username: string;
  alias: string;
  age: number;
  created_at: string;
  updated_at: string;
}

export interface UserAppData {
  id: string;
  user_id: string;
  data_type: string;
  data: any;
  created_at: string;
  updated_at: string;
}