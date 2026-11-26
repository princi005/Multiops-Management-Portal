import { Check, ExternalLink, Link2 } from "lucide-react";
import AppButton from "../../../components/ui/AppButton";
import { plannerProviderAdapters } from "./providerAdapters";

export default function PlannerIntegrationsPanel({
  connectedIds,
  onToggle,
}: {
  connectedIds: string[];
  onToggle: (providerId: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {plannerProviderAdapters.map((provider) => {
        const Icon = provider.icon;
        const connected = connectedIds.includes(provider.id);

        return (
          <article key={provider.id} className="rounded-2xl border bg-white/75 p-4 shadow-sm"
            style={{ borderColor: "var(--mo-border)" }}>
            <div className="flex items-center justify-between gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-800">
                <Icon className="h-5 w-5" />
              </span>
              {connected && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-800"><Check className="h-3 w-3" />Preview linked</span>}
            </div>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">{provider.category}</p>
            <h3 className="mt-1 min-h-10 text-sm font-bold">{provider.name}</h3>
            <p className="mt-1 min-h-10 text-xs leading-5 text-slate-500">{provider.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {provider.href ? (
                <a href={provider.href} target="_blank" rel="noreferrer"
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-violet-300 hover:bg-violet-50">
                  Open <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <AppButton type="button" onClick={() => onToggle(provider.id)}>
                  <Link2 className="h-3.5 w-3.5" />Configure
                </AppButton>
              )}
              <AppButton type="button" variant={connected ? "ghost" : "secondary"} onClick={() => onToggle(provider.id)}>
                {connected ? "Unlink preview" : "Connect preview"}
              </AppButton>
            </div>
          </article>
        );
      })}
    </div>
  );
}
