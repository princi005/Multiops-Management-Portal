import toast from "react-hot-toast";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import { getErrorMessage } from "../../lib/errors";
import { downloadChangeEvidenceForHr, useChangeEvidenceForHr } from "../../hooks/useProfileChanges";

export default function ChangeRequestEvidencePanel({ requestId }: { requestId: string }) {
  const evidence = useChangeEvidenceForHr(requestId);

  async function download(evidenceId: string, filename: string) {
    try {
      await downloadChangeEvidenceForHr(requestId, evidenceId, filename);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not download supporting evidence"));
    }
  }

  if (evidence.isLoading) return <LoadingState label="Loading supporting evidence..." />;
  if (evidence.isError) {
    return <ErrorState message="Could not load supporting evidence." onRetry={() => evidence.refetch()} />;
  }
  if (!evidence.data?.length) {
    return <p className="text-sm text-slate-500">No supporting documents were attached.</p>;
  }

  return (
    <ul className="space-y-2">
      {evidence.data.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
          <div>
            <p className="text-sm font-medium text-slate-800">{item.original_filename}</p>
            <p className="text-xs text-slate-500">
              Uploaded {new Date(item.uploaded_at).toLocaleString()} · {Math.ceil(item.size_bytes / 1024)} KB
            </p>
          </div>
          <button
            onClick={() => download(item.id, item.original_filename)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            Download
          </button>
        </li>
      ))}
    </ul>
  );
}