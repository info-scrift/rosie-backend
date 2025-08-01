import express from 'express';
import {
    createJobHandler,
    deleteJobHandler,
    getOwnJobByIdHandler,
    listOwnJobsHandler,
    updateJobHandler
} from '../controllers/companyController';
// import { authMiddleware } from '../middlewares/authMiddleware';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

// All endpoints require company auth
router.use(authMiddleware);

// Company creates a job
router.post('/jobs', createJobHandler);

// Company views all their jobs
router.get('/jobs', listOwnJobsHandler);

// Company views single job
router.get('/jobs/:id', getOwnJobByIdHandler);

// Company updates a job
router.put('/jobs/:id', updateJobHandler);

// Company deletes a job
router.delete('/jobs/:id', deleteJobHandler);

export default router;
