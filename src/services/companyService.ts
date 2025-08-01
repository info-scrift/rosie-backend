import { supabase } from '../config/supabaseclient';
import { JobInput } from '../models/JobInput';
// Create a new job
export const createJob = async (job: JobInput) => {
    const { data, error } = await supabase
        .from('jobs')
        .insert([{ ...job, is_active: job.is_active ?? true }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

// List all jobs created by the company
export const listJobsByCompany = async (companyId: string) => {
    const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

// Get a specific job by ID
export const getJobById = async (jobId: string) => {
    const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

    if (error) throw error;
    return data;
};

// Update a job (must already belong to company)
export const updateJob = async (jobId: string, updates: Partial<JobInput>) => {
    const { data, error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', jobId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// Delete a job by ID
export const deleteJob = async (jobId: string) => {
    const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

    if (error) throw error;
};
