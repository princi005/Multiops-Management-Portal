import { useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Plus, Sparkles, X } from "lucide-react";
import { useMyResume, useSuggestSkillsFromResume, useUpdateMySkills } from "../../hooks/useMe";
import { getErrorMessage } from "../../lib/errors";
import type { SkillSuggestion, SkillTag } from "../../types/me";

const MAX_SKILLS = 50;

export default function SkillsSection({ skills }: { skills: SkillTag[] }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<SkillSuggestion[] | null>(null);
  const [suggestionNote, setSuggestionNote] = useState<string | null>(null);
  const update = useUpdateMySkills();
  const resume = useMyResume();
  const suggest = useSuggestSkillsFromResume();

  const hasResume = Boolean(resume.data);
  const typed = input.trim().replace(/\s+/g, " ");
  const has = (name: string, list: string[]) => list.some((d) => d.toLowerCase() === name.toLowerCase());

  function startEditing() {
    setDraft(skills.map((s) => s.name));
    setInput("");
    setSuggestions(null);
    setSuggestionNote(null);
    setEditing(true);
  }

  function stopEditing() {
    setEditing(false);
    setInput("");
    setSuggestions(null);
    setSuggestionNote(null);
  }

  function addSkill() {
    if (!typed) return;
    if (!has(typed, draft) && draft.length < MAX_SKILLS) setDraft([...draft, typed]);
    setInput("");
  }

  function removeSkill(name: string) {
    setDraft(draft.filter((d) => d !== name));
  }

  function findSuggestions() {
    if (!editing) startEditing();
    suggest.mutate(undefined, {
      onSuccess: (result) => {
        setSuggestions(result.suggestions);
        if (result.suggestions.length > 0) {
          setSuggestionNote(null);
        } else if (result.characters_read === 0) {
          setSuggestionNote("No readable text was found in your resume. It may be a scanned image.");
        } else {
          setSuggestionNote("No new skills were found in your resume. You can still add skills yourself.");
        }
      },
      onError: (err) => toast.error(getErrorMessage(err, "Could not read your resume")),
    });
  }

  function addSuggestion(name: string) {
    if (!has(name, draft) && draft.length < MAX_SKILLS) setDraft([...draft, name]);
    setSuggestions((current) => (current ? current.filter((s) => s.name !== name) : current));
  }

  function addAllSuggestions() {
    if (!suggestions) return;
    const next = [...draft];
    for (const s of suggestions) {
      if (next.length >= MAX_SKILLS) break;
      if (!has(s.name, next)) next.push(s.name);
    }
    setDraft(next);
    setSuggestions([]);
    setSuggestionNote("All suggestions added. Press Save to keep them.");
  }

  function save() {
    // Anything still typed in the box counts too, so it is not silently lost.
    const final = typed && !has(typed, draft) && draft.length < MAX_SKILLS ? [...draft, typed] : draft;
    update.mutate(final, {
      onSuccess: () => {
        toast.success("Skills updated");
        stopEditing();
      },
      onError: (err) => toast.error(getErrorMessage(err, "Could not update skills")),
    });
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">Skills</p>
        {!editing && (
          <div className="flex items-center gap-4">
            {hasResume && (
              <button
                onClick={findSuggestions}
                disabled={suggest.isPending}
                className="flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:text-sky-700 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {suggest.isPending ? "Reading resume..." : "Suggest from resume"}
              </button>
            )}
            <button
              onClick={startEditing}
              className="flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:text-sky-700"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
          </div>
        )}
      </div>

      {!editing && (
        <>
          {skills.length === 0 ? (
            <p className="mt-1 text-sm text-slate-400">
              No skills added yet.{" "}
              {hasResume ? "Try Suggest from resume." : "Upload a resume below to get skill suggestions."}
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s.id} className="px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-medium">
                  {s.name}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {editing && (
        <div className="mt-2">
          <div className="flex flex-wrap gap-2">
            {draft.length === 0 && <p className="text-sm text-slate-400">No skills yet. Add one below.</p>}
            {draft.map((name) => (
              <span
                key={name}
                className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-medium"
              >
                {name}
                <button
                  onClick={() => removeSkill(name)}
                  aria-label={`Remove ${name}`}
                  className="p-0.5 rounded-full hover:bg-sky-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
              maxLength={50}
              placeholder="Type a skill and press Enter"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              onClick={addSkill}
              disabled={!typed || draft.length >= MAX_SKILLS}
              className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
            {hasResume && (
              <button
                onClick={findSuggestions}
                disabled={suggest.isPending}
                className="flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {suggest.isPending ? "Reading..." : "Suggest from resume"}
              </button>
            )}
          </div>
          {draft.length >= MAX_SKILLS && (
            <p className="mt-1 text-xs text-amber-600">You can add up to {MAX_SKILLS} skills.</p>
          )}

          {suggestions !== null && (
            <div className="mt-4 rounded-lg border border-dashed border-sky-300 bg-sky-50/50 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-600">
                  Found in your resume - click a skill to add it, then press Save
                </p>
                {suggestions.length > 1 && (
                  <button onClick={addAllSuggestions} className="text-xs font-medium text-sky-600 hover:text-sky-700">
                    Add all
                  </button>
                )}
              </div>
              {suggestionNote && <p className="mt-2 text-sm text-slate-500">{suggestionNote}</p>}
              {suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s.name}
                      onClick={() => addSuggestion(s.name)}
                      className="flex items-center gap-1 rounded-full border border-sky-300 bg-white px-2.5 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100"
                    >
                      <Plus className="w-3 h-3" />
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={save}
              disabled={update.isPending}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {update.isPending ? "Saving..." : "Save"}
            </button>
            <button
              onClick={stopEditing}
              disabled={update.isPending}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}