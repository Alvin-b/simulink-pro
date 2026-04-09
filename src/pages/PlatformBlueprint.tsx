import { ArrowRight, Bot, CircuitBoard, Cpu, Orbit, RadioTower, Rocket, Users } from "lucide-react";
import { Link } from "react-router-dom";
import {
  executionTracks,
  platformDomains,
  platformLayers,
  platformPrinciples,
  roadmapPhases,
  techStack,
} from "@/data/platformBlueprint";

const iconMap = {
  Robotics: Bot,
  IoT: RadioTower,
  "Aerospace & Drones": Rocket,
  "Electronics & Embedded": CircuitBoard,
  "Power & Energy": Orbit,
  "AI-Native Systems": Cpu,
} as const;

const PlatformBlueprint = () => {
  return (
    <main className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.2),_transparent_25%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.2),_transparent_22%),linear-gradient(180deg,_#051018_0%,_#07131d_40%,_#081018_100%)] text-slate-100">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 py-8 lg:px-10 lg:py-10">
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/55 shadow-[0_0_120px_rgba(8,145,178,0.12)] backdrop-blur">
          <div className="grid gap-10 border-b border-white/10 px-6 py-6 lg:grid-cols-[1.4fr_0.8fr] lg:px-10 lg:py-10">
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-emerald-200">
                Universal Engineering Simulation Platform
              </div>
              <div className="space-y-4">
                <h1 className="max-w-4xl font-mono text-4xl font-semibold leading-tight text-white md:text-6xl">
                  One platform for digital twins, embedded systems, autonomy, energy, and aerospace simulation.
                </h1>
                <p className="max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
                  This project should not be treated as a single robotics demo. It needs to become a multi-engine platform
                  that lets teams model systems, run coupled simulations, program devices, collaborate in real time, and
                  deploy validated designs into the physical world.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/studio"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                >
                  Open Current Studio
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#roadmap"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  View Delivery Roadmap
                </a>
              </div>
            </div>

            <div className="grid gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/70">Core Requirement</p>
                  <p className="mt-1 text-xl font-semibold text-white">Coupled Multi-Physics</p>
                </div>
                <Orbit className="h-10 w-10 text-cyan-200" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Execution Modes</p>
                  <p className="mt-2 text-3xl font-semibold text-white">3</p>
                  <p className="mt-1 text-sm text-slate-300">Interactive, collaborative, and enterprise compute tracks.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Primary Domains</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{platformDomains.length}</p>
                  <p className="mt-1 text-sm text-slate-300">Robotics, IoT, aerospace, embedded, energy, and AI-native systems.</p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                  <Users className="h-4 w-4 text-emerald-300" />
                  Collaboration is a first-class primitive
                </div>
                <p className="text-sm leading-6 text-slate-300">
                  Shared project graphs, deterministic replay, review snapshots, and role-based sessions need to exist at
                  the platform level rather than being bolted onto a local simulator later.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-6 py-6 md:grid-cols-2 xl:grid-cols-3 lg:px-10 lg:py-8">
            {platformDomains.map((domain) => {
              const Icon = iconMap[domain.name as keyof typeof iconMap];
              return (
                <article key={domain.name} className="rounded-[26px] border border-white/10 bg-white/5 p-5 transition hover:border-emerald-300/30 hover:bg-white/10">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3">
                      <Icon className="h-5 w-5 text-emerald-200" />
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Domain</span>
                  </div>
                  <h2 className="text-xl font-semibold text-white">{domain.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{domain.focus}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {domain.workloads.map((item) => (
                      <span key={item} className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs text-slate-200">
                        {item}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-white/10 bg-slate-950/55 p-6 backdrop-blur">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Platform Architecture</p>
              <h2 className="mt-2 font-mono text-3xl font-semibold text-white">Layered runtime instead of a monolith</h2>
            </div>
            <div className="space-y-4">
              {platformLayers.map((layer, index) => (
                <article key={layer.title} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Layer {index + 1}</p>
                      <h3 className="text-xl font-semibold text-white">{layer.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-slate-300">{layer.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {layer.capabilities.map((capability) => (
                      <span key={capability} className="rounded-full border border-cyan-300/15 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
                        {capability}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-[28px] border border-white/10 bg-slate-950/55 p-6 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Execution Models</p>
              <h2 className="mt-2 font-mono text-3xl font-semibold text-white">Three ways to run the platform</h2>
              <div className="mt-6 space-y-4">
                {executionTracks.map((track) => (
                  <article key={track.name} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                    <h3 className="text-lg font-semibold text-white">{track.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{track.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {track.stack.map((item) => (
                        <span key={item} className="rounded-full border border-white/10 bg-slate-950/80 px-3 py-1 text-xs text-slate-200">
                          {item}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-slate-950/55 p-6 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Operating Principles</p>
              <div className="mt-4 space-y-3">
                {platformPrinciples.map((principle) => (
                  <div key={principle} className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-50">
                    {principle}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-slate-950/55 p-6 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Reference Stack</p>
          <h2 className="mt-2 font-mono text-3xl font-semibold text-white">Suggested technology baseline</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {techStack.map((item) => (
              <article key={item.area} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.area}</p>
                <p className="mt-3 text-sm leading-6 text-slate-200">{item.choice}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="roadmap" className="rounded-[28px] border border-white/10 bg-slate-950/55 p-6 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Delivery Plan</p>
          <h2 className="mt-2 font-mono text-3xl font-semibold text-white">Phased build strategy</h2>
          <div className="mt-6 grid gap-4 xl:grid-cols-4">
            {roadmapPhases.map((phase) => (
              <article key={phase.phase} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{phase.phase}</p>
                    <h3 className="mt-1 text-xl font-semibold text-white">{phase.timeline}</h3>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-200">{phase.outcome}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {phase.deliverables.map((deliverable) => (
                    <span key={deliverable} className="rounded-full border border-white/10 bg-slate-950/80 px-3 py-1 text-xs text-slate-200">
                      {deliverable}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
};

export default PlatformBlueprint;
