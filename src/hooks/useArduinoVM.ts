import { useSimulationStore } from "@/stores/simulationStore";
import { useCallback, useEffect, useRef } from "react";

// ─── Arduino VM ─────────────────────────────────────────────
// Parses Arduino-like C++ sketches and executes them with
// simulated hardware I/O against whichever MCU is in the scene.
// Supports: pinMode, digitalWrite, digitalRead, analogRead,
//           analogWrite, delay, millis, Serial.begin/println/print

interface VMState {
  running:    boolean;
  setupDone:  boolean;
  pc:         number;
  delayUntil: number;
  millis:     number;
  instructions: Instruction[];
  loopStart:  number;
  pinModes:   Record<number, "INPUT" | "OUTPUT" | "INPUT_PULLUP">;
  serialBaud: number;
  variables:  Record<string, number>;
  activeMcuId: string | null;
}

type Instruction =
  | { type: "pinMode";       pin: number;  mode: "INPUT" | "OUTPUT" | "INPUT_PULLUP" }
  | { type: "digitalWrite";  pin: number;  value: 0 | 1 }
  | { type: "analogWrite";   pin: number;  value: number }
  | { type: "delay";         ms: number }
  | { type: "serialBegin";   baud: number }
  | { type: "serialPrintln"; msg: string }
  | { type: "serialPrint";   msg: string }
  | { type: "varAssign";     name: string; value: number }
  | { type: "loopStart" }
  | { type: "noop" };

// ─── MCU types that can be targeted ───────────────────────

const MCU_TYPES = new Set([
  "arduino-uno", "arduino-mega", "arduino-nano",
  "esp32-wroom", "esp8266-nodemcu", "stm32f103",
  "attiny85", "raspberry-pi-pico",
]);

function findActiveMcu(components: any[]): string | null {
  // Priority: selected component if it's an MCU, else first MCU in scene
  const mcus = components.filter((c) => MCU_TYPES.has(c.type));
  if (mcus.length === 0) return null;
  return mcus[0].id;
}

// ─── Sketch Parser ─────────────────────────────────────────

function parseSketch(code: string): { setup: Instruction[]; loop: Instruction[] } {
  const setup: Instruction[] = [];
  const loop:  Instruction[] = [];

  // Strip comments
  const clean = code
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  const setupMatch = clean.match(/void\s+setup\s*\(\s*\)\s*\{([\s\S]*?)(?=\}\s*(?:void|$))/);
  const loopMatch  = clean.match(/void\s+loop\s*\(\s*\)\s*\{([\s\S]*?)(?=\}\s*$)/);

  function parseBlock(body: string): Instruction[] {
    const instructions: Instruction[] = [];
    const lines = body.split(";").map((l) => l.trim()).filter(Boolean);

    for (const line of lines) {
      // ── pinMode(pin, MODE) ─────────────────────────────
      const pm = line.match(/pinMode\s*\(\s*(\d+)\s*,\s*(OUTPUT|INPUT|INPUT_PULLUP)\s*\)/);
      if (pm) {
        instructions.push({ type: "pinMode", pin: parseInt(pm[1]), mode: pm[2] as any });
        continue;
      }

      // ── digitalWrite(pin, HIGH/LOW) ────────────────────
      const dw = line.match(/digitalWrite\s*\(\s*(\d+)\s*,\s*(HIGH|LOW|1|0)\s*\)/);
      if (dw) {
        instructions.push({ type: "digitalWrite", pin: parseInt(dw[1]), value: (dw[2] === "HIGH" || dw[2] === "1") ? 1 : 0 });
        continue;
      }

      // ── analogWrite(pin, value) ────────────────────────
      const aw = line.match(/analogWrite\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
      if (aw) {
        instructions.push({ type: "analogWrite", pin: parseInt(aw[1]), value: parseInt(aw[2]) });
        continue;
      }

      // ── delay(ms) ──────────────────────────────────────
      const dl = line.match(/delay\s*\(\s*(\d+)\s*\)/);
      if (dl) {
        instructions.push({ type: "delay", ms: parseInt(dl[1]) });
        continue;
      }

      // ── Serial.begin(baud) ─────────────────────────────
      const sb = line.match(/Serial\.begin\s*\(\s*(\d+)\s*\)/);
      if (sb) {
        instructions.push({ type: "serialBegin", baud: parseInt(sb[1]) });
        continue;
      }

      // ── Serial.println("msg") ──────────────────────────
      const sp = line.match(/Serial\.println\s*\(\s*"([^"]*)"\s*\)/);
      if (sp) {
        instructions.push({ type: "serialPrintln", msg: sp[1] });
        continue;
      }

      // ── Serial.println(variable/value) ────────────────
      const spv = line.match(/Serial\.println\s*\(\s*([^)]+)\s*\)/);
      if (spv) {
        const val = spv[1].trim();
        instructions.push({ type: "serialPrintln", msg: `[${val}]` });
        continue;
      }

      // ── Serial.print("msg") ───────────────────────────
      const spr = line.match(/Serial\.print\s*\(\s*"([^"]*)"\s*\)/);
      if (spr) {
        instructions.push({ type: "serialPrint", msg: spr[1] });
        continue;
      }

      // ── int/float varName = value ─────────────────────
      const varDecl = line.match(/(?:int|float|long|byte|bool)\s+(\w+)\s*=\s*(-?\d+\.?\d*)/);
      if (varDecl) {
        instructions.push({ type: "varAssign", name: varDecl[1], value: parseFloat(varDecl[2]) });
        continue;
      }
    }

    return instructions;
  }

  if (setupMatch) setup.push(...parseBlock(setupMatch[1]));
  if (loopMatch)  loop.push(...parseBlock(loopMatch[1]));

  return { setup, loop };
}

function pinNumToId(pin: number): string {
  if (pin >= 0 && pin <= 53) return `D${pin}`;
  if (pin >= 54)             return `A${pin - 54}`;
  return `D${pin}`;
}

// ─── Hook ──────────────────────────────────────────────────

export function useArduinoVM() {
  const vmRef = useRef<VMState>({
    running:      false,
    setupDone:    false,
    pc:           0,
    delayUntil:   0,
    millis:       0,
    instructions: [],
    loopStart:    0,
    pinModes:     {},
    serialBaud:   0,
    variables:    {},
    activeMcuId:  null,
  });
  const animFrameRef = useRef<number>(0);
  const lastTickRef  = useRef<number>(0);
  const store = useSimulationStore;

  // ── Instruction executor ──────────────────────────────

  const executeInstruction = useCallback((inst: Instruction): boolean => {
    const state  = store.getState();
    const vm     = vmRef.current;
    const mcuId  = vm.activeMcuId;

    if (!mcuId) return true;

    switch (inst.type) {
      case "pinMode":
        vm.pinModes[inst.pin] = inst.mode;
        state.updatePinMode(mcuId, pinNumToId(inst.pin),
          inst.mode === "INPUT_PULLUP" ? "INPUT" : inst.mode);
        return true;

      case "digitalWrite": {
        const pinId = pinNumToId(inst.pin);
        state.updatePinValue(mcuId, pinId, inst.value);
        state.propagateSignals();
        return true;
      }

      case "analogWrite": {
        const pinId = pinNumToId(inst.pin);
        state.updatePinMode(mcuId, pinId, "PWM");
        state.updatePinValue(mcuId, pinId, inst.value);
        state.propagateSignals();
        return true;
      }

      case "delay":
        vm.delayUntil = vm.millis + inst.ms;
        return true;

      case "serialBegin":
        vm.serialBaud = inst.baud;
        state.log("info", `[${mcuId}] Serial @ ${inst.baud} baud`);
        return true;

      case "serialPrintln":
        state.log("serial", inst.msg);
        return true;

      case "serialPrint":
        state.log("serial", inst.msg);
        return true;

      case "varAssign":
        vm.variables[inst.name] = inst.value;
        return true;

      case "noop":
      case "loopStart":
        return true;

      default:
        return true;
    }
  }, [store]);

  // ── Tick loop ─────────────────────────────────────────

  const tick = useCallback((timestamp: number) => {
    const vm = vmRef.current;
    if (!vm.running) return;

    const state = store.getState();
    if (state.simState !== "running") {
      vm.running = false;
      return;
    }

    const realDelta = timestamp - lastTickRef.current;
    lastTickRef.current = timestamp;

    // Advance simulated time (ms)
    vm.millis += realDelta;
    state.incrementSimTime(realDelta / 1000);

    // Honour delay
    if (vm.delayUntil > 0) {
      if (vm.millis < vm.delayUntil) {
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }
      vm.delayUntil = 0;
    }

    // Execute up to 20 instructions per frame
    let executed = 0;
    while (vm.pc < vm.instructions.length && executed < 20) {
      const inst = vm.instructions[vm.pc];
      executeInstruction(inst);
      vm.pc++;
      executed++;

      if (inst.type === "delay") break;

      // Loop back
      if (vm.pc >= vm.instructions.length) {
        vm.pc = vm.loopStart;
      }
    }

    animFrameRef.current = requestAnimationFrame(tick);
  }, [store, executeInstruction]);

  // ── Start ─────────────────────────────────────────────

  const start = useCallback(() => {
    const state = store.getState();
    const vm    = vmRef.current;

    // Find the MCU to target
    const mcuId = findActiveMcu(state.components);
    if (!mcuId) {
      state.log("error", "No microcontroller in scene — add an Arduino or ESP32 first");
      return;
    }

    const mcu = state.components.find((c) => c.id === mcuId);
    state.log("info", `Targeting: ${mcu?.name ?? mcuId}`);

    const { setup, loop } = parseSketch(state.firmwareCode);

    vm.instructions  = [...setup, { type: "loopStart" }, ...loop];
    vm.loopStart     = setup.length + 1;
    vm.pc            = 0;
    vm.delayUntil    = 0;
    vm.millis        = 0;
    vm.setupDone     = false;
    vm.running       = true;
    vm.pinModes      = {};
    vm.variables     = {};
    vm.activeMcuId   = mcuId;

    lastTickRef.current = performance.now();
    state.log("info", `Compiled: ${setup.length} setup + ${loop.length} loop instructions`);
    animFrameRef.current = requestAnimationFrame(tick);
  }, [store, tick]);

  const stop = useCallback(() => {
    vmRef.current.running = false;
    vmRef.current.activeMcuId = null;
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  const pause = useCallback(() => {
    vmRef.current.running = false;
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  const resume = useCallback(() => {
    vmRef.current.running = true;
    lastTickRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(tick);
  }, [tick]);

  // ── Sync with sim state ───────────────────────────────

  useEffect(() => {
    const unsub = store.subscribe((state, prev) => {
      if (state.simState !== prev.simState) {
        if (state.simState === "running" && prev.simState === "idle")   start();
        if (state.simState === "running" && prev.simState === "paused") resume();
        if (state.simState === "paused")                                 pause();
        if (state.simState === "idle")                                   stop();
      }
    });
    return () => { unsub(); stop(); };
  }, [start, stop, pause, resume, store]);

  return { start, stop, pause, resume };
}
