import { Request, Response } from 'express';
import {
    filterJobs,
    getAllJobs,
    getJobById,
    searchJobsByTitle
} from '../services/publicJobService';
/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get all jobs (public)
 *     tags: [Public Jobs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination (10 jobs per page)
 *     responses:
 *       200:
 *         description: List of jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "uuid-string"
 *                   title:
 *                     type: string
 *                     example: "Software Engineer"
 *                   description:
 *                     type: string
 *                     example: "Responsible for backend development"
 *                   location:
 *                     type: string
 *                     example: "New York"
 *                   industry:
 *                     type: string
 *                     example: "Technology"
 *       500:
 *         description: Server error
 */

// GET /api/jobs - paginated
export const getAllJobsHandler = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;

    try {
        const jobs = await getAllJobs(page, limit);
        res.json(jobs);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get a job by ID (public)
 *     tags: [Public Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the job
 *     responses:
 *       200:
 *         description: Job data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "uuid-string"
 *                 title:
 *                   type: string
 *                   example: "Software Engineer"
 *                 description:
 *                   type: string
 *                   example: "Backend API work"
 *       404:
 *         description: Job not found
 *       500:
 *         description: Server error
 */

// GET /api/jobs/:id - single job by ID
export const getJobByIdHandler = async (req: Request, res: Response) => {
    try {
        const job = await getJobById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        res.json(job);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
/**
 * @swagger
 * /api/jobs/search:
 *   get:
 *     summary: Search jobs by title (public)
 *     tags: [Public Jobs]
 *     parameters:
 *       - in: query
 *         name: title
 *         required: true
 *         schema:
 *           type: string
 *         description: Job title to search for
 *     responses:
 *       200:
 *         description: Matching job list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *       400:
 *         description: Title query is required
 *       500:
 *         description: Server error
 */

// GET /api/jobs/search?title=
export const searchJobsHandler = async (req: Request, res: Response) => {
    const title = req.query.title as string;
    if (!title) return res.status(400).json({ message: 'Title query required' });

    try {
        const jobs = await searchJobsByTitle(title);
        res.json(jobs);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
/**
 * @swagger
 * /api/jobs/filter:
 *   get:
 *     summary: Filter jobs by location, industry, and job type (public)
 *     tags: [Public Jobs]
 *     parameters:
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Location to filter
 *       - in: query
 *         name: industry
 *         schema:
 *           type: string
 *         description: Industry to filter
 *       - in: query
 *         name: urgent
 *         schema:
 *           type: boolean
 *         description: Filter urgent jobs only
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter featured jobs only
 *       - in: query
 *         name: remote
 *         schema:
 *           type: boolean
 *         description: Filter remote jobs only
 *     responses:
 *       200:
 *         description: Filtered jobs list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Server error
 */

// GET /api/jobs/filter?location=&industry=&urgent=&featured=&remote=
export const filterJobsHandler = async (req: Request, res: Response) => {
    const filters = {
        location: req.query.location as string,
        industry: req.query.industry as string,
        urgent: req.query.urgent === 'true',
        featured: req.query.featured === 'true',
        remote: req.query.remote === 'true',
    };

    try {
        const jobs = await filterJobs(filters);
        res.json(jobs);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
