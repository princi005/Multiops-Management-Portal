import { useId, useState } from "react";
import type { FormEvent } from "react";
import { MessageCircle, Send } from "lucide-react";
import type { PostComment } from "./types";

export default function PostCommentForm({
  comments,
  onAdd,
}: {
  comments: PostComment[];
  onAdd: (message: string) => void;
}) {
  const [message, setMessage] = useState("");
  const inputId = useId();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) return;
    onAdd(message.trim());
    setMessage("");
  }

  return (
    <div className="border-t pt-3" style={{ borderColor: "var(--mo-border)" }}>
      <p className="flex items-center gap-2 text-xs font-bold text-slate-600">
        <MessageCircle className="h-4 w-4" />Comments · {comments.length}
      </p>
      {comments.map((comment) => (
        <div key={comment.id} className="mt-3 rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-bold">{comment.author}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{comment.message}</p>
        </div>
      ))}
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <label htmlFor={inputId} className="sr-only">Write a comment</label>
        <input id={inputId} value={message} onChange={(event) => setMessage(event.target.value)}
          maxLength={1000} placeholder="Write a comment…"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
        <button type="submit" disabled={!message.trim()} aria-label="Add comment"
          className="rounded-xl bg-violet-700 px-3 text-white disabled:opacity-40">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

