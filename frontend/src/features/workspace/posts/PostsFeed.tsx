import { HeartHandshake } from "lucide-react";
import type { CompanyPost } from "./types";
import PostCard from "./PostCard";

export default function PostsFeed({
  posts,
  onLike,
  onAddComment,
}: {
  posts: CompanyPost[];
  onLike: (postId: string) => void;
  onAddComment: (postId: string, message: string) => void;
}) {
  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center"
        style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
        <HeartHandshake className="mx-auto h-8 w-8 text-violet-600" />
        <h2 className="mt-3 font-bold">Nothing in this view yet</h2>
        <p className="mt-1 text-sm text-slate-500">Posts and recognition you add in the preview will appear here.</p>
      </div>
    );
  }

  return (
    <section className="space-y-4" aria-label="Company posts">
      {posts.map((post) => (
        <PostCard key={post.id} post={post}
          onLike={() => onLike(post.id)}
          onAddComment={(message) => onAddComment(post.id, message)} />
      ))}
    </section>
  );
}
