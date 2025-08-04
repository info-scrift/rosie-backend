import express from 'express';
import {
    filterJobsHandler,
    getAllJobsHandler,
    getJobByIdHandler,
    searchJobsHandler,
} from '../controllers/publicController';

const router = express.Router();

// Specific routes first
router.get('/search', searchJobsHandler); // /api/public/search?title=
router.get('/filter', filterJobsHandler); // /api/public/filter?...

// General route for all jobs
router.get('/', getAllJobsHandler);

// Dynamic route for job by ID must come LAST
router.get('/:id', getJobByIdHandler);

export default router;
