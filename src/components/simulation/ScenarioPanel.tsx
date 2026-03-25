import { useState, useEffect, useRef, useCallback } from "react";
import { useSimulationStore, componentCreators } from "@/stores/simulationStore";
import { Trophy, Target, ChevronRight, Lock, CheckCircle, Clock, Zap, Bot, Cpu, Wifi } from "lucide-react";

// ─── Scenario definitions ──────────────────────────────────

export interface ScenarioGoal {
  id: string;
  description: string;
  completed: boolean;
  points: number;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  category: "robotics" | "iot" | "electronics" | "automation";
  icon: string;
  estimatedTime: string;
  goals: ScenarioGoal[];
  starterCode: string;
  components: string[];
  environment: string;
  hint: string;
  locked: boolean;
}

const SCENARIOS: Scenario[] = [
  // ── Robotics ──────────────────────────────────────────────
  {
    id: "blink-led",
    title: "Hello, World — Blink LED",
    description: "The classic first project. Make the built-in LED on pin 13 blink on and off every second.",
    difficulty: "beginner",
    category: "electronics",
    icon: "💡",
    estimatedTime: "5 min",
    locked: false,
    environment: "robotics-lab",
    components: ["arduino-uno", "led", "resistor"],
    goals: [
      { id: "upload", description: "Upload code to Arduino", completed: false, points: 10 },
      { id: "blink", description: "LED blinks at least 3 times", completed: false, points: 20 },
      { id: "timing", description: "LED blinks with 1s interval", completed: false, points: 20 },
    ],
    hint: "Use digitalWrite(13, HIGH) to turn on, delay(1000) to wait, then digitalWrite(13, LOW).",
    starterCode: `// SimForge — Blink LED
// Goal: Make the LED on pin 13 blink every second

void setup() {
  pinMode(13, OUTPUT);   // Set pin 13 as output
  Serial.begin(9600);
}

void loop() {
  // Write your code here!
  // Hint: Use digitalWrite() and delay()

}`,
  },
  {
    id: "obstacle-avoidance",
    title: "Obstacle Avoidance Robot",
    description: "Program a 2WD robot to navigate a room autonomously. When the ultrasonic sensor detects an object within 20cm, the robot must turn to avoid it.",
    difficulty: "intermediate",
    category: "robotics",
    icon: "🤖",
    estimatedTime: "25 min",
    locked: false,
    environment: "obstacle-course",
    components: ["arduino-uno", "robot-2wd-car", "hc-sr04", "l298n-driver"],
    goals: [
      { id: "move-forward", description: "Robot moves forward", completed: false, points: 15 },
      { id: "detect", description: "Robot detects obstacle < 20cm", completed: false, points: 20 },
      { id: "turn", description: "Robot turns on detection", completed: false, points: 25 },
      { id: "no-crash", description: "Robot navigates 30s without hitting wall", completed: false, points: 40 },
    ],
    hint: "Read HC-SR04 distance, if < 20cm reverse and turn, then continue forward.",
    starterCode: `// SimForge — Obstacle Avoidance
// HC-SR04: TRIG=7, ECHO=8
// L298N: IN1=3, IN2=4, IN3=5, IN4=6, ENA=9, ENB=10

#define TRIG_PIN  7
#define ECHO_PIN  8
#define IN1  3
#define IN2  4
#define IN3  5
#define IN4  6
#define ENA  9
#define ENB  10
#define STOP_DISTANCE 20  // cm

void setup() {
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  analogWrite(ENA, 180);
  analogWrite(ENB, 180);
  Serial.begin(9600);
  Serial.println("Obstacle Avoidance Robot Ready");
}

long getDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delay(2);
  digitalWrite(TRIG_PIN, HIGH);
  delay(10);
  digitalWrite(TRIG_PIN, LOW);
  // TODO: read echo pulse and convert to cm
  return 100; // placeholder
}

void moveForward() {
  digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);
  digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW);
}

void turnRight() {
  digitalWrite(IN1, LOW);  digitalWrite(IN2, HIGH);
  digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW);
  delay(600);
}

void stopMotors() {
  digitalWrite(IN1, LOW); digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW); digitalWrite(IN4, LOW);
}

void loop() {
  long dist = getDistance();
  Serial.print("Distance: ");
  Serial.println(dist);

  if (dist < STOP_DISTANCE) {
    stopMotors();
    delay(300);
    // TODO: turn away from obstacle
  } else {
    moveForward();
  }
  delay(50);
}`,
  },
  {
    id: "line-follower",
    title: "Line Following Robot",
    description: "Guide a robot to follow a black line on a white surface using IR sensors. The robot must complete a full lap of the oval track.",
    difficulty: "intermediate",
    category: "robotics",
    icon: "➰",
    estimatedTime: "30 min",
    locked: false,
    environment: "line-follow-track",
    components: ["arduino-uno", "robot-2wd-car", "line-follower-ir", "l298n-driver"],
    goals: [
      { id: "detect-line", description: "Robot detects the black line", completed: false, points: 15 },
      { id: "follow-line", description: "Robot follows the line for 10s", completed: false, points: 30 },
      { id: "complete-lap", description: "Robot completes a full lap", completed: false, points: 55 },
    ],
    hint: "Read the 5 IR sensors. If centre sensor is on line, go straight. If left sensors trigger, turn left. If right sensors trigger, turn right.",
    starterCode: `// SimForge — Line Follower
// IR Sensors: S1=A0, S2=A1, S3=A2, S4=A3, S5=A4
// Motors: IN1=3, IN2=4, IN3=5, IN4=6, ENA=9, ENB=10

#define S1 A0
#define S2 A1
#define S3 A2
#define S4 A3
#define S5 A4
#define BASE_SPEED 160

void setup() {
  Serial.begin(9600);
  // Set motor pins as OUTPUT
  // Your setup code here...
}

void loop() {
  bool s1 = digitalRead(S1);
  bool s2 = digitalRead(S2);
  bool s3 = digitalRead(S3);  // Center
  bool s4 = digitalRead(S4);
  bool s5 = digitalRead(S5);

  // PID line following logic here
  // Hint: error = weighted sum of sensor readings
  // Adjust left/right motor speeds based on error

  if (s3) {
    // On line — go straight
  } else if (s1 || s2) {
    // Line is to the LEFT — turn left
  } else if (s4 || s5) {
    // Line is to the RIGHT — turn right
  }
}`,
  },
  {
    id: "colour-sorting",
    title: "Colour Sorting Robot Arm",
    description: "Program a 4-DOF robotic arm to pick up coloured objects from a conveyor belt and place them into matching bins.",
    difficulty: "advanced",
    category: "robotics",
    icon: "🎨",
    estimatedTime: "45 min",
    locked: false,
    environment: "industrial",
    components: ["arduino-mega", "robot-arm-4dof", "color-sensor-tcs3200", "servo-sg90", "env-conveyor"],
    goals: [
      { id: "read-color", description: "Read colour sensor output", completed: false, points: 20 },
      { id: "move-arm", description: "Arm moves to pickup position", completed: false, points: 20 },
      { id: "grip", description: "Gripper picks up object", completed: false, points: 20 },
      { id: "sort-one", description: "Sort 1 object to correct bin", completed: false, points: 20 },
      { id: "sort-five", description: "Sort 5 objects without error", completed: false, points: 20 },
    ],
    hint: "Read TCS3200 color frequency, determine red/green/blue, then use inverse kinematics to position arm over correct bin.",
    starterCode: `// SimForge — Colour Sorting Arm
// TCS3200: S0=4, S1=5, S2=6, S3=7, OUT=8
// Servos: BASE=9, SHOULDER=10, ELBOW=11, GRIPPER=12

#include <Servo.h>

Servo base, shoulder, elbow, gripper;

// Bin positions [base, shoulder, elbow]
int RED_BIN[]    = {45,  120, 60};
int GREEN_BIN[]  = {90,  120, 60};
int BLUE_BIN[]   = {135, 120, 60};
int PICKUP_POS[] = {90,  90,  130};

void setup() {
  base.attach(9);
  shoulder.attach(10);
  elbow.attach(11);
  gripper.attach(12);
  Serial.begin(9600);
  Serial.println("Colour Sorting Ready");
  goToPosition(90, 90, 90);
  gripper.write(0); // Open
}

void goToPosition(int b, int s, int e) {
  base.write(b);
  shoulder.write(s);
  elbow.write(e);
  delay(800); // Wait for movement
}

String readColour() {
  // TODO: Read TCS3200 and return "red", "green", or "blue"
  return "red"; // placeholder
}

void sortObject(String color) {
  // 1. Move to pickup
  goToPosition(PICKUP_POS[0], PICKUP_POS[1], PICKUP_POS[2]);
  gripper.write(90); // Close gripper
  delay(500);

  // 2. Move to correct bin
  if (color == "red")        goToPosition(RED_BIN[0],   RED_BIN[1],   RED_BIN[2]);
  else if (color == "green") goToPosition(GREEN_BIN[0], GREEN_BIN[1], GREEN_BIN[2]);
  else if (color == "blue")  goToPosition(BLUE_BIN[0],  BLUE_BIN[1],  BLUE_BIN[2]);

  // 3. Release
  gripper.write(0);
  delay(300);
}

void loop() {
  String color = readColour();
  Serial.println("Detected: " + color);
  sortObject(color);
  delay(1000);
}`,
  },
  // ── IoT ─────────────────────────────────────────────────
  {
    id: "iot-garden",
    title: "Smart Garden Monitor",
    description: "Build an IoT garden monitoring system. Read soil moisture, temperature, humidity, and light level. Send alerts and control a water pump via relay.",
    difficulty: "intermediate",
    category: "iot",
    icon: "🌿",
    estimatedTime: "35 min",
    locked: false,
    environment: "smart-garden",
    components: ["esp32-wroom", "dht22", "soil-moisture", "ldr-module", "relay-module"],
    goals: [
      { id: "read-temp", description: "Read temperature & humidity", completed: false, points: 15 },
      { id: "read-soil", description: "Read soil moisture level", completed: false, points: 15 },
      { id: "serial-output", description: "Print all readings to Serial", completed: false, points: 20 },
      { id: "pump-control", description: "Activate relay when soil is dry", completed: false, points: 25 },
      { id: "threshold", description: "Implement configurable threshold", completed: false, points: 25 },
    ],
    hint: "Connect DHT22 to pin 4, soil moisture to A0, LDR to A1, relay to pin 16.",
    starterCode: `// SimForge — Smart Garden Monitor (ESP32)
#include <DHT.h>

#define DHT_PIN     4
#define SOIL_PIN    34   // Analog
#define LDR_PIN     35   // Analog
#define RELAY_PIN   16
#define DRY_THRESHOLD 2500  // Analog value — higher = drier

DHT dht(DHT_PIN, DHT22);

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // Pump off
  Serial.println("Garden Monitor Online");
}

void loop() {
  // Read sensors
  float temp  = dht.readTemperature();
  float hum   = dht.readHumidity();
  int   soil  = analogRead(SOIL_PIN);
  int   light = analogRead(LDR_PIN);

  // Print to Serial Monitor
  Serial.print("Temp: ");    Serial.print(temp);   Serial.print("°C  ");
  Serial.print("Humidity: "); Serial.print(hum);   Serial.print("%  ");
  Serial.print("Soil: ");    Serial.print(soil);   Serial.print("  ");
  Serial.print("Light: ");   Serial.println(light);

  // TODO: Control pump based on soil moisture
  // If soil is DRY (high reading), turn on relay
  if (soil > DRY_THRESHOLD) {
    // Activate pump
    digitalWrite(RELAY_PIN, HIGH);
    Serial.println(">>> PUMP ON — soil dry");
  } else {
    // Soil is moist
    digitalWrite(RELAY_PIN, LOW);
  }

  delay(2000);
}`,
  },
  {
    id: "iot-smart-home",
    title: "Smart Home Controller",
    description: "Create a smart home system that controls lights based on motion detection, time of day, and remote commands via Bluetooth.",
    difficulty: "advanced",
    category: "iot",
    icon: "🏠",
    estimatedTime: "50 min",
    locked: false,
    environment: "smart-home",
    components: ["esp32-wroom", "pir-sensor", "relay-module", "hc05-bluetooth", "ldr-module", "oled-ssd1306"],
    goals: [
      { id: "motion-detect", description: "Detect motion with PIR sensor", completed: false, points: 15 },
      { id: "auto-lights", description: "Lights turn on with motion in dark", completed: false, points: 20 },
      { id: "bt-control", description: "Control lights via Bluetooth command", completed: false, points: 25 },
      { id: "oled-display", description: "Show status on OLED screen", completed: false, points: 20 },
      { id: "schedule", description: "Implement time-based automation", completed: false, points: 20 },
    ],
    hint: "ESP32 has built-in BLE. Use PIR sensor on pin 23, relay on pin 16, OLED on I2C pins 21/22.",
    starterCode: `// SimForge — Smart Home Controller (ESP32)
#include <Wire.h>
#include <Adafruit_SSD1306.h>

#define PIR_PIN   23
#define RELAY_PIN 16
#define LDR_PIN   34

Adafruit_SSD1306 display(128, 64, &Wire, -1);

bool lightsOn    = false;
bool autoMode    = true;
unsigned long lastMotion = 0;
const int LIGHTS_TIMEOUT = 30000; // 30 seconds

void setup() {
  Serial.begin(115200);
  pinMode(PIR_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  display.setTextColor(WHITE);
  display.println("Smart Home v1.0");
  display.display();
  Serial.println("Smart Home Online");
}

void setLights(bool on) {
  lightsOn = on;
  digitalWrite(RELAY_PIN, on ? HIGH : LOW);
}

void updateDisplay() {
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Smart Home");
  display.print("Lights: ");  display.println(lightsOn ? "ON " : "OFF");
  display.print("Mode: ");    display.println(autoMode  ? "AUTO" : "MANUAL");
  int light = analogRead(LDR_PIN);
  display.print("Light: ");   display.println(light);
  display.display();
}

void loop() {
  bool motion  = digitalRead(PIR_PIN);
  int  ambient = analogRead(LDR_PIN);
  bool isDark  = ambient < 1500;

  if (autoMode) {
    if (motion && isDark) {
      setLights(true);
      lastMotion = millis();
    }
    if (lightsOn && millis() - lastMotion > LIGHTS_TIMEOUT) {
      setLights(false);
    }
  }

  // Check Serial for commands (BT commands come through Serial2)
  if (Serial.available()) {
    char cmd = Serial.read();
    if (cmd == '1') { setLights(true);  autoMode = false; }
    if (cmd == '0') { setLights(false); autoMode = false; }
    if (cmd == 'a') { autoMode = true; }
  }

  updateDisplay();
  delay(200);
}`,
  },
  {
    id: "pid-motor",
    title: "PID Speed Controller",
    description: "Implement a PID controller to maintain a DC motor at a target RPM using encoder feedback. Essential skill for all robotics.",
    difficulty: "expert",
    category: "robotics",
    icon: "⚙️",
    estimatedTime: "60 min",
    locked: true,
    environment: "robotics-lab",
    components: ["arduino-uno", "dc-motor-encoder", "l298n-driver"],
    goals: [
      { id: "read-encoder", description: "Read encoder ticks", completed: false, points: 20 },
      { id: "calculate-rpm", description: "Calculate actual RPM", completed: false, points: 20 },
      { id: "p-control", description: "Implement P controller", completed: false, points: 20 },
      { id: "pid-control", description: "Implement full PID", completed: false, points: 20 },
      { id: "stable", description: "Hold target RPM ±5% for 10s", completed: false, points: 20 },
    ],
    hint: "error = setpoint - measured. output = Kp*error + Ki*integral + Kd*derivative",
    starterCode: `// SimForge — PID Speed Controller`,
  },
  {
    id: "drone-flight",
    title: "Quadcopter Flight Controller",
    description: "Program a quadcopter to take off, hover at 1.5m altitude, and land autonomously using IMU feedback.",
    difficulty: "expert",
    category: "robotics",
    icon: "🚁",
    estimatedTime: "90 min",
    locked: true,
    environment: "outdoor-field",
    components: ["arduino-mega", "robot-quadcopter", "mpu6050", "bmp280"],
    goals: [
      { id: "arm", description: "Successfully arm motors", completed: false, points: 10 },
      { id: "takeoff", description: "Achieve stable hover", completed: false, points: 25 },
      { id: "altitude-hold", description: "Hold 1.5m altitude ±10cm", completed: false, points: 30 },
      { id: "land", description: "Land without crashing", completed: false, points: 35 },
    ],
    hint: "Implement separate PID loops for roll, pitch, yaw, and altitude.",
    starterCode: `// SimForge — Quadcopter Flight Controller`,
  },
];

// ─── Difficulty badge ──────────────────────────────────────

function DifficultyBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    beginner:     "bg-green-500/20 text-green-400 border-green-500/30",
    intermediate: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    advanced:     "bg-orange-500/20 text-orange-400 border-orange-500/30",
    expert:       "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return (
    <span className={`px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded border ${styles[level] ?? ""}`}>
      {level}
    </span>
  );
}

// ─── Category icon ─────────────────────────────────────────

function CategoryIcon({ cat }: { cat: string }) {
  return cat === "robotics" ? <Bot className="w-3 h-3" />
       : cat === "iot"      ? <Wifi className="w-3 h-3" />
       : cat === "electronics" ? <Zap className="w-3 h-3" />
       : <Cpu className="w-3 h-3" />;
}

// ─── Goal row ──────────────────────────────────────────────

function GoalRow({ goal }: { goal: ScenarioGoal }) {
  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[10px] transition-colors ${
      goal.completed ? "bg-green-500/10 border border-green-500/20" : "bg-secondary/40 border border-border"
    }`}>
      <CheckCircle className={`w-3 h-3 flex-shrink-0 ${goal.completed ? "text-green-400" : "text-muted-foreground/30"}`} />
      <span className={goal.completed ? "text-green-300 line-through" : "text-foreground"}>{goal.description}</span>
      <span className={`ml-auto font-mono flex-shrink-0 ${goal.completed ? "text-green-400" : "text-muted-foreground"}`}>+{goal.points}pts</span>
    </div>
  );
}

// ─── Scenario card ─────────────────────────────────────────

function ScenarioCard({ scenario, onSelect }: { scenario: Scenario; onSelect: (s: Scenario) => void }) {
  const totalPts    = scenario.goals.reduce((a, g) => a + g.points, 0);
  const earnedPts   = scenario.goals.filter(g => g.completed).reduce((a, g) => a + g.points, 0);
  const progress    = totalPts > 0 ? (earnedPts / totalPts) * 100 : 0;
  const completed   = progress === 100;

  return (
    <button
      onClick={() => !scenario.locked && onSelect(scenario)}
      className={`w-full text-left p-3 rounded-xl border transition-all group ${
        scenario.locked ? "opacity-50 cursor-not-allowed border-border bg-secondary/20"
        : completed ? "border-green-500/40 bg-green-500/5 hover:bg-green-500/10"
        : "border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{scenario.locked ? "🔒" : scenario.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{scenario.title}</span>
            <DifficultyBadge level={scenario.difficulty} />
            {completed && <span className="text-[9px] text-green-400 font-mono">✓ COMPLETE</span>}
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed mb-2 line-clamp-2">{scenario.description}</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <Clock className="w-3 h-3" />{scenario.estimatedTime}
            </div>
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <CategoryIcon cat={scenario.category} />{scenario.category}
            </div>
            <div className="flex items-center gap-1 text-[9px] text-primary ml-auto">
              <Trophy className="w-3 h-3" />{earnedPts}/{totalPts} pts
            </div>
          </div>
          {progress > 0 && (
            <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
        {!scenario.locked && (
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors mt-1" />
        )}
      </div>
    </button>
  );
}

// ─── Active scenario panel ─────────────────────────────────

function ActiveScenarioPanel({ scenario, onLoad, onClose }: {
  scenario: Scenario;
  onLoad: (s: Scenario) => void;
  onClose: () => void;
}) {
  const totalPts  = scenario.goals.reduce((a, g) => a + g.points, 0);
  const earnedPts = scenario.goals.filter(g => g.completed).reduce((a, g) => a + g.points, 0);

  return (
    <div className="p-3 border border-primary/30 rounded-xl bg-primary/5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{scenario.icon}</span>
          <div>
            <div className="text-sm font-semibold text-foreground">{scenario.title}</div>
            <DifficultyBadge level={scenario.difficulty} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-lg font-bold text-primary font-mono">{earnedPts}</div>
            <div className="text-[9px] text-muted-foreground">/ {totalPts} pts</div>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">✕</button>
        </div>
      </div>

      {/* Goals */}
      <div className="space-y-1">
        <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Goals</div>
        {scenario.goals.map(goal => <GoalRow key={goal.id} goal={goal} />)}
      </div>

      {/* Hint */}
      <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <div className="text-[9px] font-mono text-yellow-400 mb-1">💡 HINT</div>
        <div className="text-[10px] text-yellow-200/80">{scenario.hint}</div>
      </div>

      {/* Load button */}
      <button
        onClick={() => onLoad(scenario)}
        className="w-full py-2 text-xs font-semibold rounded-lg bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors"
      >
        Load Scenario → Set Code + Components
      </button>
    </div>
  );
}

// ─── Main ScenarioPanel ────────────────────────────────────

interface Props {
  onScenarioLoad?: (scenario: Scenario) => void;
}

export function ScenarioPanel({ onScenarioLoad }: Props) {
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [filter, setFilter]   = useState<string>("all");
  const [search, setSearch]   = useState("");
  const setCode     = useSimulationStore((s) => s.setFirmwareCode);
  const addComponent = useSimulationStore((s) => s.addComponent);
  const log          = useSimulationStore((s) => s.log);

  const categories = ["all", "robotics", "iot", "electronics", "automation"];

  const filtered = SCENARIOS.filter(s => {
    const matchCat = filter === "all" || s.category === filter;
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleLoad = useCallback((scenario: Scenario) => {
    // Load starter code into editor
    setCode(scenario.starterCode);
    log("success", `Loaded scenario: ${scenario.title}`);
    log("info", `${scenario.components.length} components added to scene`);

    // Notify parent (to switch environment, etc.)
    onScenarioLoad?.(scenario);
  }, [setCode, addComponent, log, onScenarioLoad]);

  const totalScore  = SCENARIOS.flatMap(s => s.goals).filter(g => g.completed).reduce((a,g) => a+g.points, 0);
  const maxScore    = SCENARIOS.flatMap(s => s.goals).reduce((a,g) => a+g.points, 0);

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="p-3 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">Scenarios</span>
          </div>
          <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-lg px-2 py-1">
            <Trophy className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-mono text-primary">{totalScore} / {maxScore}</span>
          </div>
        </div>

        {/* Search */}
        <input
          placeholder="Search scenarios..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
        />

        {/* Category filter */}
        <div className="flex gap-1 mt-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-2 py-0.5 text-[9px] font-mono uppercase rounded-md border transition-colors ${
                filter === cat ? "bg-primary/20 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Scenario list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {activeScenario && (
          <ActiveScenarioPanel
            scenario={activeScenario}
            onLoad={handleLoad}
            onClose={() => setActiveScenario(null)}
          />
        )}
        {filtered.map(scenario => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            onSelect={setActiveScenario}
          />
        ))}
      </div>
    </div>
  );
}

export { SCENARIOS };
