export type IdentityDocumentType = "pan" | "aadhaar";

export interface IdentityDocument {
  id: string;
  document_type: IdentityDocumentType;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  is_verified: boolean;
  verified_at: string | null;
  uploaded_at: string;
}