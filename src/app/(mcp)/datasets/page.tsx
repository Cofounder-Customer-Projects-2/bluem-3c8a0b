import { Database } from "lucide-react";

export default function DatasetsPage() {
  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-ink)]">Datasets</h1>
        <p className="text-sm text-[var(--color-ink-60)] mt-1">
          Curated output collections from reviewed MCP task results.
        </p>
      </div>
      <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-5 py-16 flex flex-col items-center justify-center text-center">
        <Database className="h-10 w-10 text-[var(--color-ink-20)] mb-4" />
        <p className="text-sm font-medium text-[var(--color-ink-60)]">
          Dataset management coming soon
        </p>
        <p className="text-xs text-[var(--color-ink-40)] mt-1 max-w-xs">
          Approved task results will be automatically collected into labeled datasets for
          fine-tuning and evaluation.
        </p>
      </div>
    </div>
  );
}
