export interface LoginCredentials {
  email: string;
  password: string;
}

// Supabase Auth User interface (matches Supabase's User type)
export interface SupabaseUser {
  id: string;
  email?: string;
  created_at: string;
  updated_at?: string;
  aud?: string;
  role?: string;
  email_confirmed_at?: string;
  phone?: string;
  confirmed_at?: string;
  last_sign_in_at?: string;
  app_metadata?: any;
  user_metadata?: any;
  identities?: any[];
  factors?: any[];
}

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: SupabaseUser;
} 