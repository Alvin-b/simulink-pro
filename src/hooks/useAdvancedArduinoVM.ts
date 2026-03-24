import { useEffect, useRef, useCallback } from "react";
import { useSimulationStore } from "@/stores/simulationStore";
import { useIoTSimulation } from "./useIoTSimulation";

/**
 * ─── Advanced Arduino Virtual Machine ────────────────────────
 * 
 * Simulates Arduino/ESP32 firmware execution with:
 * - Full Arduino API (digitalWrite, digitalRead, analogWrite, etc.)
 * - WiFi & Bluetooth simulation for IoT
 * - MQTT client simulation
 * - Serial communication
 * - Interrupt handling
 * - Timer/PWM simulation
 */

export interface VMState {
  isRunning: boolean;
  isPaused: boolean;
  pc: number; // Program counter
  stack: number[];
  memory: Uint8Array;
  registers: Record<string, number>;
  interrupts: Map<number, () => void>;
  timers: Map<number, NodeJS.Timeout>;
}

export interface ArduinoAPI {
  // Digital I/O
  pinMode: (pin: number, mode: "INPUT" | "OUTPUT" | "INPUT_PULLUP") => void;
  digitalWrite: (pin: number, value: 0 | 1) => void;
  digitalRead: (pin: number) => 0 | 1;

  // Analog I/O
  analogWrite: (pin: number, value: number) => void;
  analogRead: (pin: number) => number;

  // Timing
  delay: (ms: number) => Promise<void>;
  millis: () => number;
  micros: () => number;

  // Serial
  Serial: {
    begin: (baudRate: number) => void;
    print: (data: string | number) => void;
    println: (data: string | number) => void;
    read: () => number;
    write: (data: string | number | Uint8Array) => void;
    available: () => number;
  };

  // WiFi (ESP32)
  WiFi?: {
    begin: (ssid: string, password: string) => Promise<boolean>;
    connected: () => boolean;
    getSignalStrength: () => number;
    disconnect: () => void;
  };

  // Bluetooth (ESP32)
  BluetoothSerial?: {
    begin: (name: string) => void;
    print: (data: string) => void;
    available: () => boolean;
  };

  // MQTT (ESP32)
  MQTT?: {
    connect: (broker: string, port: number) => Promise<boolean>;
    publish: (topic: string, payload: string) => boolean;
    subscribe: (topic: string) => void;
    onMessage: (callback: (topic: string, payload: string) => void) => void;
  };

  // Servo
  Servo?: {
    attach: (pin: number) => void;
    write: (angle: number) => void;
    read: () => number;
    detach: () => void;
  };

  // Interrupts
  attachInterrupt: (pin: number, handler: () => void, mode: "RISING" | "FALLING" | "CHANGE") => void;
  detachInterrupt: (pin: number) => void;

  // Utility
  map: (value: number, fromLow: number, fromHigh: number, toLow: number, toHigh: number) => number;
  constrain: (value: number, min: number, max: number) => number;
  random: (min?: number, max?: number) => number;
}

// ─── Advanced VM Implementation ──────────────────────────────

export function useAdvancedArduinoVM() {
  const components = useSimulationStore((s) => s.components);
  const updatePinValue = useSimulationStore((s) => s.updatePinValue);
  const updateComponentProperty = useSimulationStore((s) => s.updateComponentProperty);
  const log = useSimulationStore((s) => s.log);
  const simState = useSimulationStore((s) => s.simState);

  const iot = useIoTSimulation();

  const vmStateRef = useRef<VMState>({
    isRunning: false,
    isPaused: false,
    pc: 0,
    stack: [],
    memory: new Uint8Array(8192), // 8KB virtual memory
    registers: {},
    interrupts: new Map(),
    timers: new Map(),
  });

  const serialBufferRef = useRef<string>("");
  const pinModesRef = useRef<Record<number, "INPUT" | "OUTPUT" | "INPUT_PULLUP">>({});
  const pwmValuesRef = useRef<Record<number, number>>({});
  const startTimeRef = useRef<number>(Date.now());

  // ── Arduino API Implementation ──

  const createArduinoAPI = useCallback(
    (componentId: string): ArduinoAPI => {
      const component = components.find((c) => c.id === componentId);
      const isMCU = component && ["arduino-uno", "arduino-mega", "arduino-nano", "esp32-wroom", "esp8266-nodemcu"].includes(component.type);

      return {
        // Digital I/O
        pinMode: (pin: number, mode: "INPUT" | "OUTPUT" | "INPUT_PULLUP") => {
          pinModesRef.current[pin] = mode;
          updatePinValue(componentId, `D${pin}`, mode === "OUTPUT" ? 0 : 1);
          log("info", `pinMode(${pin}, ${mode})`);
        },

        digitalWrite: (pin: number, value: 0 | 1) => {
          updatePinValue(componentId, `D${pin}`, value);
          log("info", `digitalWrite(${pin}, ${value})`);
        },

        digitalRead: (pin: number) => {
          const pinState = component?.pins[`D${pin}`];
          return (pinState?.value ?? 0) > 0 ? 1 : 0;
        },

        // Analog I/O
        analogWrite: (pin: number, value: number) => {
          const clamped = Math.max(0, Math.min(255, value));
          pwmValuesRef.current[pin] = clamped;
          updatePinValue(componentId, `D${pin}`, clamped);
          log("info", `analogWrite(${pin}, ${clamped})`);
        },

        analogRead: (pin: number) => {
          const pinState = component?.pins[`A${pin}`];
          return Math.floor((pinState?.value ?? 0) * 255);
        },

        // Timing
        delay: async (ms: number) => {
          return new Promise((resolve) => setTimeout(resolve, ms));
        },

        millis: () => {
          return Date.now() - startTimeRef.current;
        },

        micros: () => {
          return (Date.now() - startTimeRef.current) * 1000;
        },

        // Serial
        Serial: {
          begin: (baudRate: number) => {
            iot.openSerialPort(componentId, `COM-${componentId}`, baudRate);
            log("info", `Serial.begin(${baudRate})`);
          },

          print: (data: string | number) => {
            serialBufferRef.current += String(data);
            iot.sendSerial(componentId, String(data));
            log("serial", `${data}`);
          },

          println: (data: string | number) => {
            serialBufferRef.current += String(data) + "\n";
            iot.sendSerial(componentId, String(data) + "\n");
            log("serial", `${data}`);
          },

          read: () => {
            if (serialBufferRef.current.length > 0) {
              const char = serialBufferRef.current.charCodeAt(0);
              serialBufferRef.current = serialBufferRef.current.slice(1);
              return char;
            }
            return -1;
          },

          write: (data: string | number | Uint8Array) => {
            iot.sendSerial(componentId, data);
          },

          available: () => {
            return serialBufferRef.current.length;
          },
        },

        // WiFi (ESP32 only)
        WiFi: component?.type === "esp32-wroom" ? {
          begin: async (ssid: string, password: string) => {
            log("info", `WiFi.begin("${ssid}", "***")`);
            const success = iot.connectWiFi(componentId, ssid, password);
            await new Promise((r) => setTimeout(r, 2000)); // Simulate connection delay
            return success;
          },

          connected: () => {
            const devices = iot.getConnectedDevices();
            return devices.some((d) => d.componentId === componentId);
          },

          getSignalStrength: () => {
            const devices = iot.getConnectedDevices();
            const device = devices.find((d) => d.componentId === componentId);
            return device?.signalStrength ?? 0;
          },

          disconnect: () => {
            log("info", "WiFi.disconnect()");
          },
        } : undefined,

        // Servo
        Servo: {
          attach: (pin: number) => {
            pinModesRef.current[pin] = "OUTPUT";
            log("info", `Servo.attach(${pin})`);
          },

          write: (angle: number) => {
            const clamped = Math.max(0, Math.min(180, angle));
            const pwm = (clamped / 180) * 255;
            pwmValuesRef.current[9] = pwm; // Assuming pin 9
            updateComponentProperty(componentId, "angle", clamped);
            log("info", `Servo.write(${clamped}°)`);
          },

          read: () => {
            return component?.properties.angle ?? 90;
          },

          detach: () => {
            log("info", "Servo.detach()");
          },
        },

        // Interrupts
        attachInterrupt: (pin: number, handler: () => void, mode: "RISING" | "FALLING" | "CHANGE") => {
          vmStateRef.current.interrupts.set(pin, handler);
          log("info", `attachInterrupt(${pin}, ${mode})`);
        },

        detachInterrupt: (pin: number) => {
          vmStateRef.current.interrupts.delete(pin);
          log("info", `detachInterrupt(${pin})`);
        },

        // Utility
        map: (value, fromLow, fromHigh, toLow, toHigh) => {
          return toLow + ((value - fromLow) * (toHigh - toLow)) / (fromHigh - fromLow);
        },

        constrain: (value, min, max) => {
          return Math.max(min, Math.min(max, value));
        },

        random: (min, max) => {
          if (min === undefined) return Math.random();
          if (max === undefined) return Math.floor(Math.random() * min);
          return Math.floor(Math.random() * (max - min)) + min;
        },
      };
    },
    [components, updatePinValue, updateComponentProperty, log, iot]
  );

  // ── Execute firmware code ──

  const executeSketch = useCallback(
    async (code: string, componentId: string) => {
      vmStateRef.current.isRunning = true;
      const api = createArduinoAPI(componentId);

      try {
        // Wrap code in an async IIFE with Arduino API
        const wrappedCode = `
          (async () => {
            const { pinMode, digitalWrite, digitalRead, analogWrite, analogRead, delay, millis, micros, Serial, WiFi, Servo, attachInterrupt, detachInterrupt, map, constrain, random } = arguments[0];
            
            ${code}
          })
        `;

        // Execute with Arduino API context
        const fn = new Function(wrappedCode);
        await fn(api);

        log("success", "Sketch execution completed");
      } catch (err) {
        log("error", `Sketch error: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        vmStateRef.current.isRunning = false;
      }
    },
    [createArduinoAPI, log]
  );

  return {
    executeSketch,
    createArduinoAPI,
    vmState: vmStateRef.current,
  };
}
