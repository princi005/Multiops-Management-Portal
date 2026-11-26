import { useState } from "react";
import { Bot, LockKeyhole, Sparkles } from "lucide-react";
import PortalHeader from "../../components/PortalHeader";

const SUGGESTIONS = [
  "Find the company leave policy",
  "Summarize a project update",
  "Help me prepare for my next meeting",
];

export default function AIAssistantPage() {
  const [selectedPrompt, setSelectedPrompt] = useState("");

  return (
    <div className="min-h-screen">
      <PortalHeader title="AI Assistant" subtitle="Coming soon" accent="violet" />
      <main className="mx-auto max-w-5xl space-y-6 p-5 sm:p-8">
        <section className="rounded-3xl border p-6 sm:p-8"
          style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)", boxShadow: "var(--mo-shadow)" }}>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-800">
            <Sparkles className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-3xl font-extrabold">Company knowledge assistant</h2>
          <p className="mt-2 text-sm text-slate-500">
            This is a frontend placeholder. It does not send prompts to a model or access company documents.
          </p>
        </section>

        <section className="rounded-2xl border p-5"
          style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
          <h3 className="font-bold">Try a suggested prompt</h3>
          <div className="mt-4 rounded-xl border p-4" style={{ borderColor: "var(--mo-border)" }}>
            <label htmlFor="assistant-draft" className="block text-sm font-semibold">Draft a question</label>
            <textarea
              id="assistant-draft"
              value={selectedPrompt}
              onChange={(event) => setSelectedPrompt(event.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Ask about a company policy, project update, or meeting…"
              className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-500">Draft only · no prompt is sent or saved</span>
              <button type="button" disabled title="Assistant responses are not enabled in this phase"
                className="rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white opacity-50">
                Send
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {SUGGESTIONS.map((prompt) => (
              <button key={prompt} type="button" onClick={() => setSelectedPrompt(prompt)}
                className="rounded-xl border px-3 py-2 text-sm font-medium hover:border-violet-400"
                style={{ borderColor: "var(--mo-border)" }}>
                {prompt}
              </button>
            ))}
          </div>
          {selectedPrompt && (
            <p className="mt-4 rounded-xl bg-violet-50 p-3 text-sm text-violet-950">
              Selected preview prompt: {selectedPrompt}
            </p>
          )}
          <div className="mt-5 flex items-center gap-3 rounded-xl border p-4 text-sm text-slate-600"
            style={{ borderColor: "var(--mo-border)" }}>
            <LockKeyhole className="h-5 w-5 shrink-0 text-violet-700" aria-hidden="true" />
            Model connections, RAG, and responses are not enabled in this phase.
          </div>
        </section>

        <section className="rounded-2xl border p-5"
          style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-violet-700" aria-hidden="true" />
            <h3 className="font-bold">Assistant setup preview</h3>
          </div>
          <ul className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <li className="rounded-xl border p-3" style={{ borderColor: "var(--mo-border)" }}>Company knowledge sources</li>
            <li className="rounded-xl border p-3" style={{ borderColor: "var(--mo-border)" }}>Online and offline model options</li>
            <li className="rounded-xl border p-3" style={{ borderColor: "var(--mo-border)" }}>Future OpenRouter and Ollama adapters</li>
            <li className="rounded-xl border p-3" style={{ borderColor: "var(--mo-border)" }}>Future coding-agent workspace</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

