import { useState } from "react";
import type { FormEvent } from "react";
import { Send } from "lucide-react";
import AppButton from "../../../components/ui/AppButton";

export default function PostComposer({ onPublish }: { onPublish: (message: string) => void }) {
  const [message, setMessage] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) return;
    onPublish(message.trim());
    setMessage("");
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label htmlFor="company-post-message" className="sr-only">Write a company post</label>
      <textarea id="company-post-message" value={message} onChange={(event) => setMessage(event.target.value)}
        maxLength={4000} rows={4} placeholder="Share a company update…"
        className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-slate-500">{message.length}/4000 characters</span>
        <AppButton type="submit" variant="primary" disabled={!message.trim()}>
          <Send className="h-4 w-4" />Publish preview
        </AppButton>
      </div>
    </form>
  );
}
