import { supabase } from '../config/supabaseclient';
import { CreateProfileData } from '../models/Profile';

export const createApplicantProfile = async (
    userId: string,
    email: string,
    profile: Partial<CreateProfileData>
) => {
    const { data, error } = await supabase
        .from('applicant_profiles') // ✅ changed from 'profiles'
        .insert([{ id: userId, email, ...profile }])
        .select();

    if (error) throw error;
    if (!data || data.length === 0) {
        throw new Error('Insert failed, no data returned');
    }

    return data[0];
};
export const uploadApplicantResume = async ({
    userId,        // kept for signature consistency (unused here)
    profileId,     // kept for signature consistency (unused here)
    resumeFile,
    firstName,
    lastName,
}: {
    userId: string;
    profileId: string;
    resumeFile: Express.Multer.File;
    firstName: string;
    lastName: string;
}): Promise<string> => {
    if (!resumeFile?.buffer) throw new Error("No file buffer found for resume upload");
    if (resumeFile.mimetype !== "application/pdf") throw new Error("Only PDF resumes are allowed");

    const MAX_BYTES = 10 * 1024 * 1024; // 10MB
    if (resumeFile.size > MAX_BYTES) throw new Error("Resume exceeds 10MB limit");

    const sanitize = (s: string) =>
        (s || "")
            .replace(/[^a-zA-Z0-9]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "") || "user";

    const sf = sanitize(firstName);
    const sl = sanitize(lastName);

    const pad = (n: number) => n.toString().padStart(2, "0");
    const now = new Date();
    const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(
        now.getHours()
    )}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const rand = Math.random().toString(36).slice(-6);

    // Keep your bucket 'resumes' and folder 'resumes/'
    const newFileName = `${sf}-${sl}-${ts}-${rand}.pdf`;
    const filePath = `resumes/${newFileName}`;

    const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, resumeFile.buffer, {
            contentType: "application/pdf",
            upsert: true, // fine even though we remove old before
        });

    if (uploadError) {
        console.error("Resume upload failed:", uploadError.message);
        throw new Error("Failed to upload resume");
    }

    const { data: publicUrlData } = supabase.storage
        .from("resumes")
        .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
        throw new Error("Failed to generate resume public URL");
    }

    return publicUrlData.publicUrl;
};




export const getApplicantProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from('applicant_profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
};

export const updateApplicantProfile = async (
    profileId: string,
    updates: Partial<CreateProfileData>
) => {
    const { data, error } = await supabase
        .from('applicant_profiles')
        .update(updates)
        .eq('id', profileId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteApplicantProfile = async (userId: string) => {
    const { error } = await supabase
        .from('applicant_profiles')
        .delete()
        .eq('id', userId);

    await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
    if (error) throw error;
    return { message: 'Profile deleted successfully' };
};
