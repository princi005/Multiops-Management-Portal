export type DocumentCategory =
  | "HR Policies"
  | "Code of Conduct"
  | "Leave & Attendance"
  | "Accounts"
  | "IT & Security"
  | "Onboarding & Offboarding";

export interface CompanyDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  summary: string;
  previewText: string;
  updatedAt: string;
  owner: string;
  fileName: string;
  isPreview: boolean;
}

export type DocumentFilter = "All" | DocumentCategory;
