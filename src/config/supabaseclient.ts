import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is required');
}
if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}
if (!supabaseAnonKey) {
    throw new Error('SUPABASE_ANON_KEY is required');
}

// Service role client for admin operations (bypasses RLS)
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Anon client for auth operations
export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);


const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Must be the secret key
);