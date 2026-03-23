import { useSimulationStore } from "@/stores/simulationStore";
import { useCallback, useEffect, useRef } from "react";

// ─── Arduino VM ─────────────────────────────────────────────
// A simple interpreter that parses Arduino-like C++ sketches
// and executes them in JavaScript with simulated hardware I/O.

interface VMState {
  running: boolean;
  setupDone: boolean;
  pc: number; // program counter (instruction index)
  delayUntil: number;
  instructions: Instruction[];
  loopStart: number;
  pinModes: Record<number, "INPUT" | "OUTPUT" | "INPUT_PULLUP">;
  serialBaud: number;
}

type Instruction =
  | { type: "pinMode"; pin: number; mode: "INPUT" | "OUTPUT" | "INPUT_PULLUP" }
  | { type: "digitalWrite"; pin: number; value: 0 | 1 }
  | { type: "analogWrite"; pin: number; value: number }
  | { type: "delay"; ms: number }
  | { type: "serialBegin"; baud: number }
  | { type: "serialPrintln"; msg: string }
  | { type: "loopStart" }
  | { type: "noop" };

function parseSketch(code: string): { setup: Instruction[]; loop: Instruction[] } {
  const setup: Instruction[] = [];
  const loop: Instruction[] = [];

  // Remove comments
  const clean = code
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  // Extract function bodies
  const setupMatch = clean.match(/void\s+setup\s*\(\s*\)\s*\{([\s\S]*?)(?=\}\s*(?:void|$))/);
  const loopMatch = clean.match(/void\s+loop\s*\(\s*\)\s*\{([\s\S]*?)(?=\}\s*$)/);

  function parseBlock(body: string): Instruction[] {
    const instructions: Instruction[] = [];
    const lines = body.split(";").map((l) => l.trim()).filter(Boolean);

    for (const line of lines) {
      // pinMode(pin, MODE)
      const pmMatch = line.match(/pinMode\s*\(\s*(\d+)\s*,\s*(OUTPUT|INPUT|INPUT_PULLUP)\s*\)/);
      if (pmMatch) {
        instructions.push({
          type: "pinMode",
          pin: parseInt(pmMatch[1]),
          mode: pmMatch[2] as "INPUT" | "OUTPUT" | "INPUT_PULLUP",
        });
        continue;
      }

      // digitalWrite(pin, HIGH/LOW)
      const dwMatch = line.match(/digitalWrite\s*\(\s*(\d+)\s*,\s*(HIGH|LOW|1|0)\s*\)/);
      if (dwMatch) {
        const val = dwMatch[2] === "HIGH" || dwMatch[2] === "1" ? 1 : 0;
        instructions.push({ type: "digitalWrite", pin: parseInt(dwMatch[1]), value: val as 0 | 1 });
        continue;
      }

      // analogWrite(pin, value)
      const awMatch = line.match(/analogWrite\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
      if (awMatch) {
        instructions.push({ type: "analogWrite", pin: parseInt(awMatch[1]), value: parseInt(awMatch[2]) });
        continue;
      }

      // delay(ms)
      const delayMatch = line.match(/delay\s*\(\s*(\d+)\s*\)/);
      if (delayMatch) {
        instructions.push({ type: "delay", ms: parseInt(delayMatch[1]) });
        continue;
      }

      // Serial.begin(baud)
      const sbMatch = line.match(/Serial\.begin\s*\(\s*(\d+)\s*\)/);
      if (sbMatch) {
        instructions.push({ type: "serialBegin", baud: parseInt(sbMatch[1]) });
        continue;
      }

      // Serial.println("msg")
      const spMatch = line.match(/Serial\.println\s*\(\s*"([^"]*)"\s*\)/);
      if (spMatch) {
        instructions.push({ type: "serialPrintln", msg: spMatch[1] });
        continue;
      }

      // Serial.print("msg")
      const spMatch2 = line.match(/Serial\.print\s*\(\s*"([^"]*)"\s*\)/);
      if (spMatch2) {
        instructions.push({ type: "serialPrintln", msg: spMatch2[1] });
        continue;
      }
    }

    return instructions;
  }

  if (setupMatch) setup.push(...parseBlock(setupMatch[1]));
  if (loopMatch) loop.push(...parseBlock(loopMatch[1]));

  return { setup, loop };
}

function pinNumToId(pin: number): string {
  if (pin >= 0 && pin <= 13) return `D${pin}`;
  if (pin >= 14 && pin <= 19) return `A${pin - 14}`;
  return `D${pin}`;
}

export function useArduinoVM() {
  const vmRef = useRef<VMState>({
    running: false,
    setupDone: false,
    pc: 0,
    delayUntil: 0,
    instructions: [],
    loopStart: 0,
    pinModes: {},
    serialBaud: 0,
  });
  const animFrameRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);

  const store = useSimulationStore;

  const executeInstruction = useCallback(
    (inst: Instruction, now: number): boolean => {
      const state = store.getState();
      const vm = vmRef.current;

      switch (inst.type) {
        case "pinMode":
          vm.pinModes[inst.pin] = inst.mode;
          state.updatePinMode("arduino-1", pinNumToId(inst.pin), inst.mode === "INPUT_PULLUP" ? "INPUT" : inst.mode);
          return true;

        case "digitalWrite": {
          const pinId = pinNumToId(inst.pin);
          state.updatePinValue("arduino-1", pinId, inst.value);
          state.propagateSignals();
          return true;
        }

        case "analogWrite": {
          const pinId = pinNumToId(inst.pin);
          state.updatePinMode("arduino-1", pinId, "PWM");
          state.updatePinValue("arduino-1", pinId, inst.value);
          state.propagateSignals();
          return true;
        }

        case "delay":
          vm.delayUntil = now + inst.ms;
          return true;

        case "serialBegin":
          vm.serialBaud = inst.baud;
          state.log("info", `Serial initialized at ${inst.baud} baud`);
          return true;

        case "serialPrintln":
          state.log("serial", inst.msg);
          return true;

        case "noop":
        case "loopStart":
          return true;

        default:
          return true;
      }
    },
    [store]
  );

  const tick = useCallback(
    (timestamp: number) => {
      const vm = vmRef.current;
      if (!vm.running) return;

      const state = store.getState();
      if (state.simState !== "running") {
        vm.running = false;
        return;
      }

      // Calculate sim time delta (accelerated: 1ms sim = 1ms real for delays)
      const realDelta = timestamp - lastTickRef.current;
      lastTickRef.current = timestamp;
      const simNow = state.simTime * 1000; // convert to ms

      state.incrementSimTime(realDelta / 1000);

      // Check if we're in a delay
      if (vm.delayUntil > 0) {
        const currentSimMs = state.simTime * 1000;
        if (currentSimMs < vm.delayUntil) {
          animFrameRef.current = requestAnimationFrame(tick);
          return;
        }
        vm.delayUntil = 0;
      }

      // Execute next instructions (max 10 per frame to avoid blocking)
      let executed = 0;
      while (vm.pc < vm.instructions.length && executed < 10) {
        const inst = vm.instructions[vm.pc];
        executeInstruction(inst, state.simTime * 1000);
        vm.pc++;
        executed++;

        if (inst.type === "delay") break;

        // Loop back
        if (vm.pc >= vm.instructions.length) {
          vm.pc = vm.loopStart;
        }
      }

      animFrameRef.current = requestAnimationFrame(tick);
    },
    [store, executeInstruction]
  );

  const start = useCallback(() => {
    const state = store.getState();
    const { setup, loop } = parseSketch(state.firmwareCode);
    const vm = vmRef.current;

    vm.instructions = [...setup, { type: "loopStart" }, ...loop];
    vm.loopStart = setup.length + 1;
    vm.pc = 0;
    vm.delayUntil = 0;
    vm.setupDone = false;
    vm.running = true;
    vm.pinModes = {};

    lastTickRef.current = performance.now();
    state.log("info", `Firmware compiled: ${setup.length} setup + ${loop.length} loop instructions`);
    animFrameRef.current = requestAnimationFrame(tick);
  }, [store, tick]);

  const stop = useCallback(() => {
    vmRef.current.running = false;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  }, []);

  const pause = useCallback(() => {
    vmRef.current.running = false;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  }, []);

  const resume = useCallback(() => {
    vmRef.current.running = true;
    lastTickRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(tick);
  }, [tick]);

  // Sync with sim state changes
  useEffect(() => {
    const unsub = store.subscribe((state, prev) => {
      if (state.simState !== prev.simState) {
        if (state.simState === "running" && prev.simState === "idle") start();
        else if (state.simState === "running" && prev.simState === "paused") resume();
        else if (state.simState === "paused") pause();
        else if (state.simState === "idle") stop();
      }
    });
    return () => {
      unsub();
      stop();
    };
  }, [start, stop, pause, resume, store]);

  return { start, stop, pause, resume };
}
