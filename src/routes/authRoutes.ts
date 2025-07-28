import express from 'express';
import { login, signupUser } from '../controllers/authController';

const router = express.Router();

router.post('/login', login);

router.post('/signup', signupUser);

export default router;
