export interface JobInput {
    company_id: string;
    title: string;
    description: string;
    requirements?: string[];
    location: string;
    employmenttype: string;
    salary_min: number;
    salary_max: number;
    is_active?: boolean;
    job_type?: string;
    id: string;
    industry?: string;
    is_urgent?: boolean;
    is_featured?: boolean;
    is_remote?: boolean;
    created_at?: string;
}