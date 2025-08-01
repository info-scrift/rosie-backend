// import { NextFunction, Request, Response } from 'express';
// import { supabaseAuth } from '../config/supabaseclient';

// // Extend Express Request
// declare global {
//   namespace Express {
//     interface Request {
//       user?: any;
//     }
//   }
// }

// export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const authHeader = req.headers.authorization;
//     console.log('[AuthMiddleware] Authorization Header:', authHeader);

//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       console.warn('[AuthMiddleware] Missing or invalid Bearer token format');
//       return res.status(401).json({ message: 'Authorization header missing or invalid' });
//     }

//     const token = authHeader.replace('Bearer ', '').trim();
//     console.log('[AuthMiddleware] Extracted Token:', token);

//     const { data, error } = await supabaseAuth.auth.getUser(token);

//     if (error) {
//       console.error('[AuthMiddleware] Supabase auth.getUser error:', error);
//       return res.status(401).json({ message: 'Invalid or expired token' });
//     }

//     if (!data?.user) {
//       console.warn('[AuthMiddleware] No user returned from Supabase');
//       return res.status(401).json({ message: 'Invalid or expired token' });
//     }

//     console.log('[AuthMiddleware] Authenticated User:', data.user);
//     req.user = data.user;
//     next();
//   } catch (err: any) {
//     console.error('[AuthMiddleware] Unexpected error:', err.message);
//     return res.status(401).json({ message: 'Authentication required' });
//   }
// };

import { NextFunction, Request, Response } from 'express';
import { supabase, supabaseAuth } from '../config/supabaseclient';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(401).json({ message: 'Authorization header missing or invalid' });
//     }

//     const token = authHeader.replace('Bearer ', '').trim();
//     const { data, error } = await supabaseAuth.auth.getUser(token);

//     if (error || !data?.user) {
//       return res.status(401).json({ message: 'Invalid or expired token' });
//     }

//     const userId = data.user.id;
//     const { data: profile, error: profileError } = await supabase
//       .from('profiles')
//       .select('role')
//       .eq('user_id', userId)
//       .single();

//     if (profileError) {
//       return res.status(401).json({ message: 'User role not found' });
//     }

//     req.user = {
//       ...data.user,
//       role: profile.role,
//     };

//     next();
//   } catch (err: any) {
//     return res.status(401).json({ message: 'Authentication failed' });
//   }
// };


export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing or invalid' });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const { data, error } = await supabaseAuth.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const userId = data.user.id;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      console.warn('[AuthMiddleware] No profile found for user:', userId);
      return res.status(401).json({ message: 'User role not found' });
    }

    req.user = {
      ...data.user,
      role: profile.role,
    };

    next();
  } catch (err: any) {
    return res.status(401).json({ message: 'Authentication failed' });
  }
};
