export interface DepartmentHeadcount {
  department_name: string;
  employee_count: number;
}

export interface EmploymentStatusBreakdown {
  status: string;
  count: number;
}

export interface CeoDashboardSummary {
  total_employees: number;
  total_departments: number;
  active_employees: number;
  department_breakdown: DepartmentHeadcount[];
  status_breakdown: EmploymentStatusBreakdown[];
}