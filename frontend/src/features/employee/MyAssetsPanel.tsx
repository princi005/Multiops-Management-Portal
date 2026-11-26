import { useState } from "react";
import { Laptop, Monitor, Plus, RefreshCw, Wrench } from "lucide-react";

type Asset = {
  id: string;
  name: string;
  deviceId: string;
  status: "In use" | "Needs attention" | "Under repair";
  icon: typeof Laptop;
};

type RequestType = "Repair" | "Replacement" | "Other issue";

const ASSETS: Asset[] = [
  { id: "asset-laptop", name: "Company laptop", deviceId: "MO-LAP-0001", status: "In use", icon: Laptop },
  { id: "asset-monitor", name: "External monitor", deviceId: "MO-MON-0001", status: "In use", icon: Monitor },
];

type DraftRequest = {
  id: number;
  assetName: string;
  deviceId: string;
  requestType: RequestType;
  supportTeam: "IT";
  details: string;
  createdAt: string;
};

export default function MyAssetsPanel() {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [requestType, setRequestType] = useState<RequestType>("Repair");
  const [details, setDetails] = useState("");
  const [requests, setRequests] = useState<DraftRequest[]>([]);
  const [notice, setNotice] = useState("");

  function openRequest(asset: Asset) {
    setSelectedAsset(asset);
    setRequestType("Repair");
    setDetails("");
    setNotice("");
  }

  function submitRequest() {
    if (!selectedAsset || details.trim().length < 10) {
      setNotice("Add at least 10 characters describing the device issue.");
      return;
    }

    setRequests((items) => [
      {
        id: Date.now(),
        assetName: selectedAsset.name,
        deviceId: selectedAsset.deviceId,
        requestType,
        supportTeam: "IT",
        details: details.trim(),
        createdAt: new Date().toLocaleString(),
      },
      ...items,
    ]);
    setSelectedAsset(null);
    setDetails("");
    setNotice("Request added to this page preview only. It was not sent to IT or saved.");
  }

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-violet-700 dark:text-violet-300">
          Company equipment
        </p>
        <h3 className="mt-1 text-xl font-extrabold">My Assets</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Company devices assigned to you. Sample preview records are not connected to company inventory.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {ASSETS.map((asset) => {
          const Icon = asset.icon;
          const statusStyle =
            asset.status === "In use"
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200"
              : "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200";

          return (
            <article
              key={asset.id}
              className="rounded-2xl border p-5"
              style={{ backgroundColor: "var(--mo-card)", borderColor: "var(--mo-border)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-200">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle}`}>
                  {asset.status}
                </span>
              </div>
              <h4 className="mt-4 font-bold">{asset.name}</h4>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Device ID: <span className="font-semibold">{asset.deviceId}</span>
              </p>
              <button
                type="button"
                onClick={() => openRequest(asset)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-800"
              >
                <Wrench className="h-4 w-4" aria-hidden="true" />
                Request support
              </button>
            </article>
          );
        })}
      </div>

      {selectedAsset && (
        <section
          className="rounded-2xl border p-5"
          style={{ backgroundColor: "var(--mo-card)", borderColor: "var(--mo-border)" }}
        >
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-violet-700 dark:text-violet-300" />
            <h4 className="font-bold">Request support for {selectedAsset.name}</h4>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Device ID: {selectedAsset.deviceId}. This is a frontend preview and will not contact IT.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <p className="text-sm text-slate-600 dark:text-slate-300 md:col-span-2">Requested team: <strong>IT</strong> · preview only</p>
            <label className="text-sm font-semibold">
              Request type
              <select
                value={requestType}
                onChange={(event) => setRequestType(event.target.value as RequestType)}
                className="mo-input mt-1 px-3 py-2.5"
              >
                <option>Repair</option>
                <option>Replacement</option>
                <option>Other issue</option>
              </select>
            </label>
            <label className="text-sm font-semibold md:col-span-2">
              Describe the issue
              <textarea
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                maxLength={1200}
                rows={4}
                placeholder="Describe the device problem and when it started…"
                className="mo-input mt-1 px-3 py-2.5"
              />
              <span className="mt-1 block text-right text-xs font-normal text-slate-500">
                {details.length}/1200
              </span>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={submitRequest}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-800"
            >
              <Plus className="h-4 w-4" />
              Add preview request
            </button>
            <button
              type="button"
              onClick={() => setSelectedAsset(null)}
              className="rounded-xl border px-4 py-2.5 text-sm font-bold"
              style={{ borderColor: "var(--mo-border)" }}
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      {notice && (
        <p role="status" className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm text-violet-900 dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-100">
          {notice}
        </p>
      )}

      <section>
        <h4 className="font-bold">My asset request history</h4>
        {requests.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed p-4 text-sm text-slate-600 dark:text-slate-300" style={{ borderColor: "var(--mo-border)" }}>
            No asset requests in this page preview.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {requests.map((request) => (
              <article
                key={request.id}
                className="rounded-xl border p-4"
                style={{ backgroundColor: "var(--mo-card)", borderColor: "var(--mo-border)" }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold">{request.requestType} · {request.assetName}</p>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-400/15 dark:text-amber-200">
                    Preview only
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">Requested team: {request.supportTeam}</p>
                <p className="mt-1 text-xs text-slate-500">{request.deviceId} · {request.createdAt}</p>
                <p className="mt-3 whitespace-pre-wrap text-sm">{request.details}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

