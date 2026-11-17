export interface SkillTag {
  id: string;
  name: string;
}

export interface MyProfile {
  employee_id: string;
  employee_code: string;
  full_name: string | null;
  email: string;
  designation: string | null;
  phone: string | null;
  date_of_joining: string | null;
  department_name: string | null;
  employment_status: string;
  availability_status: string;
  skills: SkillTag[];
  roles: string[];
}

export interface MySalaryHistoryItem {
  effective_date: string;
  basic_salary: number;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  benefits: Record<string, number>;
  action: string;
  created_at: string;
}

export interface MySalary {
  basic_salary: number;
  pay_frequency: string;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  benefits: Record<string, number>;
  pan: string | null;
  bank_account_number: string | null;
  ifsc: string | null;
  effective_date: string;
  history: MySalaryHistoryItem[];
}

export interface MyResume {
  original_filename: string;
  content_type: string;
  size_bytes: number;
  uploaded_at: string;
}

export interface SkillSuggestion {
  name: string;
  mentions: number;
}

export interface SkillSuggestionsResult {
  suggestions: SkillSuggestion[];
  // 0 usually means the resume is a scanned image with no readable text.
  characters_read: number;
}