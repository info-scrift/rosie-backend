import { supabase } from '../config/supabaseclient';
import { Job } from '../models/Job';

// Paginated jobs
export const getAllJobs = async (page: number, limit: number): Promise<Job[]> => {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) throw error;
    return data || [];
};

// Single job by ID
export const getJobById = async (id: string): Promise<Job | null> => {
    const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

// Search jobs by title
export const searchJobsByTitle = async (title: string): Promise<Job[]> => {
    const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .ilike('title', `%${title}%`)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

// Filter jobs
export const filterJobs = async (filters: {
    location?: string;
    industry?: string;
    urgent?: boolean;
    featured?: boolean;
    remote?: boolean;
}): Promise<Job[]> => {
    let query = supabase.from('jobs').select('*');

    if (filters.location) query = query.eq('location', filters.location);
    if (filters.industry) query = query.eq('industry', filters.industry);
    if (filters.urgent) query = query.eq('is_urgent', true);
    if (filters.featured) query = query.eq('is_featured', true);
    if (filters.remote) query = query.eq('is_remote', true);

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};
