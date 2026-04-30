# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Production build to /dist
npm run lint      # ESLint validation
npm run preview   # Serve production build locally
```

No test suite is configured.

## Architecture

**Fully client-side React app** — no backend, no API calls. All state persists to `localStorage` via Zustand's persist middleware (key: `"habit-tracker-store"`).

### State (`src/store.js`)

Single Zustand store containing:
- `courses`, `assignments` — schoolwork tracking
- `habits`, `tasks` — recurring and ad-hoc daily items
- `completions: { [id]: string[] }` — ISO date arrays tracking when habits/content were completed
- `contentItems` — social media content items (X, Instagram)

### Routing (`src/App.jsx`)

| Route | Page | Purpose |
|-------|------|---------|
| `/` | TodayPage | Unified daily dashboard merging tasks, habits, assignments, and content |
| `/schoolwork` | SchoolworkPage | Course + assignment management |
| `/habits` | HabitsPage | Habit creation with monthly calendar heatmap |
| `/content` | ContentPage | Social media content tracking with streaks |
| `/insights` | InsightsPage | Streak analytics and completion trends |

### Key Utilities (`src/lib/`)

- `dates.js` — ISO date helpers: `today()`, `isOverdue()`, `isDueSoon()`, `daysUntil()`, `CONTENT_PLATFORMS`
- `streaks.js` — `calculateStreak(dates, today)` → `{current, best}`, `getStreakTier(n)` for flame tier badges
- `parseTask.js` — Natural language task parsing via chrono-node
- `quotes.js` — Motivational quotes array for TodayPage

### Design System

**Colors:** Paper `#F7F7F5` (bg), Forest `#1A3C2B` (primary), Grid `#3A3A38` (borders), Coral `#FF8C69` (urgent), Mint `#9EFFBF` (complete), Gold `#F4D35E` (streaks)

**Typography:** Space Grotesk (headers), General Sans (body), JetBrains Mono (labels/tags/streak numbers)

**Visual rules:** No shadows, no gradients, flat aesthetic. 1px hairline borders at 20% opacity. 4px colored left-border on cards. Sharp corners (≤2px radius).

### Notable Patterns

- **Streak tiers** in `streaks.js`: 0, 1-2, 3-6, 7-13, 14-29, 30+ days — used by `StreakBadge.jsx`
- **Confetti** (`canvas-confetti`) fires on task/habit completion in `UnifiedTaskRow.jsx`
- **Today view** merges 4 data types into one sorted list (incomplete first), with local state override for instant UI feedback before store updates
- Manual assignment entry only — Canvas/PrairieLearn APIs are blocked by CORS
