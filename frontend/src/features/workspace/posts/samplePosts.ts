import type { CompanyPost } from "./types";

export const samplePosts: CompanyPost[] = [
  {
    id: "sample-post-1",
    kind: "announcement",
    visibility: "company",
    author: "MultiOps Team · sample",
    recipient: null,
    message: "Welcome to the company feed. Organization announcements and updates will appear here.",
    createdAt: new Date().toISOString(),
    likes: 3,
    likedByMe: false,
    comments: [],
  },
  {
    id: "sample-post-2",
    kind: "recognition",
    visibility: "company",
    author: "People Team · sample",
    recipient: "Project team",
    message: "Thank you to the project team for the care and collaboration shown during this sample launch.",
    createdAt: new Date().toISOString(),
    likes: 5,
    likedByMe: false,
    comments: [],
  },
];
