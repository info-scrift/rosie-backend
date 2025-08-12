import { supabase, supabaseAuth } from '../config/supabaseclient';
import { CreateProfileData } from '../models/Profile';
import { LoginCredentials } from '../models/User';

export interface SignupResponse {
  user: any;
  session: any;
}

export interface LoginResponse {
  user: {
    email: string;
    role: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    // any other fields 
  };
}

export const registerCompanyService = async (
  email: string,
  password: string,
  companyData: {
    company_name: string;
    industry: string;
    company_size: string;
    website: string;
    description: string;
    contact_person: string;
    phone: string;
    address: string;
  }
) => {
  console.log('in company service')
  // Step 1: Create Supabase Auth user
  // const { data, error } = await supabase.auth.signUp({ email, password });
  const { data, error } = await supabaseAuth.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'company'
      }
    }
  });

  console.log('Signup result:', { user: data.user, session: data.session });

  if (error || !data.user) throw error;

  console.log('advnaced from null check')
  const user = data.user;
  await supabase.auth.admin.updateUserById(user.id, {
    email_confirm: true
  });
  console.log('ser email as active check')

  // Step 2: Insert into 'profiles' table with role = company
  const { error: profileError } = await supabase
    .from('profiles')
    .insert([{ user_id: user.id, email, role: 'company' }]);

  if (profileError) throw profileError;

  // Step 3: Insert into 'company_profile' with matching user ID
  const { error: companyError, data: companyProfile } = await supabase
    .from('company_profiles')
    .insert([{ ...companyData, id: user.id }])
    .select()
    .single();

  if (companyError) throw companyError;

  return {
    user,
    session: data.session,
    companyProfile
  };
};
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


// export const loginService = async (credentials: LoginCredentials): Promise<LoginResponse> => {
//   const { email, password } = credentials;

//   const { data, error } = await supabaseAuth.auth.signInWithPassword({
//     email,
//     password,
//   });

//   if (error) throw error;

//   return {
//     user: data.user,
//     session: data.session,
//   };
// };


export const loginService = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  const { email, password } = credentials;

  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  const { user, session } = data;

  if (!user || !session) {
    throw new Error('Invalid login response');
  }

  // Fetch user profile from the `profiles` table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email, role')
    .eq('user_id', user.id)
    .single();

  if (profileError) {
    throw new Error('Failed to fetch user profile: ' + profileError.message);
  }

  return {
    user: profile, // custom profile, not the raw auth user
    session,
  };
};
