# Repcode

Spaced repetition for LeetCode mastery. A web app that helps you practice technical interview problems using science-backed learning techniques: spaced repetition (SM-2), interleaved practice, and desirable difficulty.

## Features

- **SM-2 Spaced Repetition** — Adaptive review intervals based on self-rated recall quality. Problems you struggle with come back sooner; problems you nail get pushed out further.
- **Interleaved Sessions** — Problems are auto-selected and reordered to avoid consecutive same-pattern problems, forcing pattern recognition instead of rote memorization.
- **56 Curated Problems** — Classic interview problems from the Blind 75 / NeetCode 150, tagged by technique pattern (two pointers, sliding window, DP, etc.) with 4-level hint ladders.
- **Mock Interview Mode** — 2 problems, 25 minutes each, no pattern tags or hints shown. Simulates real interview pressure.
- **Progress Tracking** — Mastery breakdown, 30-day activity heatmap, pattern-by-pattern quality scores, streak tracking.
- **Session History** — Full log of past sessions with per-problem results.
- **Related Problem Chains** — Each problem links to harder/easier variants using the same core pattern.
- **Data Export/Import** — Backup and restore your progress as JSON.

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- localStorage for persistence
