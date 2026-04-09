from collections import Counter

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


class SuggestRequest(BaseModel):
    project_name: str
    component_type: str | None = None
    target_runtime: str
    active_domains: list[str] = []
    component_types: list[str] = []
    telemetry_channels: list[str] = []


class SuggestReply(BaseModel):
    summary: str
    actions: list[str]
    risks: list[str]
    suggested_artifacts: list[str]


class DiagnoseRequest(BaseModel):
    project_name: str
    target_runtime: str
    component_types: list[str]
    active_domains: list[str]
    telemetry_channels: list[str] = []
    recent_console: list[str] = []


class DiagnoseReply(BaseModel):
    diagnosis: str
    bottlenecks: list[str]
    next_experiments: list[str]


app = FastAPI(title="SimForge AI Copilot", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def infer_risks(component_types: list[str], active_domains: list[str]) -> list[str]:
    risks: list[str] = []
    if any(item.startswith("robot-") for item in component_types) and "robotics" not in active_domains:
        risks.append("Robot assets exist without the robotics domain enabled.")
    if any("wifi" in item or "zigbee" in item for item in component_types) and "iot" not in active_domains:
        risks.append("Connected devices exist without the IoT domain enabled.")
    if any(item.startswith("arduino") or item.startswith("esp32") for item in component_types) and "embedded" not in active_domains:
        risks.append("Firmware-capable hardware exists without the embedded domain enabled.")
    if not component_types:
        risks.append("The project graph is still sparse; recommendations will be generic.")
    return risks


def infer_artifacts(target_runtime: str, component_types: list[str]) -> list[str]:
    artifacts = ["validation-report.md"]
    if "ROS" in target_runtime or "ros" in target_runtime.lower():
        artifacts.extend(["controller.cpp", "telemetry_bridge.yaml"])
    if "MQTT" in target_runtime or "mqtt" in target_runtime.lower():
        artifacts.extend(["telemetry.ts", "topic_contract.json"])
    if any(item.startswith("arduino") or item.startswith("esp32") for item in component_types):
        artifacts.extend(["main.ino", "pinmap.csv"])
    return artifacts


def summarize_project(component_types: list[str]) -> str:
    if not component_types:
        return "Graph is mostly empty, so the copilot is operating in architecture mode."
    counts = Counter(component_types)
    dominant = ", ".join(f"{name} x{count}" for name, count in counts.most_common(3))
    return f"Dominant assets in the current graph: {dominant}."


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "simforge-ai-copilot"}


@app.post("/suggest", response_model=SuggestReply)
def suggest(request: SuggestRequest) -> SuggestReply:
    component_types = request.component_types or ([request.component_type] if request.component_type else [])
    risks = infer_risks(component_types, request.active_domains)
    artifacts = infer_artifacts(request.target_runtime, component_types)

    return SuggestReply(
        summary=(
            f"{summarize_project(component_types)} "
            f"Recommended workflow for {request.component_type or 'the active project'} on {request.target_runtime}."
        ),
        actions=[
            "Generate a runtime scaffold aligned to the active execution target.",
            "Validate power, signal, and protocol assumptions against the current component graph.",
            "Attach telemetry channels for the selected domains and runtime.",
            "Prepare a scenario-specific regression and replay suite.",
        ],
        risks=risks,
        suggested_artifacts=artifacts,
    )


@app.post("/diagnose", response_model=DiagnoseReply)
def diagnose(request: DiagnoseRequest) -> DiagnoseReply:
    risks = infer_risks(request.component_types, request.active_domains)

    bottlenecks: list[str] = []
    if len(request.telemetry_channels) < 2:
        bottlenecks.append("Telemetry coverage is shallow; add timeline and subsystem channels.")
    if len(request.component_types) > 8:
        bottlenecks.append("Scene complexity is rising; split execution into deterministic phases.")
    if any("error" in line.lower() for line in request.recent_console):
        bottlenecks.append("Recent console output suggests unresolved runtime faults.")
    if not bottlenecks:
        bottlenecks.append("No dominant bottleneck found; the project is ready for higher-fidelity validation.")

    next_experiments = [
        "Run one scenario with full telemetry capture and compare replay determinism.",
        "Validate a minimal subset of components against the primary runtime target.",
        "Promote the most active telemetry streams into a regression baseline.",
    ]

    return DiagnoseReply(
        diagnosis=(
            f"{summarize_project(request.component_types)} "
            f"Primary runtime target: {request.target_runtime}. "
            f"{' '.join(risks) if risks else 'No cross-domain configuration mismatch detected.'}"
        ),
        bottlenecks=bottlenecks,
        next_experiments=next_experiments,
    )
