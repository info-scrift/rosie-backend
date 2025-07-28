import { Request, Response } from 'express';
import { LoginCredentials } from '../models/User';
import { loginService, signupService } from '../services/authService';
/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Sign up a new user with a specific role
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: strongpassword123
 *               role:
 *                 type: string
 *                 enum: [applicant, recruiter, admin]
 *                 example: applicant
 *     responses:
 *       201:
 *         description: User signed up successfully or pending email verification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Signup successful. Please check your email to verify your account.
 *                 email:
 *                   type: string
 *                   example: user@example.com
 *                 requires_email_verification:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   description: Supabase user object
 *                 session:
 *                   type: object
 *                   description: Supabase session object
 *       400:
 *         description: Invalid request or signup failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email, password, and role are required.
 */

export const signupUser = async (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Email, password, and role are required.' });
  }

  try {
    const result = await signupService(email, password, role);

    if (!result.session) {
      return res.status(201).json({
        message: 'Signup successful. Please check your email to verify your account.',
        email: result.user?.email,
        requires_email_verification: true
      });
    }

    res.status(201).json({
      message: 'User signed up successfully',
      user: result.user,
      session: result.session
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Signup failed' });
  }
};



/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in an existing user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 access_token:
 *                   type: string
 *                 refresh_token:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Invalid email or password
 */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const credentials: LoginCredentials = { email, password };
    const loginResult = await loginService(credentials);

    const { user, session } = loginResult;

    if (!session?.access_token) {
      return res.status(500).json({ message: 'No token returned from Supabase.' });
    }


    // Optionally: redirect URL (return instead of redirect directly)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173/dashboard';

    res.status(200).json({
      message: 'Login successful',
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      user,
      redirect: `${frontendUrl}?token=${session.access_token}`
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(401).json({ message: error.message || 'Login failed' });
  }
};