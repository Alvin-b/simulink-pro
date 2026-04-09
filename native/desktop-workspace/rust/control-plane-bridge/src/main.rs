use axum::{extract::State, routing::{get, post}, Json, Router};
use serde::{Deserialize, Serialize};
use std::{net::SocketAddr, sync::{Arc, Mutex}};

#[derive(Clone, Default)]
struct AppState {
    sessions: Arc<Mutex<Vec<DesktopSession>>>,
}

#[derive(Clone, Serialize, Deserialize)]
struct DesktopSession {
    id: String,
    scene: String,
    fidelity: String,
    status: String,
}

#[derive(Serialize)]
struct Health {
    service: &'static str,
    status: &'static str,
}

#[derive(Deserialize)]
struct LaunchRequest {
    id: String,
    scene: String,
    fidelity: String,
}

async fn health() -> Json<Health> {
    Json(Health {
        service: "simforge-control-plane-bridge",
        status: "ok",
    })
}

async fn list_sessions(State(state): State<AppState>) -> Json<Vec<DesktopSession>> {
    Json(state.sessions.lock().expect("session lock").clone())
}

async fn launch_session(
    State(state): State<AppState>,
    Json(payload): Json<LaunchRequest>,
) -> Json<DesktopSession> {
    let session = DesktopSession {
        id: payload.id,
        scene: payload.scene,
        fidelity: payload.fidelity,
        status: "launching".to_string(),
    };
    state.sessions.lock().expect("session lock").push(session.clone());
    Json(session)
}

#[tokio::main]
async fn main() {
    let state = AppState::default();
    let app = Router::new()
        .route("/health", get(health))
        .route("/sessions", get(list_sessions).post(launch_session))
        .with_state(state);

    let address = SocketAddr::from(([127, 0, 0, 1], 4210));
    let listener = tokio::net::TcpListener::bind(address).await.expect("bind listener");
    axum::serve(listener, app).await.expect("serve control-plane bridge");
}
