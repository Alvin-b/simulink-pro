use serde::{Deserialize, Serialize};
use std::env;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};

#[derive(Serialize)]
struct EngineDescriptor {
    id: &'static str,
    domain: &'static str,
    fidelity: &'static str,
    capabilities: &'static [&'static str],
    deterministic: bool,
}

#[derive(Deserialize)]
struct PlanRequest {
    project_id: String,
    scenario: Option<String>,
    active_domains: Vec<String>,
    components: Vec<ComponentNode>,
    connections: Vec<ConnectionEdge>,
}

#[derive(Deserialize)]
struct ComponentNode {
    id: String,
    component_type: String,
}

#[derive(Deserialize)]
struct ConnectionEdge {
    source: Endpoint,
    target: Endpoint,
}

#[derive(Deserialize)]
struct Endpoint {
    node_id: String,
}

#[derive(Serialize)]
struct TelemetryChannel {
    id: String,
    semantic: &'static str,
    sample_rate_hz: u16,
}

#[derive(Serialize)]
struct ExecutionPhase {
    phase: &'static str,
    engine: &'static str,
    budget_ms: u16,
}

#[derive(Serialize)]
struct EngineRunPlan {
    project_id: String,
    scenario: String,
    fidelity_profile: &'static str,
    engine_sequence: Vec<ExecutionPhase>,
    telemetry_channels: Vec<TelemetryChannel>,
    warnings: Vec<String>,
    graph_density: f32,
    orchestration_tick_hz: u16,
}

#[derive(Serialize)]
struct HealthReply {
    status: &'static str,
    service: &'static str,
}

fn engine_catalog() -> Vec<EngineDescriptor> {
    vec![
        EngineDescriptor {
            id: "robotics-dynamics",
            domain: "robotics",
            fidelity: "hybrid",
            capabilities: &["kinematics", "contact", "navigation hooks", "replay"],
            deterministic: true,
        },
        EngineDescriptor {
            id: "firmware-runtime",
            domain: "embedded",
            fidelity: "interactive",
            capabilities: &["gpio", "pwm", "uart", "trace export"],
            deterministic: true,
        },
        EngineDescriptor {
            id: "iot-messaging",
            domain: "iot",
            fidelity: "interactive",
            capabilities: &["mqtt", "device twins", "telemetry rules", "cloud sync"],
            deterministic: false,
        },
    ]
}

fn graph_density(components: usize, connections: usize) -> f32 {
    if components <= 1 {
        return 0.0;
    }
    let max_edges = (components * (components - 1)) as f32;
    connections as f32 / max_edges
}

fn infer_fidelity(active_domains: usize, component_count: usize) -> &'static str {
    if active_domains >= 3 || component_count >= 10 {
        "validation"
    } else if active_domains >= 2 || component_count >= 5 {
        "engineering"
    } else {
        "interactive"
    }
}

fn collect_warnings(request: &PlanRequest) -> Vec<String> {
    let mut warnings = Vec::new();

    let connected_nodes: Vec<&str> = request
        .connections
        .iter()
        .flat_map(|edge| [edge.source.node_id.as_str(), edge.target.node_id.as_str()])
        .collect();

    let disconnected = request
        .components
        .iter()
        .filter(|component| !connected_nodes.contains(&component.id.as_str()))
        .count();
    if disconnected > 0 {
        warnings.push(format!(
            "{disconnected} component(s) are currently disconnected from the execution graph"
        ));
    }

    if request
        .components
        .iter()
        .any(|component| component.component_type.starts_with("robot-"))
        && !request.active_domains.iter().any(|domain| domain == "robotics")
    {
        warnings.push("Robot assets are present but the robotics domain is not active".to_string());
    }

    if request
        .components
        .iter()
        .any(|component| component.component_type.contains("wifi") || component.component_type.contains("zigbee"))
        && !request.active_domains.iter().any(|domain| domain == "iot")
    {
        warnings.push("Networked devices are present but the IoT domain is not active".to_string());
    }

    warnings
}

fn synthesize_run_plan(request: PlanRequest) -> EngineRunPlan {
    let density = graph_density(request.components.len(), request.connections.len());
    let fidelity = infer_fidelity(request.active_domains.len(), request.components.len());

    let mut engine_sequence = Vec::new();
    if request.active_domains.iter().any(|domain| domain == "robotics") {
        engine_sequence.push(ExecutionPhase {
            phase: "mechanics",
            engine: "robotics-dynamics",
            budget_ms: 8,
        });
    }
    if request.active_domains.iter().any(|domain| domain == "embedded") {
        engine_sequence.push(ExecutionPhase {
            phase: "control",
            engine: "firmware-runtime",
            budget_ms: 4,
        });
    }
    if request.active_domains.iter().any(|domain| domain == "iot") {
        engine_sequence.push(ExecutionPhase {
            phase: "telemetry",
            engine: "iot-messaging",
            budget_ms: 6,
        });
    }
    if engine_sequence.is_empty() {
        engine_sequence.push(ExecutionPhase {
            phase: "fallback",
            engine: "firmware-runtime",
            budget_ms: 4,
        });
    }

    let mut telemetry_channels = vec![TelemetryChannel {
        id: "run.timeline".to_string(),
        semantic: "timeline",
        sample_rate_hz: 60,
    }];
    if request.active_domains.iter().any(|domain| domain == "robotics") {
        telemetry_channels.push(TelemetryChannel {
            id: "robotics.pose".to_string(),
            semantic: "state-vector",
            sample_rate_hz: 60,
        });
    }
    if request.active_domains.iter().any(|domain| domain == "embedded") {
        telemetry_channels.push(TelemetryChannel {
            id: "embedded.pin-trace".to_string(),
            semantic: "digital-io",
            sample_rate_hz: 120,
        });
    }
    if request.active_domains.iter().any(|domain| domain == "iot") {
        telemetry_channels.push(TelemetryChannel {
            id: "iot.topic-stream".to_string(),
            semantic: "message-bus",
            sample_rate_hz: 20,
        });
    }

    EngineRunPlan {
        project_id: request.project_id,
        scenario: request
            .scenario
            .unwrap_or_else(|| "primary-validation".to_string()),
        fidelity_profile: fidelity,
        engine_sequence,
        telemetry_channels,
        warnings: collect_warnings(&request),
        graph_density: density,
        orchestration_tick_hz: if fidelity == "validation" { 240 } else { 120 },
    }
}

fn respond_json<T: Serialize>(status: &str, value: &T) -> Vec<u8> {
    let body = serde_json::to_string_pretty(value).expect("serialize JSON");
    format!(
        "HTTP/1.1 {status}\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Headers: Content-Type\r\nAccess-Control-Allow-Methods: GET,POST,OPTIONS\r\nContent-Length: {}\r\n\r\n{}",
        body.len(),
        body
    )
    .into_bytes()
}

fn respond_text(status: &str, body: &str) -> Vec<u8> {
    format!(
        "HTTP/1.1 {status}\r\nContent-Type: text/plain\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Headers: Content-Type\r\nAccess-Control-Allow-Methods: GET,POST,OPTIONS\r\nContent-Length: {}\r\n\r\n{}",
        body.len(),
        body
    )
    .into_bytes()
}

fn parse_request(stream: &mut TcpStream) -> Option<(String, String, String)> {
    let mut buffer = vec![0_u8; 64 * 1024];
    let size = stream.read(&mut buffer).ok()?;
    if size == 0 {
        return None;
    }

    let raw = String::from_utf8_lossy(&buffer[..size]).to_string();
    let (headers, body) = raw
        .split_once("\r\n\r\n")
        .map(|(head, body)| (head.to_string(), body.to_string()))
        .unwrap_or((raw, String::new()));

    let mut lines = headers.lines();
    let request_line = lines.next()?;
    let mut parts = request_line.split_whitespace();
    let method = parts.next()?.to_string();
    let path = parts.next()?.to_string();
    Some((method, path, body))
}

fn handle_client(mut stream: TcpStream) {
    let response = match parse_request(&mut stream) {
        Some((method, path, _)) if method == "OPTIONS" => respond_text("200 OK", ""),
        Some((method, path, _)) if method == "GET" && path == "/health" => respond_json(
            "200 OK",
            &HealthReply {
                status: "ok",
                service: "simforge-core-rs",
            },
        ),
        Some((method, path, _)) if method == "GET" && path == "/engines" => {
            respond_json("200 OK", &engine_catalog())
        }
        Some((method, path, body)) if method == "POST" && path == "/plan" => {
            match serde_json::from_str::<PlanRequest>(&body) {
                Ok(request) => respond_json("200 OK", &synthesize_run_plan(request)),
                Err(error) => respond_text("400 Bad Request", &format!("Invalid plan request: {error}")),
            }
        }
        Some(_) => respond_text("404 Not Found", "not found"),
        None => return,
    };

    let _ = stream.write_all(&response);
}

fn main() {
    let port = env::var("SIMFORGE_CORE_PORT").unwrap_or_else(|_| "4041".to_string());
    let listener = TcpListener::bind(format!("0.0.0.0:{port}")).expect("bind TCP listener");
    println!("SimForge core listening on http://0.0.0.0:{port}");

    for stream in listener.incoming().flatten() {
        handle_client(stream);
    }
}
