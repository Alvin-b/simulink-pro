from fastapi import FastAPI
from pydantic import BaseModel


class RuntimeArtifact(BaseModel):
    board: str
    language: str
    entry_file: str


app = FastAPI(title="SimForge Device Runtime", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "simforge-device-runtime"}


@app.post("/artifacts/register")
def register_artifact(artifact: RuntimeArtifact) -> dict[str, str]:
    return {
        "status": "registered",
        "board": artifact.board,
        "entry_file": artifact.entry_file,
    }
