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
}