
import { Request, Response } from 'express';
import { supabase } from '../config/supabaseclient';
import {
    createApplicantProfile,
    deleteApplicantProfile,
    getApplicantProfile,
    updateApplicantProfile,
    uploadApplicantResume,
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
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const resume = req.file;
        if (!resume) {
            return res.status(400).json({ message: "Resume file is required (PDF)." });
        }

        // Fetch existing profile (must include: id, first_name, last_name, resume_url)
        const profile = await getApplicantProfile(userId);

        // If an old resume exists, delete it from storage and clear DB column
        if (profile.resume_url) {
            const oldPath = extractStoragePathFromPublicUrl(profile.resume_url);
            if (oldPath) {
                const { error: removeErr } = await supabase.storage
                    .from("resumes")
                    .remove([oldPath]);
                if (removeErr) {
                    console.warn("Could not remove old resume:", removeErr.message);
                }
            }
            await updateApplicantProfile(profile.id, { resume_url: null });
        }

        // Upload new resume (unique filename; no id in name)
        const resumeUrl = await uploadApplicantResume({
            userId,
            profileId: profile.id,
            resumeFile: resume,
            firstName: profile.first_name,
            lastName: profile.last_name,
        });

        // Save fresh URL
        const updatedProfile = await updateApplicantProfile(profile.id, { resume_url: resumeUrl });

        res.status(200).json({
            message: "Resume uploaded and profile updated successfully",
            resume_url: resumeUrl,
            profile: updatedProfile,
        });
    } catch (error: any) {
        console.error("submitApplicantProfile error:", error);
        res.status(500).json({ message: error.message || "Something went wrong" });
    }
};


// Helper: convert Supabase public URL -> storage key for .remove([key])
// Works with: /storage/v1/object/public/resumes/resumes/<filename>.pdf
const extractStoragePathFromPublicUrl = (publicUrl: string): string | null => {
    try {
        const u = new URL(publicUrl);
        const marker = "/storage/v1/object/public/resumes/";
        const idx = u.pathname.indexOf(marker);
        if (idx === -1) return null;
        // -> "resumes/<filename>.pdf"
        return decodeURIComponent(u.pathname.substring(idx + marker.length));
    } catch {
        return null;
    }
};


/**
 * @swagger
 * /api/applicant/profile/change-password:
 *   post:
 *     summary: Change password for the authenticated user
 *     description: >
 *       Requires a valid Bearer token. Verifies the current password, validates the new password,
 *       and updates the stored hash. Updates `updated_at`.
 *     tags: [Applicant]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: oldSecret123
 *               newPassword:
 *                 type: string
 *                 example: NewStrongPass!234
 *               confirmPassword:
 *                 type: string
 *                 example: NewStrongPass!234
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password updated successfully
 *       400:
 *         description: Bad request (validation errors)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 */
export const changePassword = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id as string | undefined; // you already set this in auth middleware
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const { currentPassword, newPassword, confirmPassword } = req.body || {};

        // basic validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: "All fields are required." });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "New passwords do not match." });
        }
        // Optional: enforce strength
        if (newPassword.length < 8) {
            return res.status(400).json({ message: "New password must be at least 8 characters." });
        }

        // fetch user row
        const { data: profile, error: fetchErr } = await supabase
            .from("profiles")
            .select("user_id, email, password")
            .eq("user_id", userId)
            .single();

        if (fetchErr || !profile) {
            return res.status(404).json({ message: "Profile not found." });
        }

        // verify current password
        let isMatch = currentPassword === profile.password ? true : false;
        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect." });
        }

        // hash & update

        const { error: updateErr } = await supabase
            .from("profiles")
            .update({ password: newPassword, updated_at: new Date().toISOString() })
            .eq("user_id", userId);

        if (updateErr) {
            return res.status(500).json({ message: "Failed to update password." });
        }

        return res.status(200).json({ message: "Password updated successfully" });
    } catch (err: any) {
        console.error("changePassword error:", err);
        return res.status(500).json({ message: err?.message || "Something went wrong" });
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
    console.log(userId)

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


//photo upsert api

// ---------- helpers ----------
const extractStoragePathFromPublicUrlImage = (publicUrl: string, bucket: string): string | null => {
    try {
        const u = new URL(publicUrl);
        const marker = `/storage/v1/object/public/${bucket}/`;
        const idx = u.pathname.indexOf(marker);
        if (idx === -1) return null;
        return decodeURIComponent(u.pathname.substring(idx + marker.length)); // e.g. "profile photos/file.jpg"
    } catch {
        return null;
    }
};
const sanitize = (s: string) =>
    (s || "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "user";

const timeStamp = () => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const d = new Date();
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(
        d.getMinutes()
    )}${pad(d.getSeconds())}`;
};

/**
 * @swagger
 * /api/applicant/profile/photo:
 *   post:
 *     summary: Upload or replace applicant profile photo
 *     description: >
 *       Uploads a JPEG/PNG/WEBP profile photo to the **displaypictures** bucket under
 *       **profile photos/**. If a previous photo exists, it is deleted from storage, the
 *       `photo_url` column is cleared, then updated with the new public URL.
 *     tags: [Applicant]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - photo
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: JPEG, PNG, or WEBP image (max 5 MB)
 *     responses:
 *       200:
 *         description: Photo uploaded and profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Photo uploaded and profile updated successfully
 *                 photo_url:
 *                   type: string
 *                   format: uri
 *                   example: https://<project>.supabase.co/storage/v1/object/public/displaypictures/profile%20photos/jane-doe-20250821-154501-ab12cd.jpg
 *                 profile:
 *                   type: object
 *                   description: Updated applicant profile row
 *       400:
 *         description: Photo missing or invalid (type/size)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Applicant profile not found
 *       500:
 *         description: Upload failed or server error
 */
export const submitApplicantPhoto = async (req: Request, res: Response) => {
    try {
        const userId = (req as any)?.user?.id as string | undefined;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const photo = (req as any).file as Express.Multer.File | undefined; // multer.memoryStorage()
        if (!photo) {
            return res.status(400).json({ message: "Photo file is required (jpeg/png/webp)." });
        }

        // Validate type & size
        const ALLOWED = new Map<string, string>([
            ["image/jpeg", "jpg"],
            ["image/jpg", "jpg"],
            ["image/png", "png"],
            ["image/webp", "webp"],
        ]);
        const ext = ALLOWED.get(photo.mimetype);
        if (!ext) return res.status(400).json({ message: "Only JPEG, PNG, or WEBP images are allowed." });

        const MAX_BYTES = 5 * 1024 * 1024; // 5MB
        if (photo.size > MAX_BYTES) {
            return res.status(400).json({ message: "Photo exceeds 5MB limit." });
        }

        // Fetch applicant profile; try by user_id first, then fall back to id
        const selectCols = "id, first_name, last_name, photo_url";
        let profile: any = null;

        let { data: p1, error: e1 } = await supabase
            .from("applicant_profiles")
            .select(selectCols)
            .eq("user_id", userId)
            .single();

        if (!e1 && p1) {
            profile = p1;
        } else {
            const { data: p2, error: e2 } = await supabase
                .from("applicant_profiles")
                .select(selectCols)
                .eq("id", userId)
                .single();
            if (e2 || !p2) {
                return res.status(404).json({ message: "Applicant profile not found." });
            }
            profile = p2;
        }

        const firstName = sanitize(profile.first_name);
        const lastName = sanitize(profile.last_name);

        // If old photo exists, remove it and clear column
        if (profile.photo_url) {
            const oldKey = extractStoragePathFromPublicUrlImage(profile.photo_url, "displaypictures");
            if (oldKey) {
                const { error: removeErr } = await supabase.storage.from("displaypictures").remove([oldKey]);
                if (removeErr) {
                    // don't fail the whole request—just log
                    console.warn("Could not remove old photo:", removeErr.message);
                }
            }

            // Clear stale URL to avoid serving cached link
            await supabase
                .from("applicant_profiles")
                .update({ photo_url: null })
                .eq("id", profile.id); // we have the actual profile.id
        }

        // Build unique file path: "profile photos/<First-Last-YYYYMMDD-HHmmss-rand>.<ext>"
        const fileName = `${firstName}-${lastName}-${timeStamp()}-${Math.random()
            .toString(36)
            .slice(-6)}.${ext}`;
        const filePath = `profilephotos/${fileName}`;

        // Upload to bucket "displaypictures"
        const { error: uploadErr } = await supabase.storage
            .from("displaypictures")
            .upload(filePath, photo.buffer, {
                contentType: photo.mimetype,
                upsert: true, // safe even though we removed old
            });

        if (uploadErr) {
            console.error("Photo upload failed:", uploadErr.message);
            return res.status(500).json({ message: "Failed to upload photo." });
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage.from("displaypictures").getPublicUrl(filePath);
        const photoUrl = publicUrlData?.publicUrl;
        if (!photoUrl) {
            return res.status(500).json({ message: "Failed to generate photo public URL." });
        }

        // Save new URL to profile
        const { data: updatedProfile, error: updateErr } = await supabase
            .from("applicant_profiles")
            .update({ photo_url: photoUrl })
            .eq("id", profile.id)
            .select()
            .single();

        if (updateErr) {
            console.error("DB update failed:", updateErr.message);
            return res.status(500).json({ message: "Failed to update profile photo URL." });
        }

        return res.status(200).json({
            message: "Photo uploaded and profile updated successfully",
            photo_url: photoUrl,
            profile: updatedProfile,
        });
    } catch (err: any) {
        console.error("submitApplicantPhoto error:", err);
        return res.status(500).json({ message: err?.message || "Something went wrong" });
    }
};