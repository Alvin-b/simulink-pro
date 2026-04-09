import asyncio
import json
from dataclasses import dataclass, asdict


@dataclass
class EngineeringRecommendation:
    domain: str
    suggestion: str
    confidence: float


async def recommend_loop() -> None:
    while True:
        recommendation = EngineeringRecommendation(
            domain="robotics",
            suggestion="Increase state-estimation fidelity before running autonomy regression.",
            confidence=0.91,
        )
        print(json.dumps(asdict(recommendation)))
        await asyncio.sleep(1.0)


if __name__ == "__main__":
    asyncio.run(recommend_loop())
