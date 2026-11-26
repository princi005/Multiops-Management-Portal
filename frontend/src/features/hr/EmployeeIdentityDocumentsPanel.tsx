import toast from "react-hot-toast";
import { getErrorMessage } from "../../lib/errors";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import {
  downloadEmployeeIdentityDocument,
  useEmployeeIdentityDocuments,
  useVerifyIdentityDocument,
} from "../../hooks/useIdentityDocuments";

export default function EmployeeIdentityDocumentsPanel({
  employeeId,
  employeeCode,
  onClose,
}: {
  employeeId: string;
  employeeCode: string;
  onClose: () => void;
}) {
  const documents = useEmployeeIdentityDocuments(employeeId);
  const verify = useVerifyIdentityDocument(employeeId);

  async function download(type: "pan" | "aadhaar", filename: string) {
    try {
      await downloadEmployeeIdentityDocument(employeeId, type, filename);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not download the document"));
    }
  }

  async function verifyDocument(type: "pan" | "aadhaar") {
    try {
      await verify.mutateAsync(type);
      toast.success("Identity document verified");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not verify the document"));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 px-4 py-8">
      <section className="w-full max-w-xl rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Identity documents</h2>
            <p className="text-sm text-slate-500">{employeeCode}</p>
          </div>
          <button onClick={onClose} className="text-sm text-slate-500">Close</button>
        </div>

        {documents.isLoading && <LoadingState label="Loading identity documents..." />}
        {documents.isError && (
          <ErrorState message="Could not load identity documents." onRetry={() => documents.refetch()} />
        )}

        {documents.data?.length === 0 && (
          <p className="rounded-lg border border-slate-200 p-5 text-sm text-slate-500">
            No identity documents have been uploaded.
          </p>
        )}

        <div className="space-y-3">
          {documents.data?.map((document) => (
            <article key={document.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium capitalize text-slate-900">{document.document_type}</p>
                  <p className="text-xs text-slate-500">{document.original_filename}</p>
                  <p className="text-xs text-slate-500">
                    {document.is_verified ? `Verified ${document.verified_at ? new Date(document.verified_at).toLocaleDateString() : ""}` : "Awaiting review"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => download(document.document_type, document.original_filename)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    Download
                  </button>
                  {!document.is_verified && (
                    <button
                      onClick={() => verifyDocument(document.document_type)}
                      disabled={verify.isPending}
                      className="rounded-lg bg-teal-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                    >
                      {verify.isPending ? "Saving..." : "Verify"}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}