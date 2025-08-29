import { Request, Response } from 'express';
import {
    deleteJob,
    getJobById,
    listJobsByCompany
} from '../services/companyService';

import { supabase } from "../config/supabaseclient";

// Helpers
const toArray = (v: unknown): string[] => {
    if (v == null) return [];
    if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean);
    return String(v)
        .split(/\r?\n|;|,|•|-/g)
        .map(s => s.trim())
        .filter(Boolean);
};

const normalizeEmploymentType = (v?: string) => {
    if (!v) return undefined;
    const map: Record<string, "Onsite" | "Remote" | "Hybrid"> = {
        onsite: "Onsite",
        "on-site": "Onsite",
        remote: "Remote",
        hybrid: "Hybrid",
    };
    return map[v.toLowerCase().trim()] ?? v;
};

const normalizeJobType = (v?: string) => {
    if (!v) return undefined;
    const map: Record<string, "Full-time" | "Part-time" | "Internship" | "Contract"> = {
        "full-time": "Full-time",
        "part-time": "Part-time",
        internship: "Internship",
        contract: "Contract",
    };
    return map[v.toLowerCase().trim()] ?? v;
};

/**
 * @swagger
 * /api/company/jobs:
 *   post:
 *     summary: Create a new job (company-authenticated)
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
 *               - location
 *               - employment_type
 *               - job_type
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Senior Software Engineer"
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *                 example: "San Francisco, CA"
 *               employment_type:
 *                 type: string
 *                 enum: [Onsite, Hybrid, Remote]
 *                 example: "Remote"
 *               job_type:
 *                 type: string
 *                 enum: [Full-time, Part-time, Internship, Contract]
 *                 example: "Full-time"
 *               requirements:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["5+ years of experience", "React", "Node.js"]
 *               responsibilities:
 *                 type: array
 *                 items: { type: string }
 *               benefits:
 *                 type: array
 *                 items: { type: string }
 *               salary_min:
 *                 type: number
 *                 example: 120000
 *               salary_max:
 *                 type: number
 *                 example: 160000
 *               tags:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["React", "AWS"]
 *               industry:
 *                 type: string
 *                 example: "Technology"
 *     responses:
 *       201:
 *         description: Job created
 *       400:
 *         description: Error creating job
 */
export const createJobHandler = async (req: Request, res: Response) => {
    const companyId = req.user?.id;
    if (!companyId) return res.status(401).json({ message: "Unauthorized" });

    try {
        const {
            title,
            description,
            location,
            employment_type,
            job_type,
            requirements,
            responsibilities,
            benefits,
            tags,
            salary_min,
            salary_max,
            industry,
            featured,
            urgent,
        } = req.body;

        const empType = normalizeEmploymentType(employment_type);
        if (!empType) {
            return res.status(400).json({ message: "employment_type is required (Onsite, Hybrid, Remote)" });
        }

        const jobType = normalizeJobType(job_type);
        if (!jobType) {
            return res.status(400).json({ message: "job_type is required (Full-time, Part-time, Internship, Contract)" });
        }

        // derive remote flag
        const remote = empType === "Remote";

        const { data, error } = await supabase
            .from("jobs")
            .insert([
                {
                    company_id: companyId,
                    title,
                    description,
                    location,
                    employment_type: empType,
                    job_type: jobType,
                    requirements: toArray(requirements),
                    responsibilities: toArray(responsibilities),
                    benefits: toArray(benefits),
                    tags: toArray(tags),
                    salary_min,
                    salary_max,
                    industry,
                    remote,
                    featured: !!featured,
                    urgent: !!urgent,
                    is_active: true,
                },
            ])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ message: "Job created", job: data });
    } catch (err: any) {
        console.error("createJobHandler error:", err);
        res.status(400).json({ message: err.message || "Error creating job" });
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
 *     summary: Update a job (must belong to company) — accepts the same payload as create
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
 *             $ref: '#/components/schemas/JobPayload'
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

        // Pull the same fields as create (all optional here, but same shape)
        const {
            title,
            description,
            location,
            employment_type,
            job_type,
            requirements,
            responsibilities,
            benefits,
            tags,
            salary_min,
            salary_max,
            industry,
            featured,
            urgent,
        } = req.body ?? {};

        const updates: Record<string, any> = {};

        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (location !== undefined) updates.location = location;

        if (employment_type !== undefined) {
            const empType = normalizeEmploymentType(employment_type);
            if (!empType || !["Onsite", "Hybrid", "Remote"].includes(empType)) {
                return res.status(400).json({ message: "employment_type must be one of: Onsite, Hybrid, Remote" });
            }
            updates.employment_type = empType;
            updates.remote = empType === "Remote"; // enforce remote flag
        }

        if (job_type !== undefined) {
            const jt = normalizeJobType(job_type);
            if (!jt || !["Full-time", "Part-time", "Internship", "Contract"].includes(jt)) {
                return res.status(400).json({ message: "job_type must be one of: Full-time, Part-time, Internship, Contract" });
            }
            updates.job_type = jt;
        }

        if (requirements !== undefined) updates.requirements = toArray(requirements);
        if (responsibilities !== undefined) updates.responsibilities = toArray(responsibilities);
        if (benefits !== undefined) updates.benefits = toArray(benefits);
        if (tags !== undefined) updates.tags = toArray(tags);

        if (salary_min !== undefined) updates.salary_min = salary_min;
        if (salary_max !== undefined) updates.salary_max = salary_max;
        if (industry !== undefined) updates.industry = industry;

        if (featured !== undefined) updates.featured = !!featured;
        if (urgent !== undefined) updates.urgent = !!urgent;

        const { data, error } = await supabase
            .from("jobs")
            .update(updates)
            .eq("id", jobId)
            .select()
            .single();

        if (error) throw error;

        res.json({ message: 'Job updated', job: data });
    } catch (error: any) {
        console.error("updateJobHandler error:", error);
        res.status(400).json({ message: error.message || "Invalid input" });
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
