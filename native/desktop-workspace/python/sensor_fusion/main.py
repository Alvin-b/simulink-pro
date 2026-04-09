import json
import math
import time


def synthesize_sample(step: int) -> dict[str, float]:
    return {
        "time_s": step * 0.02,
        "accel_x": math.sin(step * 0.02),
        "accel_y": math.cos(step * 0.02),
        "gyro_z": 0.01 * step,
        "altitude_m": 12.0 + math.sin(step * 0.01),
    }


def main() -> None:
    step = 0
    while True:
        print(json.dumps(synthesize_sample(step)))
        step += 1
        time.sleep(0.02)


if __name__ == "__main__":
    main()
