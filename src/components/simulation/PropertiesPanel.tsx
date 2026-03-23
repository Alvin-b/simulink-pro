import { Cpu, Zap, MapPin, RotateCcw, Trash2, Link } from "lucide-react";
import { useSimulationStore } from "@/stores/simulationStore";

export function PropertiesPanel() {
  const selectedId = useSimulationStore((s) => s.selectedComponent);
  const components = useSimulationStore((s) => s.components);
  const wires = useSimulationStore((s) => s.wires);
  const removeComponent = useSimulationStore((s) => s.removeComponent);
  const removeWire = useSimulationStore((s) => s.removeWire);
  const gravity = useSimulationStore((s) => s.gravity);

  const component = components.find((c) => c.id === selectedId);

  if (!component) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-border">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Properties</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-muted-foreground text-center">Select a component to view its properties</p>
        </div>
      </div>
    );
  }

  const componentWires = wires.filter(
    (w) => w.from.componentId === component.id || w.to.componentId === component.id
  );

  const typeIcon: Record<string, JSX.Element> = {
    "arduino-uno": <Cpu className="w-4 h-4 text-primary" />,
    led: <Zap className="w-4 h-4 text-yellow-400" />,
    resistor: <Zap className="w-4 h-4 text-orange-400" />,
    servo: <RotateCcw className="w-4 h-4 text-blue-400" />,
    "hc-sr04": <MapPin className="w-4 h-4 text-cyan-400" />,
    button: <Zap className="w-4 h-4 text-red-400" />,
    buzzer: <Zap className="w-4 h-4 text-amber-400" />,
    potentiometer: <RotateCcw className="w-4 h-4 text-indigo-400" />,
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Properties</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Component info */}
        <div className="p-3 rounded-lg bg-secondary/50 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
              {typeIcon[component.type] || <Cpu className="w-4 h-4 text-primary" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{component.name}</p>
              <p className="text-[10px] text-muted-foreground">{component.id}</p>
            </div>
            <button
              onClick={() => removeComponent(component.id)}
              className="p-1 text-muted-foreground hover:text-destructive transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Transform */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <MapPin className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium text-secondary-foreground">Transform</span>
          </div>
          <div className="space-y-1.5">
            {[
              { label: "Position", values: component.position.map((v) => v.toFixed(2)) },
              { label: "Rotation", values: component.rotation.map((v) => `${(v * 180 / Math.PI).toFixed(0)}°`) },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground w-12">{row.label}</span>
                {row.values.map((v, i) => (
                  <input
                    key={i}
                    defaultValue={v}
                    readOnly
                    className="flex-1 px-1.5 py-1 text-[10px] font-mono text-center rounded bg-secondary border border-border text-foreground"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Pins */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium text-secondary-foreground">Pins</span>
          </div>
          <div className="space-y-1">
            {Object.entries(component.pins).map(([pinId, pin]) => (
              <div
                key={pinId}
                className="flex items-center justify-between px-2 py-1 rounded bg-secondary/30 border border-border text-[10px] font-mono"
              >
                <span className="text-foreground">{pin.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{pin.mode}</span>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      pin.value > 0 ? "bg-green-400" : "bg-muted-foreground/30"
                    }`}
                  />
                  <span className={pin.value > 0 ? "text-green-400" : "text-muted-foreground"}>
                    {pin.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wires */}
        {componentWires.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Link className="w-3 h-3 text-primary" />
              <span className="text-xs font-medium text-secondary-foreground">Connections</span>
            </div>
            <div className="space-y-1">
              {componentWires.map((wire) => {
                const isFrom = wire.from.componentId === component.id;
                const otherComp = components.find(
                  (c) => c.id === (isFrom ? wire.to.componentId : wire.from.componentId)
                );
                return (
                  <div
                    key={wire.id}
                    className="flex items-center justify-between px-2 py-1 rounded bg-secondary/30 border border-border text-[10px]"
                  >
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: wire.color }} />
                      <span className="font-mono text-foreground">
                        {isFrom ? wire.from.pinId : wire.to.pinId}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-foreground">{otherComp?.name}</span>
                      <span className="font-mono text-muted-foreground">
                        .{isFrom ? wire.to.pinId : wire.from.pinId}
                      </span>
                    </div>
                    <button
                      onClick={() => removeWire(wire.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Properties */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <RotateCcw className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium text-secondary-foreground">Properties</span>
          </div>
          <div className="space-y-1.5 text-[11px]">
            {Object.entries(component.properties).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                <span className="font-mono text-foreground">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Physics */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium text-secondary-foreground">Physics</span>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between"><span className="text-muted-foreground">Mass</span><span className="font-mono text-foreground">{component.mass}g</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Static</span><span className="font-mono text-foreground">{String(component.isStatic)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Gravity</span><span className="font-mono text-foreground">{gravity} m/s²</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
