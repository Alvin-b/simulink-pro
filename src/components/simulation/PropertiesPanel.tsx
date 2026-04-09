import { Link2, SlidersHorizontal, Trash2 } from "lucide-react";
import { useSimulationStore } from "@/stores/simulationStore";
import { inferDomainFromComponentType } from "@/platform/projectSchema";

export function PropertiesPanel() {
  const selectedId = useSimulationStore((state) => state.selectedComponent);
  const components = useSimulationStore((state) => state.components);
  const wires = useSimulationStore((state) => state.wires);
  const removeComponent = useSimulationStore((state) => state.removeComponent);
  const removeWire = useSimulationStore((state) => state.removeWire);
  const updateComponentPosition = useSimulationStore((state) => state.updateComponentPosition);
  const updateComponentProperty = useSimulationStore((state) => state.updateComponentProperty);

  const component = components.find((entry) => entry.id === selectedId);

  if (!component) {
    return (
      <div className="flex h-full flex-col bg-slate-950/75">
        <div className="border-b border-white/10 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Inspector</p>
          <h2 className="mt-1 text-sm font-semibold text-white">Component Properties</h2>
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="max-w-[220px] text-center text-xs leading-6 text-slate-400">
            Select a board, robot, environment prop, or connected device to edit configuration values and inspect interfaces.
          </p>
        </div>
      </div>
    );
  }

  const componentWires = wires.filter((wire) => wire.from.componentId === component.id || wire.to.componentId === component.id);

  const handlePositionChange = (axis: number, value: string) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return;
    const next = [...component.position] as [number, number, number];
    next[axis] = numeric;
    updateComponentPosition(component.id, next);
  };

  return (
    <div className="flex h-full flex-col bg-slate-950/75">
      <div className="border-b border-white/10 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Inspector</p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">{component.name}</h2>
            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">{component.type}</p>
            <p className="mt-1 text-xs text-slate-400">Domain: {inferDomainFromComponentType(component.type)}</p>
          </div>
          <button
            onClick={() => removeComponent(component.id)}
            className="rounded-full border border-red-400/20 bg-red-400/10 p-2 text-red-200 transition hover:bg-red-400/20"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-cyan-200" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Transform</p>
          </div>
          <div className="grid gap-2">
            {["X", "Y", "Z"].map((axis, index) => (
              <label key={axis} className="grid grid-cols-[32px_1fr] items-center gap-2 text-xs text-slate-300">
                <span>{axis}</span>
                <input
                  type="number"
                  step="0.1"
                  value={component.position[index]}
                  onChange={(event) => handlePositionChange(index, event.target.value)}
                  className="rounded-lg border border-white/10 bg-slate-900/90 px-3 py-2 font-mono text-slate-100 outline-none"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Configuration</p>
          <div className="space-y-2">
            {Object.entries(component.properties).map(([key, value]) => (
              <label key={key} className="block">
                <span className="mb-1 block text-[11px] text-slate-400">{key}</span>
                <input
                  type={typeof value === "number" ? "number" : "text"}
                  step="0.1"
                  value={String(value)}
                  onChange={(event) =>
                    updateComponentProperty(
                      component.id,
                      key,
                      typeof value === "number" ? Number(event.target.value) : event.target.value,
                    )
                  }
                  className="w-full rounded-lg border border-white/10 bg-slate-900/90 px-3 py-2 font-mono text-xs text-slate-100 outline-none"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Interfaces</p>
          <div className="space-y-2">
            {Object.entries(component.pins).slice(0, 14).map(([pinId, pin]) => (
              <div key={pinId} className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-900/70 px-3 py-2 text-[11px]">
                <div>
                  <p className="font-mono text-slate-100">{pinId}</p>
                  <p className="text-slate-500">{pin.label}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-300">{pin.mode}</p>
                  <p className={pin.value > 0 ? "text-emerald-300" : "text-slate-500"}>{pin.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Link2 className="h-4 w-4 text-cyan-200" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Connections</p>
          </div>
          <div className="space-y-2">
            {componentWires.length === 0 && (
              <p className="text-xs leading-6 text-slate-400">No active connections on this component.</p>
            )}
            {componentWires.map((wire) => {
              const outgoing = wire.from.componentId === component.id;
              const otherId = outgoing ? wire.to.componentId : wire.from.componentId;
              const otherComponent = components.find((entry) => entry.id === otherId);
              return (
                <div key={wire.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-900/70 px-3 py-2">
                  <div className="text-[11px] text-slate-300">
                    <p className="font-mono text-white">
                      {outgoing ? wire.from.pinId : wire.to.pinId} → {otherComponent?.name ?? otherId}
                    </p>
                    <p className="mt-1 text-slate-500">Wire ID: {wire.id}</p>
                  </div>
                  <button onClick={() => removeWire(wire.id)} className="text-xs text-red-300 transition hover:text-red-200">
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
