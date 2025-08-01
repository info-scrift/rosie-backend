import dotenv from 'dotenv';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import applicantRoutes from './routes/applicant';
import authRoutes from './routes/authRoutes';
import companyRoutes from './routes/companyRoutes';

dotenv.config();
console.log('[DEBUG] ENV Loaded:', {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY?.slice(0, 10) + '...',
});
const app = express();
app.use(express.json());

app.get('/', (_req, res) => {
  res.redirect('/api-docs');
});

app.use('/api/auth', authRoutes);
app.use('/api/applicant', applicantRoutes);
app.use('/api/company', companyRoutes)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});