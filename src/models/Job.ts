export interface Job {
    id: string;
    company_id: string;
    title: string;
    description: string;
    location?: string;
    industry?: string;
    is_urgent?: boolean;
    is_featured?: boolean;
    is_remote?: boolean;
    created_at?: string;
    job_type?: string;

}
