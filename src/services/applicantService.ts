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
    userId,
    profileId,
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
    if (!resumeFile?.buffer) {
        throw new Error('No file buffer found for resume upload');
    }

    const sanitizedFirstName = (firstName || 'user').replace(/[^a-zA-Z0-9]/g, '');
    const sanitizedLastName = (lastName || 'unknown').replace(/[^a-zA-Z0-9]/g, '');
    const sanitizedId = (profileId || 'noid').toString().replace(/[^a-zA-Z0-9]/g, '');

    const newFileName = `${sanitizedFirstName}_${sanitizedLastName}_${sanitizedId}.pdf`;
    const filePath = `resumes/${newFileName}`;

    console.log(`Uploading resume to: ${filePath}`);

    // Upload file
    const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, resumeFile.buffer, {
            contentType: resumeFile.mimetype,
            upsert: true,
        });

    if (uploadError) {
        console.error('Resume upload failed:', uploadError.message);
        throw new Error('Failed to upload resume');
    }

    const { data: publicUrlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
        throw new Error('Failed to generate resume public URL');
    }

    return publicUrlData.publicUrl;
};



export const getApplicantProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from('applicant_profiles') // ✅
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
};

export const updateApplicantProfile = async (
    userId: string,
    updates: Partial<CreateProfileData>
) => {
    const { data, error } = await supabase
        .from('applicant_profiles')
        .update(updates)
        .eq('id', userId)
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

    if (error) throw error;
    return { message: 'Profile deleted successfully' };
};
