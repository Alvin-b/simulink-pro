export type FirmwareProfile = {
  id: string;
  board: string;
  language: "cpp" | "python" | "rust";
  runtime: string;
  toolchain: string;
  debugger: string;
  sampleFiles: Array<{ name: string; content: string }>;
};

export const firmwareProfiles: FirmwareProfile[] = [
  {
    id: "fw.arduino.avr",
    board: "Arduino Uno R3",
    language: "cpp",
    runtime: "AVR sketch runtime",
    toolchain: "avr-gcc / avrdude compatible",
    debugger: "Serial trace + pin timeline",
    sampleFiles: [
      {
        name: "main.ino",
        content: `#define LED_PIN 13\n#define BUTTON_PIN 2\n\nvoid setup() {\n  pinMode(LED_PIN, OUTPUT);\n  pinMode(BUTTON_PIN, INPUT_PULLUP);\n  Serial.begin(115200);\n  Serial.println(\"AVR runtime booted\");\n}\n\nvoid loop() {\n  int pressed = digitalRead(BUTTON_PIN) == LOW;\n  digitalWrite(LED_PIN, pressed ? HIGH : LOW);\n  Serial.print(\"button=\");\n  Serial.println(pressed);\n  delay(25);\n}\n`,
      },
    ],
  },
  {
    id: "fw.esp32.freertos",
    board: "ESP32-WROOM-32",
    language: "cpp",
    runtime: "Arduino on ESP32 / FreeRTOS",
    toolchain: "xtensa-esp32-elf / PlatformIO compatible",
    debugger: "UART trace + simulated Wi-Fi topic stream",
    sampleFiles: [
      {
        name: "app_main.cpp",
        content: `#include <Arduino.h>\n\nTaskHandle_t blinkTask;\n\nvoid blinkLoop(void* parameter) {\n  while (true) {\n    digitalWrite(2, !digitalRead(2));\n    Serial.println(\"edge-heartbeat\");\n    vTaskDelay(pdMS_TO_TICKS(500));\n  }\n}\n\nvoid setup() {\n  pinMode(2, OUTPUT);\n  Serial.begin(115200);\n  xTaskCreatePinnedToCore(blinkLoop, \"blink\", 4096, nullptr, 1, &blinkTask, 1);\n}\n\nvoid loop() {\n  vTaskDelay(pdMS_TO_TICKS(1000));\n}\n`,
      },
    ],
  },
  {
    id: "fw.stm32.control",
    board: "STM32F103 Blue Pill",
    language: "cpp",
    runtime: "Bare-metal / HAL control loop",
    toolchain: "arm-none-eabi-gcc",
    debugger: "SWD trace model + virtual register watch",
    sampleFiles: [
      {
        name: "main.cpp",
        content: `#include <stdint.h>\n\nstatic volatile uint32_t system_ticks = 0;\n\nextern \"C\" void SysTick_Handler() {\n  system_ticks++;\n}\n\nint main() {\n  while (1) {\n    // Placeholder for motor-control and sensor-fusion loop\n  }\n  return 0;\n}\n`,
      },
    ],
  },
  {
    id: "fw.rpi.edge",
    board: "Raspberry Pi 4B",
    language: "python",
    runtime: "Linux edge service",
    toolchain: "Python 3.11+",
    debugger: "Structured logs + process metrics",
    sampleFiles: [
      {
        name: "main.py",
        content: `import asyncio\n\nasync def main() -> None:\n    while True:\n        print({\"telemetry\": \"ok\", \"source\": \"rpi-edge\"})\n        await asyncio.sleep(1)\n\nif __name__ == \"__main__\":\n    asyncio.run(main())\n`,
      },
    ],
  },
];

export function getFirmwareProfileForBoard(board: string) {
  return firmwareProfiles.find((profile) => profile.board === board) ?? null;
}
