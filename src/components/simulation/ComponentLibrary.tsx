import { useMemo, useState } from "react";
import {
  Activity,
  Bot,
  Boxes,
  ChevronDown,
  ChevronRight,
  Cpu,
  Globe,
  Plus,
  Radio,
  Search,
} from "lucide-react";
import { useSimulationStore, EnvironmentPreset } from "@/stores/simulationStore";
import { domainModules, getLibrarySectionsForDomains } from "@/modules";
import { searchCatalog } from "@/platform/componentCatalog";
import { CustomModelUpload } from "./CustomModelUpload";

const envPresets: { id: EnvironmentPreset; label: string }[] = [
  { id: "empty", label: "Blank Bay" },
  { id: "robotics-lab", label: "Robotics Lab" },
  { id: "line-follow-track", label: "Track Arena" },
  { id: "obstacle-course", label: "Obstacle Course" },
  { id: "warehouse", label: "Warehouse" },
];

const iconMap = {
  bot: Bot,
  cpu: Cpu,
  activity: Activity,
  radio: Radio,
  globe: Globe,
  boxes: Boxes,
};

export function ComponentLibrary() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const addComponent = useSimulationStore((s) => s.addComponent);
  const addCatalogComponent = useSimulationStore((s) => s.addCatalogComponent);
  const loadEnv = useSimulationStore((s) => s.loadEnvironment);
  const currentEnv = useSimulationStore((s) => s.environmentPreset);
  const activeDomains = useSimulationStore((s) => s.activeDomains);
  const setActiveDomains = useSimulationStore((s) => s.setActiveDomains);

  const sections = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return getLibrarySectionsForDomains(activeDomains)
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          !normalizedSearch ||
          item.name.toLowerCase().includes(normalizedSearch) ||
          item.description.toLowerCase().includes(normalizedSearch) ||
          item.type.toLowerCase().includes(normalizedSearch),
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [activeDomains, search]);

  const catalogMatches = useMemo(
    () => searchCatalog(search).filter((component) => activeDomains.includes(component.domain)).slice(0, 12),
    [activeDomains, search],
  );

  const toggleSection = (name: string) => setExpanded((value) => ({ ...value, [name]: !value[name] }));

  return (
    <div className="flex h-full flex-col bg-slate-950/80">
      <div className="border-b border-border p-3">
        <div className="mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Studio Domains</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {domainModules.map((module) => {
              const active = activeDomains.includes(module.id);
              return (
                <button
                  key={module.id}
                  onClick={() =>
                    setActiveDomains(
                      active
                        ? activeDomains.filter((domain) => domain !== module.id)
                        : [...activeDomains, module.id],
                    )
                  }
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition ${
                    active
                      ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-100"
                      : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {module.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search robots, boards, sensors..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-md border border-border bg-secondary pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="border-b border-border p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Environment</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {envPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => loadEnv(preset.id)}
              className={`rounded-full border px-2.5 py-1 text-[10px] transition ${
                currentEnv === preset.id
                  ? "border-cyan-400/30 bg-cyan-400/15 text-cyan-100"
                  : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-2 pb-3">
          <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/10 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-100/70">Market Hardware</p>
            <p className="mt-2 text-[11px] leading-5 text-slate-200">
              Search the registry and import real boards, sensors, actuators, aerospace, energy, and industrial hardware into the studio.
            </p>
            <div className="mt-3 space-y-2">
              {catalogMatches.map((component) => (
                <button
                  key={component.sku}
                  onClick={() => addCatalogComponent(component.sku)}
                  className="flex w-full items-start gap-2 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-left transition hover:border-emerald-400/20 hover:bg-slate-950"
                >
                  <div className="mt-0.5 rounded-lg border border-white/10 bg-white/[0.04] p-1.5">
                    <Plus className="h-3.5 w-3.5 text-emerald-200" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{component.name}</p>
                    <p className="mt-0.5 text-[10px] leading-5 text-muted-foreground">{component.vendor} • {component.packageType}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">{component.domain} • {component.simulationLevel}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {sections.map((section) => {
          const SectionIcon = iconMap[section.icon as keyof typeof iconMap] ?? Boxes;
          const isExpanded = expanded[section.name] ?? true;
          return (
            <div key={section.name} className="px-2 pb-1">
              <button
                onClick={() => toggleSection(section.name)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs font-medium text-secondary-foreground transition hover:bg-secondary/50"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
                <SectionIcon className="h-4 w-4 text-primary" />
                <span>{section.name}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{section.items.length}</span>
              </button>
              {isExpanded && (
                <div className="mt-1 space-y-1">
                  {section.items.map((item) => (
                    <button
                      key={`${section.name}-${item.type}`}
                      onClick={() => addComponent(item.type)}
                      className="flex w-full items-start gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-left transition hover:border-emerald-400/20 hover:bg-white/[0.06]"
                    >
                      <div className="mt-0.5 rounded-lg border border-white/10 bg-slate-900/80 p-1.5">
                        <Plus className="h-3.5 w-3.5 text-emerald-200" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground">{item.name}</p>
                        <p className="mt-0.5 text-[10px] leading-5 text-muted-foreground">{item.description}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">{item.domain}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <CustomModelUpload />
    </div>
  );
}
