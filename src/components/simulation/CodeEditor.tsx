import { useState, useRef, useCallback, useEffect } from "react";
import { useSimulationStore } from "@/stores/simulationStore";
import {
  X, Play, RotateCcw, Upload, FolderOpen, Save, ChevronDown,
  Cpu, Zap, FileCode, AlertCircle, CheckCircle2, Loader2
} from "lucide-react";

// ─── Board profiles ────────────────────────────────────────────

interface BoardProfile {
  name: string;
  chip: string;
  flash: string;
  sram: string;
  freq: string;
  voltage: string;
  digitalPins: number;
  analogPins: number;
  pwmPins: number[];
  color: string;
}

const BOARD_PROFILES: Record<string, BoardProfile> = {
  "arduino-uno": {
    name: "Arduino Uno R3", chip: "ATmega328P", flash: "32KB", sram: "2KB",
    freq: "16 MHz", voltage: "5V", digitalPins: 14, analogPins: 6,
    pwmPins: [3, 5, 6, 9, 10, 11], color: "#006d5b"
  },
  "arduino-mega": {
    name: "Arduino Mega 2560", chip: "ATmega2560", flash: "256KB", sram: "8KB",
    freq: "16 MHz", voltage: "5V", digitalPins: 54, analogPins: 16,
    pwmPins: [2,3,4,5,6,7,8,9,10,11,12,13,44,45,46], color: "#006d5b"
  },
  "arduino-nano": {
    name: "Arduino Nano V3", chip: "ATmega328P", flash: "32KB", sram: "2KB",
    freq: "16 MHz", voltage: "5V", digitalPins: 14, analogPins: 8,
    pwmPins: [3, 5, 6, 9, 10, 11], color: "#006d5b"
  },
  "esp32-wroom": {
    name: "ESP32-WROOM-32", chip: "ESP32 Xtensa LX6", flash: "4MB", sram: "520KB",
    freq: "240 MHz", voltage: "3.3V", digitalPins: 34, analogPins: 18,
    pwmPins: [2,4,5,12,13,14,15,16,17,18,19,21,22,23,25,26,27,32,33], color: "#cc2222"
  },
  "esp8266-nodemcu": {
    name: "NodeMCU ESP8266", chip: "ESP8266EX", flash: "4MB", sram: "80KB",
    freq: "80 MHz", voltage: "3.3V", digitalPins: 11, analogPins: 1,
    pwmPins: [0,1,2,3,4,5,12,13,14,15,16], color: "#cc8800"
  },
  "raspberry-pi-pico": {
    name: "Raspberry Pi Pico", chip: "RP2040 (dual-core)", flash: "2MB", sram: "264KB",
    freq: "133 MHz", voltage: "3.3V", digitalPins: 26, analogPins: 3,
    pwmPins: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,26,27,28], color: "#3366cc"
  },
  "stm32f103": {
    name: "STM32F103C8T6 Blue Pill", chip: "ARM Cortex-M3", flash: "64KB", sram: "20KB",
    freq: "72 MHz", voltage: "3.3V", digitalPins: 37, analogPins: 10,
    pwmPins: [0,1,2,3,6,7,8,9,10,11], color: "#0044aa"
  },
  "attiny85": {
    name: "ATtiny85 DIP-8", chip: "ATtiny85", flash: "8KB", sram: "512B",
    freq: "8 MHz", voltage: "5V", digitalPins: 6, analogPins: 4,
    pwmPins: [0,1,4], color: "#446600"
  },
};

const MCU_TYPES = new Set(Object.keys(BOARD_PROFILES));

// ─── Code templates ────────────────────────────────────────────

const CODE_TEMPLATES: Record<string, string> = {
  "Blink LED": `// Blink the built-in LED on pin 13
void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);
  Serial.println("LED Blink started!");
}

void loop() {
  digitalWrite(13, HIGH);
  Serial.println("LED ON");
  delay(1000);
  
  digitalWrite(13, LOW);
  Serial.println("LED OFF");
  delay(1000);
}`,

  "Servo Sweep": `// Sweep a servo motor from 0° to 180°
// Connect servo signal to pin 9

void setup() {
  pinMode(9, OUTPUT);
  Serial.begin(9600);
  Serial.println("Servo Sweep started!");
}

void loop() {
  // Sweep 0 to 180
  int angle = 0;
  while (angle <= 180) {
    int pwm = (angle * 255) / 180;
    analogWrite(9, pwm);
    Serial.println(angle);
    delay(15);
    angle = angle + 5;
  }
  
  // Sweep 180 to 0
  while (angle >= 0) {
    int pwm = (angle * 255) / 180;
    analogWrite(9, pwm);
    Serial.println(angle);
    delay(15);
    angle = angle - 5;
  }
}`,

  "DC Motor H-Bridge": `// Control DC motor via L298N H-bridge
// IN1 = pin 4, IN2 = pin 5, ENA = pin 3 (PWM)

void setup() {
  pinMode(4, OUTPUT);   // IN1
  pinMode(5, OUTPUT);   // IN2
  pinMode(3, OUTPUT);   // ENA (PWM speed)
  Serial.begin(9600);
  Serial.println("DC Motor Control ready");
}

void loop() {
  // Forward at full speed
  digitalWrite(4, HIGH);
  digitalWrite(5, LOW);
  analogWrite(3, 255);
  Serial.println("Forward");
  delay(2000);
  
  // Stop
  digitalWrite(4, LOW);
  digitalWrite(5, LOW);
  analogWrite(3, 0);
  Serial.println("Stop");
  delay(500);
  
  // Reverse at half speed
  digitalWrite(4, LOW);
  digitalWrite(5, HIGH);
  analogWrite(3, 128);
  Serial.println("Reverse");
  delay(2000);
  
  // Stop
  digitalWrite(4, LOW);
  digitalWrite(5, LOW);
  Serial.println("Stop");
  delay(500);
}`,

  "Ultrasonic Sensor": `// HC-SR04 distance measurement
// TRIG = pin 7, ECHO = pin 6

void setup() {
  pinMode(7, OUTPUT);   // TRIG
  pinMode(6, INPUT);    // ECHO
  Serial.begin(9600);
  Serial.println("Ultrasonic ready");
}

void loop() {
  // Trigger pulse
  digitalWrite(7, LOW);
  delay(2);
  digitalWrite(7, HIGH);
  delay(10);
  digitalWrite(7, LOW);
  
  // Read echo (simulated)
  Serial.print("Distance: ");
  Serial.println("measuring...");
  delay(100);
}`,

  "ESP32 WiFi Blink": `// ESP32 blink with WiFi status
// Built-in LED on pin 2

void setup() {
  pinMode(2, OUTPUT);
  Serial.begin(115200);
  Serial.println("ESP32 SimForge VM");
  Serial.println("WiFi: Simulated Connected");
}

void loop() {
  digitalWrite(2, HIGH);
  Serial.println("LED ON - WiFi Active");
  delay(500);
  
  digitalWrite(2, LOW);
  Serial.println("LED OFF");
  delay(500);
}`,

  "Quadcopter Arm": `// Quadcopter arming sequence
// Throttle on pin 9 (PWM)
// Armed LED on pin 13

void setup() {
  pinMode(9, OUTPUT);   // Throttle
  pinMode(13, OUTPUT);  // Armed LED
  Serial.begin(9600);
  Serial.println("Quadcopter FC initialized");
  Serial.println("Arming sequence...");
  
  // Arming: send min throttle
  analogWrite(9, 0);
  delay(2000);
  
  digitalWrite(13, HIGH);
  Serial.println("ARMED - Ready to fly");
}

void loop() {
  // Hover at 50% throttle
  analogWrite(9, 128);
  Serial.println("Throttle: 50%");
  delay(5000);
  
  // Increase to 75%
  analogWrite(9, 192);
  Serial.println("Throttle: 75%");
  delay(3000);
  
  // Back to hover
  analogWrite(9, 128);
  Serial.println("Throttle: 50%");
  delay(5000);
}`,
};

// ─── Flash status type ─────────────────────────────────────────

type FlashStatus = "idle" | "compiling" | "flashing" | "done" | "error";

// ─── CodeEditor component ──────────────────────────────────────

export function CodeEditor() {
  const code          = useSimulationStore((s) => s.firmwareCode);
  const setCode       = useSimulationStore((s) => s.setFirmwareCode);
  const showEditor    = useSimulationStore((s) => s.showCodeEditor);
  const setShowEditor = useSimulationStore((s) => s.setShowCodeEditor);
  const simState      = useSimulationStore((s) => s.simState);
  const setSimState   = useSimulationStore((s) => s.setSimState);
  const components    = useSimulationStore((s) => s.components);
  const log           = useSimulationStore((s) => s.log);

  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const lineCountRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [flashStatus, setFlashStatus] = useState<FlashStatus>("idle");
  const [flashMsg, setFlashMsg]       = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [showMcuPicker, setShowMcuPicker] = useState(false);
  const [selectedMcuId, setSelectedMcuId] = useState<string | null>(null);
  const [fileName, setFileName]       = useState("sketch.ino");
  const [isDirty, setIsDirty]         = useState(false);

  // Find all MCUs in scene
  const mcusInScene = components.filter((c) => MCU_TYPES.has(c.type));

  // Auto-select first MCU if none selected
  useEffect(() => {
    if (!selectedMcuId && mcusInScene.length > 0) {
      setSelectedMcuId(mcusInScene[0].id);
    }
  }, [mcusInScene.length]);

  const activeMcu = mcusInScene.find((c) => c.id === selectedMcuId) ?? mcusInScene[0] ?? null;
  const boardProfile = activeMcu ? BOARD_PROFILES[activeMcu.type] : null;

  const lines = code.split("\n");

  // ── Scroll sync ──
  const handleScroll = () => {
    if (textareaRef.current && lineCountRef.current) {
      lineCountRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // ── Tab key support ──
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      const newCode = code.substring(0, start) + "  " + code.substring(end);
      setCode(newCode);
      setIsDirty(true);
      requestAnimationFrame(() => {
        if (ta) { ta.selectionStart = ta.selectionEnd = start + 2; }
      });
    }
  };

  // ── Flash & Run ──
  const handleFlash = useCallback(() => {
    if (!activeMcu) {
      log("error", "No MCU in scene — add an Arduino, ESP32, or other microcontroller first");
      return;
    }

    const board = boardProfile ?? BOARD_PROFILES["arduino-uno"];
    const codeSize = new TextEncoder().encode(code).length;
    const flashKB  = Math.round(codeSize / 1024 * 10) / 10;

    setFlashStatus("compiling");
    setFlashMsg("Compiling sketch...");
    log("info", `Compiling for ${board.name} (${board.chip})`);

    setTimeout(() => {
      // Simulate compilation
      const errors = validateSketch(code);
      if (errors.length > 0) {
        setFlashStatus("error");
        setFlashMsg(`Compile error: ${errors[0]}`);
        log("error", `Compile error: ${errors[0]}`);
        setTimeout(() => setFlashStatus("idle"), 3000);
        return;
      }

      log("success", `Compiled — ${codeSize} bytes (${flashKB} KB / ${board.flash} Flash)`);
      setFlashStatus("flashing");
      setFlashMsg(`Flashing to ${board.name}...`);
      log("info", `Uploading via USB... baud: 115200`);

      setTimeout(() => {
        log("success", `Flash complete — firmware running on ${board.name}`);
        log("info", `CPU: ${board.chip} @ ${board.freq} | RAM: ${board.sram} | Flash: ${board.flash}`);
        setFlashStatus("done");
        setFlashMsg("Flash complete!");
        setIsDirty(false);
        setSimState("running");

        setTimeout(() => setFlashStatus("idle"), 2000);
      }, 600);
    }, 400);
  }, [activeMcu, boardProfile, code, log, setSimState]);

  // ── Upload .ino file ──
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["ino", "cpp", "c", "txt"].includes(ext ?? "")) {
      log("error", `Unsupported file type: .${ext} — use .ino, .cpp, or .c`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setCode(content);
      setFileName(file.name);
      setIsDirty(false);
      log("success", `Loaded: ${file.name} (${Math.round(content.length / 1024 * 10) / 10} KB)`);
    };
    reader.onerror = () => log("error", "Failed to read file");
    reader.readAsText(file);

    // Reset input
    e.target.value = "";
  };

  // ── Save / Download ──
  const handleSave = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    setIsDirty(false);
    log("success", `Saved: ${fileName}`);
  };

  // ── Load template ──
  const handleTemplate = (name: string) => {
    setCode(CODE_TEMPLATES[name]);
    setFileName(`${name.toLowerCase().replace(/\s+/g, "_")}.ino`);
    setIsDirty(false);
    setShowTemplates(false);
    log("info", `Template loaded: ${name}`);
  };

  if (!showEditor) return null;

  const flashIcon = () => {
    switch (flashStatus) {
      case "compiling": case "flashing": return <Loader2 className="w-3 h-3 animate-spin" />;
      case "done":  return <CheckCircle2 className="w-3 h-3" />;
      case "error": return <AlertCircle className="w-3 h-3" />;
      default:      return <Upload className="w-3 h-3" />;
    }
  };

  const flashColor = () => {
    switch (flashStatus) {
      case "done":  return "bg-green-500/30 text-green-300 border-green-500/40";
      case "error": return "bg-red-500/30 text-red-300 border-red-500/40";
      case "compiling": case "flashing": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      default: return "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30";
    }
  };

  return (
    <div className="absolute top-0 right-0 w-[520px] h-full z-20 flex flex-col bg-card border-l border-border shadow-2xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-background/80">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">{fileName}</span>
          {isDirty && <span className="text-[9px] text-yellow-400">●</span>}
          <span className="text-[10px] text-muted-foreground font-mono">
            {boardProfile ? `${boardProfile.chip}` : "No MCU"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* Template picker */}
          <div className="relative">
            <button
              onClick={() => { setShowTemplates((v) => !v); setShowMcuPicker(false); }}
              className="flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-secondary text-muted-foreground border border-border hover:text-foreground hover:border-primary/30 transition-colors"
              title="Load template"
            >
              <FileCode className="w-3 h-3" />
              <span className="hidden sm:inline">Templates</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {showTemplates && (
              <div className="absolute right-0 top-8 w-52 bg-card border border-border rounded-lg shadow-2xl z-30 overflow-hidden">
                <div className="px-3 py-1.5 border-b border-border text-[9px] font-mono text-muted-foreground tracking-widest uppercase">
                  Code Templates
                </div>
                {Object.keys(CODE_TEMPLATES).map((name) => (
                  <button
                    key={name}
                    onClick={() => handleTemplate(name)}
                    className="w-full text-left px-3 py-2 text-[11px] hover:bg-secondary transition-colors text-foreground"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Upload file */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-secondary text-muted-foreground border border-border hover:text-foreground hover:border-primary/30 transition-colors"
            title="Upload .ino file"
          >
            <FolderOpen className="w-3 h-3" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".ino,.cpp,.c,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Save */}
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-secondary text-muted-foreground border border-border hover:text-foreground hover:border-primary/30 transition-colors"
            title="Download sketch"
          >
            <Save className="w-3 h-3" />
          </button>

          {/* Flash & Run */}
          <button
            onClick={handleFlash}
            disabled={simState === "running" || flashStatus === "compiling" || flashStatus === "flashing"}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${flashColor()}`}
            title={flashMsg || "Flash & Run"}
          >
            {flashIcon()}
            <span>{flashStatus === "idle" ? "Flash & Run" : flashMsg.split(" ").slice(0,2).join(" ")}</span>
          </button>

          <button
            onClick={() => setShowEditor(false)}
            className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-secondary transition-colors ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── MCU Selector ── */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-background/50">
        <Cpu className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        <span className="text-[10px] text-muted-foreground font-mono">Target MCU:</span>
        <div className="relative flex-1">
          <button
            onClick={() => { setShowMcuPicker((v) => !v); setShowTemplates(false); }}
            className="flex items-center gap-1 text-[11px] text-foreground font-mono hover:text-primary transition-colors"
          >
            {activeMcu ? (
              <>
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: boardProfile?.color ?? "#666" }}
                />
                <span>{activeMcu.name}</span>
              </>
            ) : (
              <span className="text-muted-foreground italic">No MCU in scene</span>
            )}
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
          {showMcuPicker && mcusInScene.length > 0 && (
            <div className="absolute left-0 top-6 w-64 bg-card border border-border rounded-lg shadow-2xl z-30 overflow-hidden">
              <div className="px-3 py-1.5 border-b border-border text-[9px] font-mono text-muted-foreground tracking-widest uppercase">
                MCUs in Scene
              </div>
              {mcusInScene.map((mcu) => {
                const profile = BOARD_PROFILES[mcu.type];
                return (
                  <button
                    key={mcu.id}
                    onClick={() => { setSelectedMcuId(mcu.id); setShowMcuPicker(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[11px] transition-colors hover:bg-secondary ${
                      mcu.id === selectedMcuId ? "bg-primary/10 text-primary" : "text-foreground"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: profile?.color ?? "#666" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{mcu.name}</div>
                      <div className="text-[9px] text-muted-foreground">{profile?.chip ?? mcu.type}</div>
                    </div>
                    {mcu.id === selectedMcuId && <span className="text-primary text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {boardProfile && (
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground">
            <Zap className="w-2.5 h-2.5" />
            <span>{boardProfile.freq}</span>
            <span className="text-border">|</span>
            <span>{boardProfile.voltage}</span>
          </div>
        )}
      </div>

      {/* ── Editor area ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Line numbers */}
        <div
          ref={lineCountRef}
          className="w-10 flex-shrink-0 overflow-hidden py-3 text-right pr-2 text-[11px] font-mono text-muted-foreground/40 leading-[1.6] select-none border-r border-border bg-background/50"
        >
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Code textarea */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => { setCode(e.target.value); setIsDirty(true); }}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 resize-none p-3 text-[12px] font-mono leading-[1.6] bg-transparent text-foreground focus:outline-none overflow-auto"
          style={{ tabSize: 2 }}
          placeholder="// Write your Arduino sketch here..."
        />
      </div>

      {/* ── Status bar ── */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border text-[10px] font-mono text-muted-foreground bg-background/80">
        <div className="flex items-center gap-3">
          <span>{lines.length} lines</span>
          <span>{code.length} chars</span>
          {isDirty && <span className="text-yellow-400">● unsaved</span>}
        </div>
        {boardProfile ? (
          <div className="flex items-center gap-2">
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-bold"
              style={{ background: boardProfile.color + "33", color: boardProfile.color }}
            >
              {boardProfile.name}
            </span>
            <span>{boardProfile.flash} Flash</span>
            <span>{boardProfile.sram} SRAM</span>
          </div>
        ) : (
          <span className="text-muted-foreground/50 italic">No MCU selected</span>
        )}
      </div>

      {/* ── Pin reference panel (collapsible) ── */}
      {boardProfile && activeMcu && (
        <div className="border-t border-border bg-background/60 px-3 py-2">
          <div className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-widest mb-1">
            PWM Pins: {boardProfile.pwmPins.join(", ")} • Analog: A0–A{boardProfile.analogPins - 1} • Digital: D0–D{boardProfile.digitalPins - 1}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sketch validator ──────────────────────────────────────────

function validateSketch(code: string): string[] {
  const errors: string[] = [];
  const clean = code.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

  if (!clean.includes("void setup")) {
    errors.push("Missing void setup() function");
  }
  if (!clean.includes("void loop")) {
    errors.push("Missing void loop() function");
  }

  // Check for balanced braces
  let depth = 0;
  for (const ch of clean) {
    if (ch === "{") depth++;
    if (ch === "}") depth--;
    if (depth < 0) { errors.push("Unexpected '}'"); break; }
  }
  if (depth > 0) errors.push("Missing closing '}'");

  return errors;
}
