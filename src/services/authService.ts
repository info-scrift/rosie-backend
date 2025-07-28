import { supabase, supabaseAuth } from '../config/supabaseclient';
import { CreateProfileData } from '../models/Profile';
import { LoginCredentials } from '../models/User';

export interface SignupResponse {
  user: any;
  session: any;
}

export interface LoginResponse {
  user: any;
  session: any;
}
export const signupService = async (
  email: string,
  password: string,
  role: string
): Promise<SignupResponse> => {
  const { data, error } = await supabaseAuth.auth.signUp({ email, password });

  if (error) {
    console.error('Supabase Auth Error:', error);
    throw error;
  }

  if (data.user) {
    const profileData: CreateProfileData = {
      user_id: data.user.id,
      email: data.user.email!,
      role
    };

    let { error: profileError } = await supabase
      .from('profiles')
      .insert([profileData]);

    if (profileError) {
      console.log('Profile insert failed, trying to update:', profileError.message);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role })
        .eq('user_id', data.user.id);

      if (updateError) {
        console.error('Failed to update profile:', updateError);
      }
    }
  }

  return {
    user: data.user,
    session: data.session
  };
};


export const loginService = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const { email, password } = credentials;

  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return {
    user: data.user,
    session: data.session,
  };
};
