
import { Request, Response } from 'express';
import {
    createApplicantProfile,
    deleteApplicantProfile,
    getApplicantProfile,
    updateApplicantProfile,
    uploadApplicantResume
} from '../services/applicantService';
/**
 * @swagger
 * /api/applicant/profile/upload:
 *   post:
 *     summary: Upload applicant resume (PDF)
 *     tags: [Applicant]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - resume
 *             properties:
 *               resume:
 *                 type: string
 *                 format: binary
 *                 description: PDF file to upload
 *     responses:
 *       200:
 *         description: Resume uploaded and profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 resume_url:
 *                   type: string
 *       400:
 *         description: Resume missing or invalid
 *       500:
 *         description: Upload failed or server error
 */
export const submitApplicantProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const resume = req.file;
        if (!resume) {
            return res.status(400).json({ message: 'Resume file is required (PDF).' });
        }

        // ✅ Fetch existing profile
        const profile = await getApplicantProfile(userId);

        // ✅ Upload using profile info
        const resumeUrl = await uploadApplicantResume({
            userId,
            profileId: profile.id, // fetched from DB
            resumeFile: resume,
            firstName: profile.first_name,
            lastName: profile.last_name
        });

        // ✅ Update resume_url in DB
        const updatedProfile = await updateApplicantProfile(userId, { resume_url: resumeUrl });

        res.status(200).json({
            message: 'Resume uploaded and profile updated successfully',
            resume_url: resumeUrl,
            profile: updatedProfile
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Something went wrong' });
    }
};

/**
 * @swagger
 * /api/applicant/profile:
 *   post:
 *     summary: Create applicant profile with resume
 *     tags: [Applicant]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - resume
 *               - first_name
 *               - last_name
 *               - email
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               address:
 *                 type: string
 *               skills:
 *                 type: array
 *               experience_years:
 *                 type: integer
 *               email:
 *                 type: string
 *               resume:
 *                 type: string
 *                 format: binary
 *                 description: PDF resume file
 *     responses:
 *       201:
 *         description: Profile created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

export const createApplicantProfileHandler = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const email = req.user?.email;

    if (!userId || !email) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!req.body.first_name || !req.body.last_name) {
        return res.status(400).json({ message: 'First name and last name are required' });
    }
    const resume = req.file;
    if (!resume) {
        return res.status(400).json({ message: 'Resume file is required (PDF).' });
    }
    let skills = req.body.skills;

    if (typeof skills === 'string') {
        try {
            skills = JSON.parse(skills); // expects a JSON array
        } catch {
            skills = [skills]; // fallback: treat as single-item array
        }
    }
    try {
        // Step 1: Create profile without resume_url
        const profileData = {
            ...req.body,
            skills,
            resume_url: null,
        };

        const profile = await createApplicantProfile(userId, email, profileData);

        // Step 2: Upload resume using profile fields for proper naming
        const resume_url = await uploadApplicantResume({
            userId,
            profileId: profile.id,
            resumeFile: resume,
            firstName: req.body.first_name,
            lastName: req.body.last_name
        });

        // Step 3: Update profile with resume URL
        // const updatedProfile = await updateApplicantProfile(userId, { resume_url });
        const updatedProfile = await updateApplicantProfile(profile.id, { resume_url });

        res.status(201).json({
            message: 'Profile created successfully',
            profile: updatedProfile
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Failed to create profile' });
    }
};


/**
 * @swagger
 * /api/applicant/profile:
 *   get:
 *     summary: Get applicant profile
 *     tags: [Applicant]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Applicant profile fetched
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
export const readApplicantProfile = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const profile = await getApplicantProfile(userId);
        res.status(200).json({ profile });
    } catch (error: any) {
        res.status(404).json({ message: error.message || 'Profile not found' });
    }
};
/**
 * @swagger
 * /api/applicant/profile:
 *   put:
 *     summary: Update applicant profile
 *     tags: [Applicant]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               experience_years:
 *                 type: integer
 *              
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */

export const updateApplicantProfileHandler = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const updatedProfile = await updateApplicantProfile(userId, req.body);
        res.status(200).json({
            message: 'Profile updated successfully',
            profile: updatedProfile
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};


/**
 * @swagger
 * /api/applicant/profile:
 *   delete:
 *     summary: Delete applicant profile
 *     tags: [Applicant]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile deleted successfully
 *       401:
 *         description: Unauthorized
 */
export const deleteApplicantProfileHandler = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const result = await deleteApplicantProfile(userId);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};