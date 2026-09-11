export type EmploymentStatus = "active" | "on_leave" | "inactive" | "terminated";

export interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Employee {
  id: string;
  user_id: string;
  employee_code: string;
  designation: string | null;
  phone: string | null;
  date_of_joining: string | null;
  employment_status: EmploymentStatus;
  department_id: string | null;
  department: Department | null;
  created_at: string;
}

export interface EmployeeUpdatePayload {
  designation?: string | null;
  phone?: string | null;
  date_of_joining?: string | null;
  employment_status?: EmploymentStatus;
  department_id?: string | null;
}

export interface EmployeeOnboardPayload {
  email: string;
  full_name: string;
  temporary_password: string;
  employee_code: string;
  designation?: string | null;
  phone?: string | null;
  department_id?: string | null;
  employment_status?: EmploymentStatus;
}