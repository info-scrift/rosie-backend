// import {
//     createJob,
//     deleteJob,
//     getJobById,
//     listJobsByCompany,
//     updateJob
// } from '../services/companyService';

// import { Request, Response } from 'express';

// export const createJobHandler = async (req: Request, res: Response) => {
//     const companyId = req.user?.id;
//     try {
//         const job = await createJob({ ...req.body, company_id: companyId });
//         res.status(201).json({ message: 'Job created', job });
//     } catch (error: any) {
//         res.status(400).json({ message: error.message });
//     }
// };

// export const listOwnJobsHandler = async (req: Request, res: Response) => {
//     try {
//         const jobs = await listJobsByCompany(req.user?.id);
//         res.json(jobs);
//     } catch (error: any) {
//         res.status(500).json({ message: error.message });
//     }
// };

// export const getOwnJobByIdHandler = async (req: Request, res: Response) => {
//     try {
//         const job = await getJobById(req.params.id);
//         if (!job || job.company_id !== req.user?.id) {
//             return res.status(403).json({ message: 'Forbidden' });
//         }
//         res.json(job);
//     } catch (error: any) {
//         res.status(404).json({ message: error.message });
//     }
// };

// export const updateJobHandler = async (req: Request, res: Response) => {
//     const jobId = req.params.id;
//     try {
//         const existing = await getJobById(jobId);
//         if (!existing || existing.company_id !== req.user?.id) {
//             return res.status(403).json({ message: 'Forbidden' });
//         }
//         const updated = await updateJob(jobId, req.body);
//         res.json({ message: 'Job updated', job: updated });
//     } catch (error: any) {
//         res.status(400).json({ message: error.message });
//     }
// };

// export const deleteJobHandler = async (req: Request, res: Response) => {
//     const jobId = req.params.id;
//     try {
//         const job = await getJobById(jobId);
//         if (!job || job.company_id !== req.user?.id) {
//             return res.status(403).json({ message: 'Forbidden' });
//         }
//         await deleteJob(jobId);
//         res.json({ message: 'Job deleted' });
//     } catch (error: any) {
//         res.status(400).json({ message: error.message });
//     }
// };


import { Request, Response } from 'express';
import {
    createJob,
    deleteJob,
    getJobById,
    listJobsByCompany,
    updateJob
} from '../services/companyService';
/**
 * @swagger
 * /api/company/jobs:
 *   post:
 *     summary: Create a new job
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Frontend Developer"
 *               description:
 *                 type: string
 *                 example: "Responsible for developing UI using React"
 *              job_types:
 *                 type:string
 *                   example: "Full-time"
 *     responses:
 *       201:
 *         description: Job created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Job created
 *                 job:
 *                   type: object
 *       400:
 *         description: Error creating job
 */

export const createJobHandler = async (req: Request, res: Response) => {
    const companyId = req.user?.id;
    try {
        const job = await createJob({ ...req.body, company_id: companyId });
        res.status(201).json({ message: 'Job created', job });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * @swagger
 * /api/company/jobs:
 *   get:
 *     summary: Get all jobs created by the authenticated company
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of jobs
 *       500:
 *         description: Server error
 */
export const listOwnJobsHandler = async (req: Request, res: Response) => {
    try {
        const jobs = await listJobsByCompany(req.user?.id);
        res.json(jobs);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @swagger
 * /api/company/jobs/{id}:
 *   get:
 *     summary: Get a single job by ID (must belong to company)
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job data
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Job not found
 */
export const getOwnJobByIdHandler = async (req: Request, res: Response) => {
    try {
        const job = await getJobById(req.params.id);
        if (!job || job.company_id !== req.user?.id) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        res.json(job);
    } catch (error: any) {
        res.status(404).json({ message: error.message });
    }
};

/**
 * @swagger
 * /api/company/jobs/{id}:
 *   put:
 *     summary: Update a job (must belong to company)
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *               salary_range:
 *                 type: string
 *               job_type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Job updated
 *       403:
 *         description: Forbidden
 *       400:
 *         description: Invalid input
 */
export const updateJobHandler = async (req: Request, res: Response) => {
    const jobId = req.params.id;
    try {
        const existing = await getJobById(jobId);
        if (!existing || existing.company_id !== req.user?.id) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const updated = await updateJob(jobId, req.body);
        res.json({ message: 'Job updated', job: updated });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * @swagger
 * /api/company/jobs/{id}:
 *   delete:
 *     summary: Delete a job (must belong to company)
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job deleted
 *       403:
 *         description: Forbidden
 *       400:
 *         description: Deletion failed
 */
export const deleteJobHandler = async (req: Request, res: Response) => {
    const jobId = req.params.id;
    try {
        const job = await getJobById(jobId);
        if (!job || job.company_id !== req.user?.id) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        await deleteJob(jobId);
        res.json({ message: 'Job deleted' });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
