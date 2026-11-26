import type { CompanyDocument, DocumentCategory } from "./types";

const previewCopy =
  "This is a frontend catalog preview. The organization's approved document file and final policy wording will appear here after document storage is connected.";

function makeDocument(
  id: string,
  title: string,
  category: DocumentCategory,
  summary: string,
  owner: string,
): CompanyDocument {
  return {
    id,
    title,
    category,
    summary,
    previewText: previewCopy,
    updatedAt: "Preview",
    owner,
    fileName: "Document file not connected",
    isPreview: true,
  };
}

export const initialDocuments: CompanyDocument[] = [
  makeDocument("posh-policy", "POSH Policy", "HR Policies", "Workplace prevention, reporting, and support information.", "HR"),
  makeDocument("employee-code", "Employee Code of Conduct", "Code of Conduct", "Expected workplace conduct and professional standards.", "HR"),
  makeDocument("leave-policy", "Leave Policy", "Leave & Attendance", "Leave types, request steps, and review sequence.", "HR"),
  makeDocument("attendance-policy", "Attendance Policy", "Leave & Attendance", "Shift, attendance, and regularization guidance.", "HR"),
  makeDocument("reimbursement-guide", "Reimbursement Guidelines", "Accounts", "Expense submission and reimbursement guidance.", "Accounts"),
  makeDocument("payroll-guide", "Payroll & Expense Documentation", "Accounts", "Payroll references and expense documentation.", "Accounts"),
  makeDocument("it-security", "IT & Security Policy", "IT & Security", "Account, device, and information security guidance.", "IT"),
  makeDocument("onboarding-guide", "Onboarding Checklist", "Onboarding & Offboarding", "A preview of new employee onboarding steps.", "HR"),
  makeDocument("offboarding-guide", "Offboarding Checklist", "Onboarding & Offboarding", "A preview of employee exit and offboarding steps.", "HR"),
];
