export type PostKind = "announcement" | "recognition";
export type PostVisibility = "company" | "private";
export type PostFilter = "all" | "announcements" | "recognition" | "private";

export interface PostComment {
  id: string;
  author: string;
  message: string;
  createdAt: string;
}

export interface CompanyPost {
  id: string;
  kind: PostKind;
  visibility: PostVisibility;
  author: string;
  recipient: string | null;
  message: string;
  createdAt: string;
  likes: number;
  likedByMe: boolean;
  comments: PostComment[];
}
