import { Request, Response } from 'express';
import { LoginCredentials } from '../models/User';
import { loginService, registerCompanyService, signupService } from '../services/authService';
import { getOriginUrl } from '../utils/getURL';
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new company account
 *     tags: [Auth]
 *     description: Creates a new Supabase auth user, saves the company profile, and returns the access token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - company_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: company@example.com
 *               password:
 *                 type: string
 *                 example: SecurePass123
 *               company_name:
 *                 type: string
 *                 example: Acme Inc.
 *               industry:
 *                 type: string
 *                 example: Software
 *               company_size:
 *                 type: string
 *                 example: 51-200
 *               website:
 *                 type: string
 *                 example: https://www.acme.com
 *               description:
 *                 type: string
 *                 example: We build scalable tech solutions.
 *               contact_person:
 *                 type: string
 *                 example: Jane Doe
 *               phone:
 *                 type: string
 *                 example: "+1-800-123-4567"
 *               address:
 *                 type: string
 *                 example: 123 Acme St, San Francisco, CA
 *     responses:
 *       201:
 *         description: Company registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user_id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 access_token:
 *                   type: string
 *                 companyProfile:
 *                   type: object
 *       400:
 *         description: Missing or invalid input
 */

export const registerCompany = async (req: Request, res: Response) => {
  const {
    email,
    password,
    company_name,
    industry,
    company_size,
    website,
    description,
    contact_person,
    phone,
    address
  } = req.body;

  if (!email || !password || !company_name) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const { user, session, companyProfile } = await registerCompanyService(email, password, {
      company_name,
      industry,
      company_size,
      website,
      description,
      contact_person,
      phone,
      address
    });

    res.status(201).json({
      message: 'Company registered successfully',
      user_id: user.id,
      email: user.email,
      access_token: session?.access_token,
      companyProfile
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Company registration failed' });
  }
};

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
        message: 'Signup successful.',
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

    var loginrole = loginResult.user.role;
    let redirecturl = getOriginUrl();
    if (loginrole == 'applicant') {
      redirecturl += '/jobs'
    }
    else {
      redirecturl += '/companydashboard'
    }
    // Optionally: redirect URL (return instead of redirect directly)

    res.status(200).json({
      message: 'Login successful',
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      user,
      redirect: `${redirecturl}`
    });
    console.log(user)
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(401).json({ message: error.message || 'Login failed' });
  }
};