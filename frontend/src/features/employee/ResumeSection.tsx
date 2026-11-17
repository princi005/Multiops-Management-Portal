import { useRef } from "react";
import type { ChangeEvent } from "react";
import toast from "react-hot-toast";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import {
  downloadMyResume,
  useDeleteMyResume,
  useMyResume,
  useUploadMyResume,
} from "../../hooks/useMe";
import { getErrorMessage } from "../../lib/errors";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import type { MyResume } from "../../types/me";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".pdf", ".docx"];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ResumeSection() {
  const resume = useMyResume();
  const upload = useUploadMyResume();
  const remove = useDeleteMyResume();
  const inputRef = useRef<HTMLInputElement>(null);

  function onFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // lets the same file be picked again later
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    if (!ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext))) {
      toast.error("Please choose a PDF or DOCX file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Resume must be 5 MB or smaller.");
      return;
    }

    upload.mutate(file, {
      onSuccess: () => toast.success("Resume uploaded"),
      onError: (err) => toast.error(getErrorMessage(err, "Could not upload your resume")),
    });
  }

  async function handleDownload(current: MyResume) {
    try {
      await downloadMyResume(current.original_filename);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not download your resume"));
    }
  }

  function handleRemove() {
    if (!window.confirm("Remove your uploaded resume?")) return;
    remove.mutate(undefined, {
      onSuccess: () => toast.success("Resume removed"),
      onError: (err) => toast.error(getErrorMessage(err, "Could not remove your resume")),
    });
  }

  const busy = upload.isPending || remove.isPending;

  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900 mb-4">My Resume</h2>
      {resume.isLoading && <LoadingState label="Loading your resume..." />}
      {resume.isError && <ErrorState message="Failed to load your resume." onRetry={() => resume.refetch()} />}
      {resume.data !== undefined && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={onFileSelected}
            className="hidden"
          />

          {resume.data === null ? (
            <div className="flex flex-col items-center text-center py-4">
              <FileText className="w-8 h-8 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-900">No resume uploaded yet</p>
              <p className="mt-1 text-sm text-slate-500">PDF or DOCX, up to 5 MB.</p>
              <button
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="mt-4 flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {upload.isPending ? "Uploading..." : "Upload resume"}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-8 h-8 text-sky-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{resume.data.original_filename}</p>
                  <p className="text-xs text-slate-500">
                    {formatBytes(resume.data.size_bytes)} - uploaded{" "}
                    {new Date(resume.data.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(resume.data as MyResume)}
                  disabled={busy}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => inputRef.current?.click()}
                  disabled={busy}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {upload.isPending ? "Uploading..." : "Replace"}
                </button>
                <button
                  onClick={handleRemove}
                  disabled={busy}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}