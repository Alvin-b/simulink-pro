use serde::Serialize;

#[derive(Serialize)]
struct TelemetryFrame<'a> {
    source: &'a str,
    topic: &'a str,
    severity: &'a str,
    value: f32,
}

fn main() {
    let frames = vec![
        TelemetryFrame {
            source: "ue5-runtime",
            topic: "scene.fps",
            severity: "info",
            value: 60.0,
        },
        TelemetryFrame {
            source: "device-runtime",
            topic: "power.bus_voltage",
            severity: "info",
            value: 24.1,
        },
    ];

    println!("{}", serde_json::to_string_pretty(&frames).expect("serialize telemetry"));
}
