import Link from "next/link";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  basePath: string;
  currentFilters: Record<string, string | undefined>;
  sportOptions?: FilterOption[];
  regionOptions?: FilterOption[];
  sourceOptions?: FilterOption[];
}

const SPORTS: FilterOption[] = [
  { label: "All Sports", value: "" },
  { label: "Enduro", value: "enduro" },
  { label: "Motocross", value: "motocross" },
  { label: "Trial", value: "trial" },
  { label: "Supermoto", value: "supermoto" },
];

const REGIONS: FilterOption[] = [
  { label: "All Regions", value: "" },
  { label: "Sweden", value: "sweden" },
  { label: "Europe", value: "europe" },
  { label: "Global", value: "global" },
  { label: "USA", value: "usa" },
];

const SOURCES: FilterOption[] = [
  { label: "All Sources", value: "" },
  { label: "Svemo", value: "svemo" },
  { label: "FIM", value: "fim-news" },
  { label: "EnduroGP", value: "endurogp" },
];

export function FilterBar({
  basePath,
  currentFilters,
  sportOptions = SPORTS,
  regionOptions = REGIONS,
  sourceOptions = SOURCES,
}: FilterBarProps) {
  function buildUrl(key: string, value: string): string {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(currentFilters)) {
      if (v && k !== key && k !== "page") params.set(k, v);
    }
    if (value) params.set(key, value);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <div className="mb-6 flex flex-wrap gap-6 text-sm">
      <FilterGroup
        label="Sport"
        options={sportOptions}
        currentValue={currentFilters.sport}
        buildUrl={(v) => buildUrl("sport", v)}
      />
      <FilterGroup
        label="Region"
        options={regionOptions}
        currentValue={currentFilters.region}
        buildUrl={(v) => buildUrl("region", v)}
      />
      <FilterGroup
        label="Source"
        options={sourceOptions}
        currentValue={currentFilters.source}
        buildUrl={(v) => buildUrl("source", v)}
      />
    </div>
  );
}

function FilterGroup({
  label,
  options,
  currentValue,
  buildUrl,
}: {
  label: string;
  options: FilterOption[];
  currentValue: string | undefined;
  buildUrl: (value: string) => string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-neutral-500">{label}:</span>
      <div className="flex gap-1">
        {options.map((opt) => {
          const isActive = opt.value === (currentValue ?? "");
          return (
            <Link
              key={opt.value}
              href={buildUrl(opt.value)}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                isActive
                  ? "bg-white text-neutral-950"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white"
              }`}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
