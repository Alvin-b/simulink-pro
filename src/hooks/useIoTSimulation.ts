import { useEffect, useRef, useCallback } from "react";
import { useSimulationStore } from "@/stores/simulationStore";

/**
 * ─── IoT Simulation Engine ──────────────────────────────────
 * 
 * Enables virtual WiFi/Bluetooth/MQTT connectivity for ESP32 and other IoT devices.
 * Allows external apps and controllers to connect via WebSockets or WebSerial.
 */

// ─── Types ──────────────────────────────────────────────────

export type IoTProtocol = "wifi" | "bluetooth" | "mqtt" | "serial" | "http";

export interface IoTDevice {
  id: string;
  componentId: string;
  type: "esp32" | "arduino" | "raspberry-pi";
  protocols: IoTProtocol[];
  ssid?: string;
  password?: string;
  mqttBroker?: string;
  mqttPort?: number;
  bluetoothName?: string;
  serialPort?: string;
  isConnected: boolean;
  signalStrength?: number;
}

export interface IoTMessage {
  protocol: IoTProtocol;
  topic?: string;
  payload: string | Uint8Array;
  timestamp: number;
  direction: "in" | "out";
}

export interface VirtualNetwork {
  ssid: string;
  password: string;
  devices: Map<string, IoTDevice>;
  messages: IoTMessage[];
  isRunning: boolean;
}

// ─── Virtual WiFi Network ──────────────────────────────────

class VirtualWiFiNetwork {
  private ssid: string;
  private password: string;
  private devices: Map<string, IoTDevice> = new Map();
  private messages: IoTMessage[] = [];
  private maxMessages = 1000;

  constructor(ssid: string = "SimForge-Lab", password: string = "simforge123") {
    this.ssid = ssid;
    this.password = password;
  }

  addDevice(device: IoTDevice) {
    this.devices.set(device.id, device);
  }

  removeDevice(deviceId: string) {
    this.devices.delete(deviceId);
  }

  connectDevice(deviceId: string): boolean {
    const device = this.devices.get(deviceId);
    if (device) {
      device.isConnected = true;
      device.signalStrength = 85 + Math.random() * 15; // 85-100 RSSI
      return true;
    }
    return false;
  }

  disconnectDevice(deviceId: string): boolean {
    const device = this.devices.get(deviceId);
    if (device) {
      device.isConnected = false;
      device.signalStrength = 0;
      return true;
    }
    return false;
  }

  broadcast(message: IoTMessage) {
    this.messages.push(message);
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }
  }

  getDevices(): IoTDevice[] {
    return Array.from(this.devices.values());
  }

  getMessages(limit: number = 100): IoTMessage[] {
    return this.messages.slice(-limit);
  }

  getSSID() { return this.ssid; }
  getPassword() { return this.password; }
}

// ─── Virtual MQTT Broker ────────────────────────────────────

class VirtualMQTTBroker {
  private topics: Map<string, string[]> = new Map();
  private subscribers: Map<string, Set<string>> = new Map();
  private messages: IoTMessage[] = [];
  private maxMessages = 500;

  subscribe(clientId: string, topic: string) {
    if (!this.subscribers.has(clientId)) {
      this.subscribers.set(clientId, new Set());
    }
    this.subscribers.get(clientId)!.add(topic);
  }

  unsubscribe(clientId: string, topic: string) {
    this.subscribers.get(clientId)?.delete(topic);
  }

  publish(topic: string, payload: string, clientId: string): boolean {
    // Store message
    this.messages.push({
      protocol: "mqtt",
      topic,
      payload,
      timestamp: Date.now(),
      direction: "in",
    });
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }

    // Broadcast to subscribers
    for (const [subClientId, topics] of this.subscribers.entries()) {
      if (subClientId !== clientId && topics.has(topic)) {
        // Simulate delivery
        console.log(`[MQTT] ${topic}: ${payload} → ${subClientId}`);
      }
    }
    return true;
  }

  getMessages(limit: number = 50): IoTMessage[] {
    return this.messages.slice(-limit);
  }
}

// ─── Virtual Serial Port ────────────────────────────────────

class VirtualSerialPort {
  private portName: string;
  private baudRate: number;
  private isOpen: boolean = false;
  private buffer: Uint8Array[] = [];
  private onData?: (data: Uint8Array) => void;

  constructor(portName: string, baudRate: number = 115200) {
    this.portName = portName;
    this.baudRate = baudRate;
  }

  open(): boolean {
    this.isOpen = true;
    console.log(`[Serial] Opened ${this.portName} @ ${this.baudRate} baud`);
    return true;
  }

  close(): boolean {
    this.isOpen = false;
    return true;
  }

  write(data: Uint8Array | string): boolean {
    if (!this.isOpen) return false;
    const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
    this.buffer.push(bytes);
    return true;
  }

  read(): Uint8Array | null {
    return this.buffer.shift() || null;
  }

  onDataReceived(callback: (data: Uint8Array) => void) {
    this.onData = callback;
  }

  isOpened() { return this.isOpen; }
  getPortName() { return this.portName; }
  getBaudRate() { return this.baudRate; }
}

// ─── Bluetooth Virtual Adapter ──────────────────────────────

class VirtualBluetoothAdapter {
  private devices: Map<string, { name: string; uuid: string; isConnected: boolean }> = new Map();
  private isScanning: boolean = false;

  startScan() {
    this.isScanning = true;
  }

  stopScan() {
    this.isScanning = false;
  }

  advertise(name: string, uuid: string) {
    this.devices.set(uuid, { name, uuid, isConnected: false });
  }

  connect(uuid: string): boolean {
    const device = this.devices.get(uuid);
    if (device) {
      device.isConnected = true;
      return true;
    }
    return false;
  }

  disconnect(uuid: string): boolean {
    const device = this.devices.get(uuid);
    if (device) {
      device.isConnected = false;
      return true;
    }
    return false;
  }

  getDevices() {
    return Array.from(this.devices.values());
  }

  isScanning_() { return this.isScanning; }
}

// ─── Global IoT Simulation Context ──────────────────────────

let globalWiFiNetwork: VirtualWiFiNetwork | null = null;
let globalMQTTBroker: VirtualMQTTBroker | null = null;
let globalSerialPorts: Map<string, VirtualSerialPort> = new Map();
let globalBluetoothAdapter: VirtualBluetoothAdapter | null = null;

export function initializeIoTSimulation() {
  if (!globalWiFiNetwork) {
    globalWiFiNetwork = new VirtualWiFiNetwork();
    globalMQTTBroker = new VirtualMQTTBroker();
    globalBluetoothAdapter = new VirtualBluetoothAdapter();
  }
}

// ─── Hook: useIoTSimulation ─────────────────────────────────

export function useIoTSimulation() {
  const components = useSimulationStore((s) => s.components);
  const log = useSimulationStore((s) => s.log);
  const iotDevicesRef = useRef<Map<string, IoTDevice>>(new Map());

  useEffect(() => {
    initializeIoTSimulation();
  }, []);

  const registerDevice = useCallback(
    (componentId: string, type: "esp32" | "arduino" | "raspberry-pi", protocols: IoTProtocol[]) => {
      const deviceId = `iot-${componentId}`;
      const device: IoTDevice = {
        id: deviceId,
        componentId,
        type,
        protocols,
        isConnected: false,
      };

      iotDevicesRef.current.set(deviceId, device);
      globalWiFiNetwork?.addDevice(device);

      log("info", `IoT Device registered: ${type} (${deviceId})`);
      return deviceId;
    },
    [log]
  );

  const connectWiFi = useCallback(
    (deviceId: string, ssid: string, password: string): boolean => {
      const device = iotDevicesRef.current.get(deviceId);
      if (!device) return false;

      device.ssid = ssid;
      device.password = password;
      const success = globalWiFiNetwork?.connectDevice(deviceId) ?? false;

      if (success) {
        log("success", `WiFi connected: ${ssid} (signal: ${device.signalStrength?.toFixed(0)}%)`);
      } else {
        log("error", `Failed to connect to WiFi: ${ssid}`);
      }

      return success;
    },
    [log]
  );

  const publishMQTT = useCallback(
    (deviceId: string, topic: string, payload: string): boolean => {
      const device = iotDevicesRef.current.get(deviceId);
      if (!device || !device.isConnected) {
        log("error", `MQTT publish failed: device not connected`);
        return false;
      }

      const success = globalMQTTBroker?.publish(topic, payload, deviceId) ?? false;
      if (success) {
        log("info", `MQTT published: ${topic} = ${payload}`);
      }
      return success;
    },
    [log]
  );

  const subscribeMQTT = useCallback(
    (deviceId: string, topic: string) => {
      globalMQTTBroker?.subscribe(deviceId, topic);
      log("info", `MQTT subscribed: ${topic}`);
    },
    [log]
  );

  const openSerialPort = useCallback(
    (deviceId: string, portName: string, baudRate: number = 115200): VirtualSerialPort | null => {
      const port = new VirtualSerialPort(portName, baudRate);
      if (port.open()) {
        globalSerialPorts.set(deviceId, port);
        log("success", `Serial port opened: ${portName} @ ${baudRate} baud`);
        return port;
      }
      return null;
    },
    [log]
  );

  const sendSerial = useCallback(
    (deviceId: string, data: string | Uint8Array): boolean => {
      const port = globalSerialPorts.get(deviceId);
      if (!port || !port.isOpened()) {
        log("error", `Serial port not open: ${deviceId}`);
        return false;
      }

      const success = port.write(data);
      if (success) {
        const display = typeof data === "string" ? data : new TextDecoder().decode(data);
        log("info", `Serial sent: ${display}`);
      }
      return success;
    },
    [log]
  );

  const getWiFiNetworks = useCallback(() => {
    return [
      { ssid: "SimForge-Lab", password: "simforge123", signal: 95 },
      { ssid: "Guest-Network", password: "guest123", signal: 70 },
    ];
  }, []);

  const getConnectedDevices = useCallback(() => {
    return Array.from(iotDevicesRef.current.values()).filter((d) => d.isConnected);
  }, []);

  const getMQTTMessages = useCallback((limit: number = 50) => {
    return globalMQTTBroker?.getMessages(limit) ?? [];
  }, []);

  const getSerialOutput = useCallback((deviceId: string): string => {
    const port = globalSerialPorts.get(deviceId);
    if (!port) return "";
    let output = "";
    let data;
    while ((data = port.read()) !== null) {
      output += new TextDecoder().decode(data);
    }
    return output;
  }, []);

  return {
    registerDevice,
    connectWiFi,
    publishMQTT,
    subscribeMQTT,
    openSerialPort,
    sendSerial,
    getWiFiNetworks,
    getConnectedDevices,
    getMQTTMessages,
    getSerialOutput,
  };
}

// ─── Export singleton instances ──────────────────────────────

export function getGlobalWiFiNetwork() {
  initializeIoTSimulation();
  return globalWiFiNetwork!;
}

export function getGlobalMQTTBroker() {
  initializeIoTSimulation();
  return globalMQTTBroker!;
}

export function getGlobalBluetoothAdapter() {
  initializeIoTSimulation();
  return globalBluetoothAdapter!;
}
