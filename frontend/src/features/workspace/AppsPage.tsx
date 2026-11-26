import { useMemo, useState } from "react";
import { ExternalLink, Link2, Sparkles, Unplug } from "lucide-react";
import { Link } from "react-router-dom";
import PortalHeader from "../../components/PortalHeader";
import SurfaceCard from "../../components/ui/SurfaceCard";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { plannerProviderAdapters } from "./planner/providerAdapters";

export default function AppsPage() {
  const { data: user } = useCurrentUser();
  const [category, setCategory] = useState("All");
  const [previewConnections, setPreviewConnections] = useState<string[]>([]);

  const categories = useMemo(
    () => ["All", ...new Set(plannerProviderAdapters.map((provider) => provider.category))],
    [],
  );
  const visibleProviders = plannerProviderAdapters.filter(
    (provider) => category === "All" || provider.category === category,
  );

  function togglePreview(providerId: string) {
    setPreviewConnections((items) =>
      items.includes(providerId)
        ? items.filter((item) => item !== providerId)
        : [...items, providerId],
    );
  }

  return (
    <div className="min-h-screen">
      <PortalHeader
        title="Apps"
        subtitle="Connected services"
        email={user?.email}
        accent="violet"
      />

      <main className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">
              My workspace
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Apps</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Open your connected services or preview available integrations.
            </p>
          </div>
          <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-900 dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-100">
            Frontend preview · no credentials stored
          </span>
        </header>
        <SurfaceCard>
          <Link
            to="/workspace/modules/ai-assistant"
            className="flex items-center gap-3 rounded-xl p-2 font-semibold text-violet-800 hover:bg-violet-50 dark:text-violet-200 dark:hover:bg-white/5"
          >
            <Sparkles className="h-5 w-5" />
            <span>AI Assistant <span className="ml-2 text-xs font-medium opacity-70">Preview</span></span>
          </Link>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">Integration catalog</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Provider adapters are listed independently. Preview connection states stay in this page only.
              </p>
            </div>

            <label className="text-sm font-semibold">
              Filter
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="mo-input ml-2 px-3 py-2"
              >
                {categories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleProviders.map((provider) => {
              const Icon = provider.icon;
              const connected = previewConnections.includes(provider.id);

              return (
                <article
                  key={provider.id}
                  className="rounded-2xl border p-5"
                  style={{ backgroundColor: "var(--mo-card)", borderColor: "var(--mo-border)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-200">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      connected
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200"
                        : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200"
                    }`}>
                      {connected ? "Preview connected" : "Not connected"}
                    </span>
                  </div>

                  <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
                    {provider.category}
                  </p>
                  <h4 className="mt-1 font-bold">{provider.name}</h4>
                  <p className="mt-1 min-h-10 text-sm leading-5 text-slate-600 dark:text-slate-300">
                    {provider.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {provider.href ? (
                      <a
                        href={provider.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold"
                        style={{ borderColor: "var(--mo-border)" }}
                      >
                        Open service <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => togglePreview(provider.id)}
                        className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold"
                        style={{ borderColor: "var(--mo-border)" }}
                      >
                        Configure preview
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => togglePreview(provider.id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-3 py-2 text-sm font-bold text-white hover:bg-violet-800"
                    >
                      {connected ? <Unplug className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                      {connected ? "Disconnect preview" : "Connect preview"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </SurfaceCard>
      </main>
    </div>
  );
}

