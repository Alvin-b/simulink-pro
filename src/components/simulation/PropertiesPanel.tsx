import { Cpu, Zap, MapPin, RotateCcw } from "lucide-react";

export function PropertiesPanel() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Properties
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Selected component info */}
        <div className="p-3 rounded-lg bg-secondary/50 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Arduino Uno R3</p>
              <p className="text-[10px] text-muted-foreground">ATmega328P @ 16MHz</p>
            </div>
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
              { label: "Position", values: ["0.00", "0.15", "0.00"], color: "text-red-400" },
              { label: "Rotation", values: ["0°", "0°", "0°"], color: "text-green-400" },
              { label: "Scale", values: ["1.00", "1.00", "1.00"], color: "text-blue-400" },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground w-12">{row.label}</span>
                {row.values.map((v, i) => (
                  <input
                    key={i}
                    defaultValue={v}
                    className="flex-1 px-1.5 py-1 text-[10px] font-mono text-center rounded bg-secondary border border-border text-foreground focus:border-primary focus:outline-none"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* GPIO Status */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium text-secondary-foreground">GPIO Pins</span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className={`flex flex-col items-center gap-0.5 p-1 rounded text-[8px] font-mono ${
                  i === 13
                    ? "bg-green-500/10 border border-green-500/30 text-green-400"
                    : i === 2
                    ? "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400"
                    : "bg-secondary border border-border text-muted-foreground"
                }`}
              >
                <span>D{i}</span>
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    i === 13
                      ? "bg-green-400"
                      : i === 2
                      ? "bg-yellow-400 animate-pulse-glow"
                      : "bg-muted-foreground/30"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Electrical */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium text-secondary-foreground">Electrical</span>
          </div>
          <div className="space-y-1.5 text-[11px]">
            {[
              { label: "Input Voltage", value: "5.0V", status: "normal" },
              { label: "Current Draw", value: "42mA", status: "normal" },
              { label: "Clock Speed", value: "16 MHz", status: "normal" },
              { label: "Flash Used", value: "12%", status: "normal" },
              { label: "SRAM Used", value: "8%", status: "normal" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-mono text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Physics */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <RotateCcw className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium text-secondary-foreground">Physics</span>
          </div>
          <div className="space-y-1.5 text-[11px]">
            {[
              { label: "Mass", value: "25g" },
              { label: "Gravity", value: "9.81 m/s²" },
              { label: "Static", value: "true" },
              { label: "Temperature", value: "25°C" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-mono text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
