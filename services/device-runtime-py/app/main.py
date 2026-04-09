from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


class RuntimeArtifact(BaseModel):
    board: str
    target: str
    language: str
    entry_file: str
    interfaces: list[str] = []
    resource_profile: str = "interactive"


class ValidationReply(BaseModel):
    status: str
    compatible: bool
    checks: list[str]
    warnings: list[str]


class PrepareRunRequest(BaseModel):
    project_id: str
    target: str
    board: str
    interfaces: list[str]
    scenario: str = "interactive"


app = FastAPI(title="SimForge Device Runtime", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


SUPPORTED_LANGUAGES = {"cpp", "c++", "python", "ts", "typescript"}
BOARD_TO_INTERFACES = {
    "Arduino Uno R3": {"gpio", "pwm", "uart"},
    "ESP32-WROOM-32": {"gpio", "pwm", "uart", "wifi"},
    "Raspberry Pi 4B": {"gpio", "uart", "linux-service", "network"},
}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "simforge-device-runtime"}


@app.post("/artifacts/register")
def register_artifact(artifact: RuntimeArtifact) -> dict[str, str]:
    return {
        "status": "registered",
        "board": artifact.board,
        "target": artifact.target,
        "entry_file": artifact.entry_file,
    }


@app.post("/artifacts/validate", response_model=ValidationReply)
def validate_artifact(artifact: RuntimeArtifact) -> ValidationReply:
    checks = [
        f"entry file {artifact.entry_file} is declared",
        f"runtime target {artifact.target} is attached",
        f"resource profile {artifact.resource_profile} is selected",
    ]
    warnings: list[str] = []

    compatible = artifact.language.lower() in SUPPORTED_LANGUAGES
    if not compatible:
        warnings.append(f"Language {artifact.language} is not in the supported runtime set.")

    supported_interfaces = BOARD_TO_INTERFACES.get(artifact.board, set())
    unsupported = [interface for interface in artifact.interfaces if interface not in supported_interfaces]
    if unsupported:
        warnings.append(
            f"Board {artifact.board} does not advertise interfaces: {', '.join(unsupported)}."
        )
        compatible = False

    if artifact.target == "ros2-control" and "linux-service" not in supported_interfaces and "network" not in supported_interfaces:
        warnings.append("ROS 2 target usually expects a Linux-class runtime or network bridge.")

    return ValidationReply(
        status="validated" if compatible else "needs-review",
        compatible=compatible,
        checks=checks,
        warnings=warnings,
    )


@app.post("/runs/prepare")
def prepare_run(request: PrepareRunRequest) -> dict[str, object]:
    runtime_bindings = {
        "project_id": request.project_id,
        "target": request.target,
        "scenario": request.scenario,
        "board": request.board,
        "bindings": [
            {"interface": interface, "transport": "simulated"} for interface in request.interfaces
        ],
        "status": "prepared",
    }
    return runtime_bindings
