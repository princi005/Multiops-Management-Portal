import { useState } from "react";
import type { FormEvent } from "react";
import { HeartHandshake, Send } from "lucide-react";
import AppButton from "../../../components/ui/AppButton";
import type { PostVisibility } from "./types";

export default function RecognitionComposer({
  onPublish,
}: {
  onPublish: (input: { recipient: string; message: string; visibility: PostVisibility }) => void;
}) {
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("company");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!recipient.trim() || !message.trim()) return;
    onPublish({ recipient: recipient.trim(), message: message.trim(), visibility });
    setRecipient("");
    setMessage("");
    setVisibility("company");
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700">Recognize
        <input value={recipient} onChange={(event) => setRecipient(event.target.value)}
          placeholder="Employee or team"
          className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
      </label>
      <label className="block text-sm font-semibold text-slate-700">Appreciation
        <textarea value={message} onChange={(event) => setMessage(event.target.value)}
          maxLength={2000} rows={4} placeholder="What would you like to recognize?"
          className="mt-1 block w-full rounded-xl border border-slate-200 bg-white p-3 text-sm" />
      </label>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="block text-xs font-bold text-slate-600">Visibility
          <select value={visibility} onChange={(event) => setVisibility(event.target.value as PostVisibility)}
            className="mt-1 block rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="company">Public company recognition</option>
            <option value="private">Private appreciation preview</option>
          </select>
        </label>
        <AppButton type="submit" variant="primary" disabled={!recipient.trim() || !message.trim()}>
          <HeartHandshake className="h-4 w-4" /><Send className="h-4 w-4" />Publish preview
        </AppButton>
      </div>
      {visibility === "private" && (
        <p className="text-xs text-amber-800">Private visibility is only a local preview. Server-side privacy rules are not connected.</p>
      )}
    </form>
  );
}
