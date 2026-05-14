# APEX — Autonomous Policy Edge-Case and Recovery

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen?style=flat-square)](https://vgandhi1.github.io/apex-recovery)
[![PRD](https://img.shields.io/badge/docs-PRD-blue?style=flat-square)](EdgeCase_Recovery_PRD.md)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

> A PM-authored product specification and working React/TypeScript prototype for the human-in-the-loop recovery workflow triggered when a robot's autonomous policy fails on the factory floor.

**Live demo:** https://vgandhi1.github.io/apex-recovery  
**Full PRD:** [EdgeCase_Recovery_PRD.md](EdgeCase_Recovery_PRD.md)

---

## What This Project Proves

This is not a toy UI exercise. It is a response to a specific, high-stakes problem in production robotics data collection programs — and it is built to the standard of rigor expected when engineering teams depend on your spec to ship real software.

| Capability demonstrated | Evidence |
|---|---|
| Translating a vague research problem into a buildable spec | The PRD turns "we lose recovery data when robots fail" into a 7-state machine, a typed episode schema, and a UI grounded in measured hardware constraints |
| Hardware-informed product decisions | Every UI element in the cockpit traces to a physical constraint (camera lag, haptic round-trip, force sensor rate) — documented in the Hardware Constraints Decision Log |
| Domain knowledge depth | The DEFERRED_QUEUE state is a non-obvious design choice: most systems E-stop on failure; this one deliberately holds the scene to preserve the pre-failure training signal |
| Structured data thinking | The failure taxonomy is defined before the UI, because the UI exists solely to generate labeled data for the ML team |
| Full-stack prototype execution | The spec ships as a working, deployed React app with simulated telemetry, all 6 cockpit panels, and a JSON export matching the episode metadata schema |

---

## The Problem

Robotics programs collecting teleoperation training data at scale are systematically discarding their most valuable data — recovery demonstrations, where a human corrects a failing autonomous policy.

**Current workflow when a robot fails:**
1. Floor supervisor notices the robot is stuck (30–120 seconds later)
2. Operator physically walks to the station and hits E-stop
3. Robot is manually repositioned; episode is marked FAILED and discarded
4. The recovery action — the most instructive signal for the AI — is never captured

**Data loss at scale:** In a typical 8-hour shift at 15% failure rate, approximately 6 hours of recovery demonstrations per 5-robot cell are discarded per shift. Programs that close this gap compound model performance faster than programs that train only on successful episodes.

---

## The Solution

APEX is an end-to-end software system from confidence-drop event to training-queue submission:

```
Robot confidence drops below θ = 0.65 for > 500ms
        │
        ▼
RECOVERY_ALERT → operator routing (latency check, skill match)
        │
        ├─[latency OK]──→ TELEOPERATION → TAGGING → TRAINING_QUEUE
        │
        └─[latency high]─→ DEFERRED_QUEUE (scene preserved, SLA timer)
                                  │
                                  └─[operator available]──→ TELEOPERATION
```

The key design insight is the `DEFERRED_QUEUE` state: rather than E-stopping when no operator is immediately available, the robot holds a safe configuration while the failure moment and pre-failure trajectory remain buffered. When an operator becomes available, they see the failure in context, not just the aftermath.

---

## Demo Walkthrough (3–4 minutes)

Open the [live demo](https://vgandhi1.github.io/apex-recovery) and follow these steps:

| Step | Action | What to observe |
|---|---|---|
| 1 | App loads | **AUTONOMOUS** state; confidence bouncing ~0.80; all telemetry panels live |
| 2 | Click **SIMULATE FAILURE** | Confidence begins declining; state transitions to **ALERT_PENDING** |
| 3 | Click **ACCEPT HANDOFF** | State enters **TELEOPERATION**; all 6 cockpit panels activate |
| 4 | Click **SIMULATE HIGH LATENCY** | Latency badge turns red (>150ms); handoff button disables; explains **DEFERRED_QUEUE** path |
| 5 | Wait for latency to restore (10s) | Badge returns green; handoff re-enables |
| 6 | Wait 5s, then click **TASK RESOLVED** | Tagging modal opens; failure type pre-filled by classifier suggestion |
| 7 | Submit tags | Episode JSON file downloads; state transitions through **TRAINING_QUEUE** → **AUTONOMOUS** |
| 8 | Open downloaded JSON | Walk through the episode metadata schema: failure type, confidence trend, quality score, artifact URIs |

---

## Architecture

### State Machine

Seven states with explicit transition rules. The full transition map is in the [PRD](EdgeCase_Recovery_PRD.md#5-state-machine-definition).

```
AUTONOMOUS ──[confidence < 0.65 × 500ms]──→ ALERT_PENDING
                                                   │
                              ┌────────────────────┼────────────────────┐
                              ▼                    ▼                    ▼
                        TELEOPERATION       DEFERRED_QUEUE          SAFE_STOP
                              │                    │
                              ▼                    ▼ (operator available)
                           TAGGING           TELEOPERATION
                              │
                              ▼
                       TRAINING_QUEUE ──→ AUTONOMOUS
```

### Component Tree

```
App.tsx                         — simulation loop (10Hz setInterval), state wiring
├── StateBanner                 — current state, episode ID, elapsed timer, latency badge
├── CameraFeed                  — Canvas; current bounding box + predictive overlay
├── ConfidenceChart             — Recharts LineChart; 30s rolling window, threshold line
├── ForceChart                  — Recharts AreaChart; 500ms rolling average
├── MiniMap                     — SVG overhead workspace; end-effector position at 10Hz
├── ControlBar                  — all operator actions; state-conditional rendering
├── PreFailureContext            — failure narrative: time since alert, confidence trend, classifier suggestion
└── TaggingModal                — post-resolution form; outputs typed TagSubmission
```

### Data Flow

```
Simulation layer (10Hz)
  ConfidenceModel.next()  ──→  updateConfidenceTelemetry()  ──→  Zustand store
  LatencySimulator.next() ──→  updateLatency()              ──→  Zustand store
  RobotSimulator.getBoundingBox() ──→ updateBoundingBox()   ──→  Zustand store

Operator action
  triggerAlert()    ──→ recoveryState: 'ALERT_PENDING'
  acceptHandoff()   ──→ latency check → 'TELEOPERATION' or 'DEFERRED_QUEUE'
  resolveTask()     ──→ recoveryState: 'TAGGING'
  submitTags(tags)  ──→ buildEpisodePayload() → downloadEpisodeJSON() → 'TRAINING_QUEUE'
```

### Key Technical Decisions

Each decision traces to a hardware constraint. Full log in [PRD Section 6](EdgeCase_Recovery_PRD.md#6-hardware-constraints--ui-decision-log).

| Hardware constraint | Measured value | Product decision |
|---|---|---|
| Camera streaming delay | 180–220ms (720p H.264 over LAN) | Predictive bounding box extrapolated 200ms ahead using last 10 velocity samples |
| Haptic round-trip latency | 60–90ms LAN / 120–200ms WAN | Block handoff if latency > 150ms; color-coded badge (green/yellow/red) |
| Force sensor sample rate | 1kHz raw, 50ms telemetry batch | Display 500ms rolling average, not raw; Recharts AreaChart, 10-point window |
| NATS JetStream delivery | < 5ms p99 on LAN | All UI state is WebSocket-push; zero polling |
| Robot safe-stop reaction time | 150–300ms from software command | E-stop button requires 1.5s hold-to-confirm; prevents accidental activation |
| Episode buffer storage | 512MB per edge node | Buffer last 60 seconds of pre-failure trajectory; display buffer indicator |

### Episode Output Schema

On tag submission the app produces a JSON file matching the training pipeline contract. Example:

```json
{
  "schema_version": "1.0",
  "episode": {
    "episode_id": "REC_00247",
    "robot_id": "ROBOT_03",
    "task_type": "assembly"
  },
  "failure": {
    "failure_type": "GRASP_FAIL",
    "failure_type_source": "classifier_confirmed",
    "classifier_confidence": 0.72,
    "confidence_trend_5s": [0.82, 0.74, 0.66, 0.61, 0.58],
    "secondary_tags": ["regrasp_required"]
  },
  "recovery": {
    "operator_id": "OP_007",
    "operator_latency_ms": 82,
    "recovery_duration_seconds": 33.2,
    "recovery_quality_self_assessed": 4
  },
  "data_quality": {
    "data_quality_score": 87,
    "training_priority": "high",
    "usable_for_training": true
  }
}
```

Full schema with all fields: [`src/types/Episode.ts`](src/types/Episode.ts)

---

## Project Execution Plan

This section documents how the project was planned and built — the decisions made at each stage and why.

### Phase 1 — Problem Framing

**Goal:** Convert the abstract problem ("we lose recovery data") into a quantified business case and a bounded software scope.

**Decisions made:**
- Quantified data loss as hours-per-shift-per-robot, not as a percentage — this makes the problem legible to operations and finance, not just ML
- Defined three distinct user personas (Operator, Ops Lead, ML Researcher) to ensure the product serves all three without optimizing for one at the expense of others
- Explicitly scoped out the robot policy, haptic hardware, and training pipeline internals — the product owns the handoff layer only

### Phase 2 — Failure Taxonomy

**Goal:** Define the semantic foundation before any UI work begins.

**Why this comes first:** The UI exists to generate labeled data. If the taxonomy is defined after the UI, the labels will reflect what was easy to build, not what the ML team actually needs. Defining it first forces the right constraint.

**Decisions made:**
- 8 primary failure codes mapped to confidence patterns, recovery complexity, and training data value — this lets the routing algorithm prioritize high-value failures for the best operators
- 6 secondary tags designed to be applied as chips (no typing required) — tagging speed is a key metric; friction reduces quality over time
- `UNKNOWN` is a first-class category, not an error state — novel failure modes are the highest-value training signal

### Phase 3 — State Machine Design

**Goal:** Define every system state and every valid transition before writing a line of UI code.

**The non-obvious decision — DEFERRED_QUEUE:**

Most operator handoff systems treat "no available operator" as an error condition and trigger an E-stop. This is the wrong behavior for a data collection program because:
1. E-stop discards the partially-captured episode including the failure moment
2. It creates a feedback loop where the most common hard failures are the least likely to be captured
3. It burns operator time on physical reset rather than teleoperation

`DEFERRED_QUEUE` solves this by holding the robot in a safe configuration with the scene preserved. The NATS JetStream buffer keeps the last 60 seconds of pre-failure trajectory. When an operator becomes available, they see the failure in context.

**SLA boundary:** If no operator becomes available within 5 minutes, escalate to `SAFE_STOP` to avoid indefinite floor blockage.

### Phase 4 — Hardware Constraints Audit

**Goal:** Before writing a single UI component, enumerate every physical constraint that will affect the operator's experience.

**Why this section exists in the PRD:**

These decisions are not obvious to a designer or junior PM. They require knowing:
- What H.264 streaming latency looks like end-to-end (not just codec delay)
- Why a 1kHz sensor should not be displayed at 1kHz in a browser
- That "E-stop in software" and "E-stop on the robot" are different events with different latencies

By making these explicit before design work begins, engineering does not need PM re-involvement when they encounter the hardware reality. The tradeoffs are already documented.

### Phase 5 — UI Specification

**Goal:** Write a cockpit spec that engineering can implement without a design review.

**Layout principles:**
- Single-page; no navigation — operator cannot afford to lose context during a recovery
- All critical information visible simultaneously — confidence, force, camera, minimap, failure context
- Control bar state-conditional — only the actions valid for the current state are shown; no disabled buttons to second-guess
- Tagging modal is full-screen overlay — forces focus; prevents premature submission

**E-stop hold-to-confirm rationale:** In high-stress recovery situations, operators click E-stop impulsively when they momentarily lose orientation. A 1.5-second hold creates a mandatory pause that reduces accidental stops without meaningfully delaying a genuine emergency stop.

### Phase 6 — Prototype Implementation

**Goal:** Build a working demo that runs the full state machine, simulates all telemetry, and produces a valid episode JSON.

**Stack selection rationale:**

| Choice | Alternative considered | Reason chosen |
|---|---|---|
| Zustand | Redux | Simpler state transitions for a small app; less boilerplate for a demo that needs to move fast |
| Recharts | D3 | Declarative React integration; sufficient for two small charts without custom SVG work |
| Canvas API (direct) | React-Konva | Predictive bounding box requires frame-by-frame imperative drawing; a wrapper adds indirection without benefit |
| Vite | Create React App | CRA is deprecated; Vite is the current standard for React projects |
| Tailwind CSS | CSS modules | Rapid prototyping; utility classes keep styling decisions visible inline |

**Simulation design:** The simulation layer (ConfidenceModel, LatencySimulator, RobotSimulator) is separated from the store and components. This means it can be replaced by a real WebSocket connection to NATS without touching any component code — the store's `update*` actions are the interface boundary.

### Phase 7 — Schema and Export

**Goal:** Produce an episode JSON that the ML team can actually use without writing parsing logic.

**Schema design decisions:**
- `failure_type_source` distinguishes `operator` (human-tagged) from `classifier_confirmed` (pre-fill accepted without override) — lets researchers filter to ground-truth-only labels for evaluation sets
- `confidence_trend_5s` captures the 5-second trajectory leading to the alert — this is what closes the self-improvement loop by letting the classifier be retrained on new policy versions
- `data_quality_score` is a 0–100 composite of operator latency, recovery quality self-assessment, and tagging completeness — Ops Lead can filter training data by quality without custom logic
- `training_priority` is derived automatically — `OBJ_NOVEL` failures with low latency are always `very_high`; the field pre-seeds the training curriculum scheduler

---

## Repository Structure

```
apex-recovery/
├── EdgeCase_Recovery_PRD.md        — Full product requirements document
├── README.md                       — This file
├── package.json
├── vite.config.ts                  — Base path set to /apex-recovery/ for GitHub Pages
├── tailwind.config.ts
├── src/
│   ├── types/
│   │   ├── StateMachine.ts         — RecoveryState type, TagSubmission, BoundingBox
│   │   ├── Episode.ts              — EpisodeMetadata interface (full schema)
│   │   └── Telemetry.ts            — RobotState interface
│   ├── simulation/
│   │   ├── ConfidenceModel.ts      — Synthetic confidence trajectory generator
│   │   ├── LatencySimulator.ts     — Network latency with jitter simulation
│   │   └── RobotSimulator.ts       — Bounding box and velocity sample generator
│   ├── store/
│   │   └── cockpitStore.ts         — Zustand store; state machine + all telemetry
│   ├── components/
│   │   ├── StateBanner.tsx         — Header: state, episode ID, elapsed timer, latency
│   │   ├── CameraFeed.tsx          — Canvas: current box + predictive overlay + camera toggle
│   │   ├── ConfidenceChart.tsx     — Recharts LineChart; 30s window, threshold line, alert marker
│   │   ├── ForceChart.tsx          — Recharts AreaChart; 500ms rolling average
│   │   ├── MiniMap.tsx             — SVG workspace: end-effector, target, no-go zones
│   │   ├── ControlBar.tsx          — State-conditional operator controls; E-stop hold-to-confirm
│   │   ├── PreFailureContext.tsx   — Failure narrative panel
│   │   └── TaggingModal.tsx        — Post-resolution tagging form; outputs TagSubmission
│   ├── utils/
│   │   ├── dataQualityScore.ts     — DQS composite from latency, quality, tagging completeness
│   │   └── episodePackager.ts      — Assembles and downloads episode JSON
│   └── App.tsx                     — Root: 10Hz simulation loop, panel layout
└── .github/
    └── workflows/
        └── deploy.yml              — GitHub Actions: build + gh-pages on push to main
```

---

## Running Locally

```bash
git clone https://github.com/vgandhi1/apex-recovery.git
cd apex-recovery
npm install
npm run dev        # → http://localhost:5173/apex-recovery/
```

**Build and typecheck:**

```bash
npm run build      # tsc + vite build → dist/
```

**Deploy to GitHub Pages:**

```bash
npm run deploy     # builds and pushes dist/ to gh-pages branch
```

---

## Success Metrics (from PRD)

| Metric | Target |
|---|---|
| Recovery Episode Capture Rate | > 85% at 90 days (baseline: ~0%) |
| Operator Accept Rate | > 80% of ALERT_PENDING resolved without DEFERRED_QUEUE |
| Tagging Completion Rate | > 95% of TELEOPERATION sessions reach TRAINING_QUEUE |
| Tagging Time (median) | < 30 seconds from TASK_RESOLVED to submission |
| Deferred Queue Timeout Rate | < 5% of DEFERRED_QUEUE entries hit SLA timeout |
| Pre-fill Override Rate | < 30% (measures classifier accuracy) |

---

## Related Projects

Part of a broader factory AI portfolio:

- [TeleOp Flywheel Dashboard](https://github.com/vgandhi1/teleop-flywheel-dashboard) — operator quality economics and shift-level recovery KPIs
- [Edge Telemetry Plane (DETCP)](https://github.com/vgandhi1/edge-telemetry-plane) — fault-tolerant edge infrastructure for robot telemetry

---

## Author

**Vinay Gandhi** — Product Manager  
Built May 2026 · [Full PRD](EdgeCase_Recovery_PRD.md)
