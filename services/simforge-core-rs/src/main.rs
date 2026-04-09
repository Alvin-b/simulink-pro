use serde::Serialize;

#[derive(Serialize)]
struct EngineDescriptor {
    id: &'static str,
    domain: &'static str,
    fidelity: &'static str,
    capabilities: &'static [&'static str],
}

fn main() {
    let engines = vec![
        EngineDescriptor {
            id: "robotics-dynamics",
            domain: "robotics",
            fidelity: "hybrid",
            capabilities: &["kinematics", "contact", "navigation hooks", "replay"],
        },
        EngineDescriptor {
            id: "firmware-runtime",
            domain: "embedded",
            fidelity: "interactive",
            capabilities: &["gpio", "pwm", "uart", "trace export"],
        },
        EngineDescriptor {
            id: "iot-messaging",
            domain: "iot",
            fidelity: "interactive",
            capabilities: &["mqtt", "device twins", "telemetry rules", "cloud sync"],
        },
    ];

    let payload = serde_json::to_string_pretty(&engines).expect("serialize engine descriptors");
    println!("{payload}");
}
