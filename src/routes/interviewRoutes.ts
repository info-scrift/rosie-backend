import express from 'express';
import { authMiddleware } from "../middlewares/authMiddleware";
import { evaluateInterview, generateQuestions } from '../controllers/interviewController';
const router = express.Router();

router.post('/generate-questions', generateQuestions);
router.post('/evaluate-interview', evaluateInterview);

export default router;
