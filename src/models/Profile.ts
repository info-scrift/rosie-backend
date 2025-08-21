export interface Profile {
  id?: string;
  user_id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  website?: string;
  location?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProfileData {
  user_id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  website?: string;
  location?: string;
  role?: string;
  resume_url?: string | null;
  skills?: string[];

} 