from fastapi import FastAPI
from pydantic import BaseModel


class SuggestRequest(BaseModel):
    project_name: str
    component_type: str
    target_runtime: str


class SuggestReply(BaseModel):
    summary: str
    actions: list[str]


app = FastAPI(title="SimForge AI Copilot", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "simforge-ai-copilot"}


@app.post("/suggest", response_model=SuggestReply)
def suggest(request: SuggestRequest) -> SuggestReply:
    return SuggestReply(
        summary=f"Recommended workflow for {request.component_type} on {request.target_runtime}.",
        actions=[
            "Generate runtime scaffold",
            "Validate power and interface assumptions",
            "Attach telemetry and debugger traces",
            "Prepare scenario-specific regression suite",
        ],
    )
