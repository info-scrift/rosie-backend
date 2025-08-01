import express from 'express';
import { login, registerCompany, signupUser } from '../controllers/authController';

const router = express.Router();

router.post('/login', login);

router.post('/signup', signupUser);

router.post('/register', registerCompany);

export default router;
