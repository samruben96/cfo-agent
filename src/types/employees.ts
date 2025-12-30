/**
 * TypeScript types for employees feature.
 * Story: 3-2-employee-headcount-intake-form
 */

/**
 * Employment type values.
 */
export type EmploymentType = 'full-time' | 'part-time' | 'contractor';

/**
 * Application-level employee model (camelCase).
 */
export interface Employee {
  id: string;
  userId: string;
  name: string;
  /** Optional internal employee ID (e.g., "EMP001") */
  employeeId?: string;
  role: string;
  department?: string;
  employmentType: EmploymentType;
  annualSalary: number;
  annualBenefits: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Form data shape for employee form.
 * Uses null for empty numeric fields to distinguish from zero.
 */
export interface EmployeeFormData {
  name: string;
  employeeId?: string;
  role: string;
  department?: string;
  employmentType: EmploymentType;
  /** null for empty field */
  annualSalary: number | null;
  /** null for empty field */
  annualBenefits: number | null;
}

/**
 * Database row type (snake_case) matching Supabase schema.
 */
export interface EmployeeRow {
  id: string;
  user_id: string;
  name: string;
  employee_id: string | null;
  role: string;
  department: string | null;
  employment_type: string;
  annual_salary: number;
  annual_benefits: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Summary type for headcount/payroll totals.
 */
export interface EmployeeSummary {
  totalHeadcount: number;
  totalAnnualPayroll: number;
  totalAnnualBenefits: number;
  averageSalary: number;
}

/**
 * Common role options for insurance agencies.
 */
export const COMMON_ROLES = [
  'Producer',
  'CSR (Customer Service Representative)',
  'Account Manager',
  'Office Manager',
  'Administrative Assistant',
  'Marketing',
  'IT Support',
  'Owner/Principal',
  'Other',
] as const;

/**
 * Common department options.
 */
export const COMMON_DEPARTMENTS = [
  'Sales',
  'Service',
  'Operations',
  'Marketing',
  'Administration',
  'IT',
  'Finance',
  'Other',
] as const;

/**
 * Employment type options for dropdown.
 */
export const EMPLOYMENT_TYPE_OPTIONS: { value: EmploymentType; label: string }[] = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contractor', label: 'Contractor' },
];

/**
 * Empty form data for new employee.
 */
export const EMPTY_EMPLOYEE_FORM: EmployeeFormData = {
  name: '',
  employeeId: '',
  role: '',
  department: '',
  employmentType: 'full-time',
  annualSalary: null,
  annualBenefits: null,
};
