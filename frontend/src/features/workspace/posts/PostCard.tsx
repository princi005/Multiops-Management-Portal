import { HeartHandshake, LockKeyhole, Megaphone } from "lucide-react";
import type { CompanyPost } from "./types";
import PostCommentForm from "./PostCommentForm";
import PostLikeButton from "./PostLikeButton";

export default function PostCard({
  post,
  onLike,
  onAddComment,
}: {
  post: CompanyPost;
  onLike: () => void;
  onAddComment: (message: string) => void;
}) {
  return (
    <article className="rounded-2xl border p-5 shadow-sm"
      style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-700 to-pink-500 text-white">
            {post.kind === "recognition" ? <HeartHandshake className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}
          </span>
          <div>
            <p className="text-sm font-bold">{post.author}</p>
            <p className="mt-0.5 text-xs text-slate-500">{new Date(post.createdAt).toLocaleString()}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
          post.visibility === "private" ? "bg-amber-50 text-amber-800" : "bg-violet-50 text-violet-800"
        }`}>
          {post.visibility === "private" ? <LockKeyhole className="h-3 w-3" /> : null}
          {post.visibility === "private" ? "Private appreciation · preview" : post.kind === "recognition" ? "Recognition" : "Company update"}
        </span>
      </header>

      {post.recipient && <p className="mt-4 text-xs font-bold text-violet-700">Recognizing: {post.recipient}</p>}
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{post.message}</p>

      <div className="mt-4 flex items-center gap-2 border-y py-2" style={{ borderColor: "var(--mo-border)" }}>
        <PostLikeButton liked={post.likedByMe} count={post.likes} onClick={onLike} />
      </div>
      <div className="mt-3">
        <PostCommentForm comments={post.comments} onAdd={onAddComment} />
      </div>
    </article>
  );
}
