# Habit Tracker — Implementation Plan

## Context
Building a personal productivity web app to track schoolwork deadlines, daily habits, and social media content posting (X + Instagram). The core motivational mechanic is a visual streak system with flame icons, calendar heatmaps, and personal best records. The app runs entirely in the browser with local storage — no backend needed.

**Key constraint:** Canvas and PrairieLearn APIs are blocked by CORS from browser apps, so schoolwork entry will be manual. ICS calendar import is a stretch goal.

---

## Tech Stack
- **Vite + React 18 + JavaScript (JSX)**
- **Zustand** — state management with `persist` middleware for automatic localStorage sync
- **Tailwind CSS v4** — utility-first styling
- **React Router v6** — 4 routes
- **Lucide React** — icons (flame, check, book, etc.)
- **date-fns** — date utilities
- **Google Fonts** — Space Grotesk, General Sans, JetBrains Mono

---

## Data Model (stored in localStorage)

```js
// Assignment shape
{
  id: "uuid",            // crypto.randomUUID()
  course: "CS 225",
  title: "MP3: Binary Trees",
  dueDate: "2026-04-05", // ISO date string
  type: "assignment",     // "assignment" | "test"
  completed: false
}

// Habit shape
{
  id: "uuid",
  name: "Exercise",
  createdAt: "2026-03-30", // ISO date
  archivedAt: null         // set to ISO date for soft delete
}

// Completions: { [habitOrContentId]: ["2026-03-28", "2026-03-29", ...] }
// Content platforms use fixed IDs: "content-x" and "content-instagram"
// Streaks are COMPUTED from completions at render time, never stored
```

---

## Design System — "Technical Minimalist"

### Philosophy
A sophisticated, structural aesthetic inspired by technical blueprints. Flat, 2D, high negative space, structural precision. No shadows, no gradients — only hairlines, flat color blocks, and typography hierarchy.

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| Paper | `#F7F7F5` | Page background, card fills |
| Forest | `#1A3C2B` | Primary brand, headers, active nav, solid buttons |
| Grid | `#3A3A38` | Hairline borders (at 20% opacity), secondary text |
| Coral | `#FF8C69` | Accent — overdue items, urgent deadlines |
| Mint | `#9EFFBF` | Accent — completed states, success, active streaks |
| Gold | `#F4D35E` | Accent — streak milestones, personal bests |
| White | `#FFFFFF` | Input field backgrounds |

### Typography

| Role | Font | Size | Style |
|---|---|---|---|
| Page headers | Space Grotesk | 48-64px | Bold, tracking-tight, line-height 0.9, Forest color |
| Section headers | Space Grotesk | 24-32px | Semibold, Forest |
| Body text | General Sans | 14-16px | Regular, Grid color |
| Labels, tags, metadata | JetBrains Mono | 10-12px | Regular, uppercase, tracking 0.1em |
| Streak numbers | JetBrains Mono | 14-18px | Bold |
| Nav links | JetBrains Mono | 10px | Uppercase, with numerical index prefix |

### Border & Spacing Rules
- All dividers: 1px hairline, `#3A3A38` at 20% opacity
- Card border-radius: 0px or 2px max — sharp, technical look
- No box shadows anywhere
- Card padding: 24-32px
- Section gaps: 1px hairline separator (not whitespace alone)
- Grid gaps in bento layouts: 1px solid `#3A3A38` at 20%

### Component Styling

**Cards** — Paper (#F7F7F5) background, 1px border (#3A3A38/20), 0-2px radius, 24-32px padding. Each card type has a colored left-border accent (4px solid) to indicate category:
- Schoolwork cards: Forest left border
- Habit cards: Mint left border
- Content cards: Coral left border
- Streak milestone cards: Gold left border

**Buttons**
- Primary: Solid Forest (#1A3C2B) fill, white text in JetBrains Mono 10px uppercase
- Ghost: 1px Forest border, Forest text, Paper background
- Destructive: 1px Coral border, Coral text

**Form Inputs** — White (#FFF) background, 1px border (#3A3A38/20), JetBrains Mono label above input (10px, uppercase, tracking-widest). Corner markers (L-shaped 8px brackets in Forest) on focused inputs.

**Status Badges** — Inline-flex, 1px border (#1A3C2B/20), 8x8px square dot + JetBrains Mono text 10px uppercase. Used for assignment type (ASSIGNMENT / TEST), streak status labels.

**Checkboxes** — Custom square checkboxes (no border-radius), 1px Forest border. Checked state: solid Forest fill with white checkmark. Snappy 150ms transition.

**Streak Badge** — Displays flame icon + streak count in JetBrains Mono. Color/size scales with streak tier (see Streak Visual System below). Personal best shows Gold accent.

**Calendar Heatmap** — CSS grid, 7 rows x 52 cols. Each cell is a small square (12x12px, 1px gap). Empty days: Paper fill with hairline border. Completed days: Mint (#9EFFBF) fill. Today: Forest border highlight. Monospaced month labels (JetBrains Mono 10px) along the top.

### Mosaic Background
Full-page SVG background pattern of interlocking rectangular panels. Panels vary in size (large squares, horizontal strips, vertical blocks) divided by 0.5px hairlines (#3A3A38 at 0.3 opacity). All panels filled with #F7F7F5. Repeats seamlessly. Subtle — barely visible but adds structural texture.

---

## UI Layout & User Flow

### Global Layout

```
┌─────────────────────────────────────────────────────────┐
│ HEADER (fixed top, 1px border-bottom)                   │
│ ┌──────┐                                    ┌─────────┐ │
│ │ LOGO │  01. TODAY  02. SCHOOL  03. HABITS  │ 04.POST │ │
│ │32x32 │  (nav links, JetBrains Mono 10px)   │         │ │
│ └──────┘                                    └─────────┘ │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │              PAGE CONTENT AREA                   │    │
│  │         (max-width: 960px, centered)             │    │
│  │         Paper background + mosaic SVG            │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘

Mobile: header collapses to bottom tab bar (4 icons)
```

**Header**: Fixed top bar. Left: 32x32px Forest square logo with white icon. Center: nav links in JetBrains Mono, 10px uppercase, prefixed with index numbers ("01. TODAY", "02. SCHOOL", etc.). Active link: Forest color, underline. Inactive: Grid color at 60%. 1px bottom border.

**Content area**: Max-width 960px, centered. Generous vertical padding (48px top). All pages share this container.

### Page 1: Today View (`/`) — The Dashboard

This is the home screen. The user opens the app and immediately sees everything relevant for today.

```
┌─────────────────────────────────────────┐
│  TODAY                    Mon, Mar 30   │  ← Space Grotesk 48px header
│  ─────────────────────────────────────  │  ← 1px hairline
│                                         │
│  ┌─ DEADLINES APPROACHING ────────────┐ │
│  │ ▎ CS 225 — MP3: Binary Trees       │ │  ← Forest left-border accent
│  │ ▎ Due tomorrow · ASSIGNMENT        │ │  ← Coral text if overdue
│  │ ▎                                  │ │
│  │ ▎ MATH 241 — Midterm 2            │ │
│  │ ▎ Due in 3 days · TEST            │ │  ← Status badge: "TEST"
│  └────────────────────────────────────┘ │
│                                         │
│  ┌─ DAILY HABITS ─────── 2/4 done ───┐ │
│  │ ☑ Exercise          🔥 7-day streak│ │  ← Checked = Mint accent
│  │ ☑ Read 30 min       🔥 3-day streak│ │
│  │ ☐ Meditate          — no streak    │ │  ← Unchecked = Grid color
│  │ ☐ Journal           — no streak    │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ┌─ CONTENT ─────────── 1/2 posted ──┐ │
│  │ ☑ X (Twitter)       🔥 12-day     │ │
│  │ ☐ Instagram         — no streak    │ │
│  └────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**User flow:**
1. User opens app → lands on Today view
2. Sees three bento-style sections stacked vertically, each in a 1px-bordered card
3. "Deadlines Approaching" shows assignments due within the next 3 days, sorted soonest first. Each row shows course, title, time remaining, and type badge. Overdue items get Coral text. Clicking a row navigates to `/schoolwork`
4. "Daily Habits" shows all active habits with today's checkbox. User taps checkbox to mark complete — checkbox fills Forest, streak badge updates instantly. Streak badge shows flame icon + count. Section header shows progress ("2/4 done")
5. "Content" shows X and Instagram rows with same checkbox + streak pattern
6. Sections link to their full pages via monospaced "VIEW ALL →" link at bottom of each card

### Page 2: Schoolwork (`/schoolwork`)

```
┌─────────────────────────────────────────┐
│  SCHOOLWORK                             │  ← Space Grotesk 48px
│  ─────────────────────────────────────  │
│                                         │
│  [ALL] [INCOMPLETE] [COMPLETED]         │  ← Filter tabs, JetBrains Mono
│                                         │
│  ┌────────────────────────────────────┐ │
│  │▎ CS 225                            │ │  ← Course in JetBrains Mono 10px
│  │▎ MP3: Binary Trees                 │ │  ← Title in General Sans 16px
│  │▎ Due: Apr 5, 2026  · ASSIGNMENT   │ │  ← Date + status badge
│  │▎                            [ ☐ ] │ │  ← Complete toggle
│  ├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ──┤ │  ← 1px separator
│  │▎ MATH 241                          │ │
│  │▎ Midterm 2                         │ │
│  │▎ Due: Apr 2, 2026  · TEST         │ │  ← Gold badge for tests
│  │▎                            [ ☐ ] │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │  + ADD ASSIGNMENT                  │ │  ← Ghost button, full-width
│  └────────────────────────────────────┘ │
│                                         │
│  ── ADD NEW ──────────────────────────  │  ← Expandable form section
│  ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐ │
│  ┊  COURSE   [____________]          ┊ │  ← Corner markers on focus
│  ┊  TITLE    [____________]          ┊ │
│  ┊  DUE DATE [____________]          ┊ │
│  ┊  TYPE     (●) Assignment (○) Test ┊ │
│  ┊                                   ┊ │
│  ┊  [ SAVE — Forest solid button ]   ┊ │
│  └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘ │
└─────────────────────────────────────────┘
```

**User flow:**
1. User navigates to Schoolwork via nav ("02. SCHOOL")
2. Sees all assignments sorted by due date (soonest first)
3. Filter tabs at top: ALL (default), INCOMPLETE, COMPLETED — styled as JetBrains Mono text tabs with Forest underline on active
4. Each assignment is a card row with Forest left-border, showing course (mono label), title (body text), due date, and type badge
5. Overdue assignments: due date text turns Coral, a small Coral dot appears
6. User clicks "+ ADD ASSIGNMENT" → form expands inline below the list
7. Form has corner-marker brackets on the focused input, monospaced labels above each field
8. User fills in course, title, due date (native date picker), selects type → clicks SAVE
9. New assignment appears in sorted position in the list
10. User clicks checkbox on a row → assignment marked complete, moves to COMPLETED filter, row gets muted styling (Grid color at 40%)

### Page 3: Habits (`/habits`)

```
┌─────────────────────────────────────────┐
│  HABITS                                 │  ← Space Grotesk 48px
│  ─────────────────────────────────────  │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │▎ Exercise                          │ │  ← Mint left-border
│  │▎ ☑ Today     🔥 7   Best: 14      │ │  ← Checkbox + streak + best
│  │▎                                   │ │
│  │▎ ┌╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶┐  │ │
│  │▎ ╎ CALENDAR HEATMAP (52 weeks) ╎  │ │  ← Mint-shaded cells
│  │▎ ╎ ■■□■■■■ ■■■■■□■ ■■■■■■■ ...╎  │ │  ← Each ■ = completed day
│  │▎ ╎ Jan  Feb  Mar  Apr  ...     ╎  │ │  ← JetBrains Mono labels
│  │▎ └╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶┘  │ │
│  ├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ──┤ │
│  │▎ Read 30 min                       │ │
│  │▎ ☑ Today     🔥 3   Best: 3       │ │  ← "PERSONAL BEST!" Gold tag
│  │▎ [heatmap collapsed — tap to show] │ │
│  ├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ──┤ │
│  │▎ Meditate                          │ │
│  │▎ ☐ Today     — 0   Best: 5        │ │  ← No streak, gray
│  └────────────────────────────────────┘ │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │  + ADD HABIT                       │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ── STREAK TIERS ─────────────────────  │  ← Visual legend
│  ○ 0 days                               │
│  🔥 1-2  Getting started (orange-300)    │
│  🔥 3-6  On fire (orange-500)            │
│  🔥 7-13 One week+ (orange-600)          │
│  🔥🔥 14-29 Unstoppable (red-500)        │
│  🔥🔥🔥 30+ Legendary (red-600 + pulse)  │
└─────────────────────────────────────────┘
```

**User flow:**
1. User navigates to Habits ("03. HABITS")
2. Sees all active habits as expandable cards with Mint left-border accent
3. Each card shows: habit name (General Sans), today's checkbox, current streak (flame icon + JetBrains Mono number), and best streak record
4. User taps today's checkbox → fills Forest, streak count increments, flame icon updates tier/color with a snappy 150ms transition
5. If current streak equals personal best: Gold "PERSONAL BEST!" status badge appears
6. User taps a habit card to expand → reveals the 52-week calendar heatmap inside the card. Heatmap cells: Paper (empty) vs Mint (completed). Today's cell has Forest border
7. "+ ADD HABIT" button opens inline form — just a name field with monospaced label + SAVE button
8. Long-press or swipe on a habit → archive option (soft delete, removes from active list)
9. Streak tier legend at the bottom for reference

### Page 4: Content (`/content`)

```
┌─────────────────────────────────────────┐
│  CONTENT                                │  ← Space Grotesk 48px
│  ─────────────────────────────────────  │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │▎ X (TWITTER)                       │ │  ← Coral left-border
│  │▎ ☑ Posted today  🔥 12  Best: 12  │ │  ← "PERSONAL BEST!" Gold tag
│  │▎                                   │ │
│  │▎ ┌╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶┐  │ │
│  │▎ ╎ CALENDAR HEATMAP             ╎  │ │
│  │▎ ╎ ■■□■■■■ ■■■■■□■ ■■■■■■■ ...╎  │ │
│  │▎ └╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶┘  │ │
│  ├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ──┤ │
│  │▎ INSTAGRAM                         │ │
│  │▎ ☐ Not posted   — 0   Best: 8     │ │
│  │▎ [heatmap collapsed]              │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ── POSTING STATS ────────────────────  │
│  THIS WEEK: X 5/7 · IG 3/7             │  ← JetBrains Mono
│  THIS MONTH: X 25/30 · IG 18/30        │
└─────────────────────────────────────────┘
```

**User flow:**
1. User navigates to Content ("04. POST")
2. Two fixed rows: X (Twitter) and Instagram — each with Coral left-border
3. Same interaction pattern as habits: tap checkbox to mark "posted today", streak updates
4. Heatmaps show posting consistency over time
5. Bottom section: weekly/monthly posting stats in JetBrains Mono — helps user see posting frequency at a glance
6. No add/remove — these two platforms are hardcoded

### Mobile Layout (< 768px)

```
┌────────────────────┐
│   PAGE CONTENT     │  ← Full-width, 16px padding
│   (scrollable)     │
│                    │
│                    │
│                    │
├────────────────────┤
│ 🏠  📚  🔁  📤   │  ← Fixed bottom tab bar
│ Today School Habit │  ← JetBrains Mono 8px labels
│                Post│
└────────────────────┘
```

- Header nav collapses into a fixed bottom tab bar with 4 icon tabs
- Page headers shrink to 32px
- Cards go full-width with 16px padding
- Heatmaps scroll horizontally if needed
- Forms go full-width

### Micro-interactions
- Checkbox toggle: 150ms linear fill animation
- Streak badge update: 200ms ease-out scale bounce when incrementing
- Card expand (heatmap reveal): 250ms ease-out height animation
- Page transitions: instant (no animation — keeps it snappy)
- Streak milestone reached: brief Gold flash on the badge (300ms)
- "PERSONAL BEST!" badge: subtle 2s pulse animation (opacity 0.8 → 1.0)

---

## Routes

| Route | Page | Purpose |
|---|---|---|
| `/` | TodayPage | Dashboard — everything due/relevant today |
| `/schoolwork` | SchoolworkPage | Assignment list, add/complete |
| `/habits` | HabitsPage | Daily habit check-offs, streaks, heatmaps |
| `/content` | ContentPage | X + Instagram posting tracker |

---

## Component Structure

```
src/
  main.jsx                  -- Entry point, router setup
  App.jsx                   -- Layout shell (nav + outlet)
  store.js                  -- Zustand store with persist middleware
  lib/
    streaks.js              -- calculateStreak() pure function
    dates.js                -- today(), formatDate(), isOverdue()
  pages/
    TodayPage.jsx           -- Dashboard / home
    SchoolworkPage.jsx      -- Assignment list + add form
    HabitsPage.jsx          -- Habit list + daily check-offs
    ContentPage.jsx         -- X + Instagram daily check-offs
  components/
    Layout.jsx              -- Nav bar + page container
    AssignmentCard.jsx      -- Single assignment row
    AssignmentForm.jsx      -- Add/edit assignment form
    HabitRow.jsx            -- Habit name + today checkbox + streak badge
    StreakBadge.jsx          -- Flame icon + number, scales with streak
    CalendarHeatmap.jsx     -- 52-week grid (GitHub-style)
    ContentRow.jsx          -- Platform name + checkbox + streak badge
    StatusBadge.jsx         -- Inline mono label (ASSIGNMENT, TEST, etc.)
    MosaicBackground.jsx    -- SVG mosaic background pattern
```

---

## Streak Visual System

| Streak | Icon | Color | Label |
|---|---|---|---|
| 0 | gray circle | Grid (#3A3A38) at 40% | — |
| 1-2 | small flame | Coral (#FF8C69) at 60% | Getting started |
| 3-6 | medium flame | Coral (#FF8C69) | On fire |
| 7-13 | large flame | Forest (#1A3C2B) | One week+ |
| 14-29 | double flame | Forest (#1A3C2B) + Mint glow | Unstoppable |
| 30+ | triple flame + pulse | Forest + Gold (#F4D35E) accent | Legendary |

Updated to use the design system palette instead of generic orange/red. Forest as the strong streak color (brand consistency), Gold for milestones.

Shows "PERSONAL BEST!" status badge (Gold accent) when current streak equals best streak (and > 0).

---

## Build Phases

### Phase 1: Scaffold + Data Layer
- Create Vite React project (`--template react`)
- Install deps: zustand, react-router-dom, tailwindcss, lucide-react, date-fns
- Add Google Fonts: Space Grotesk, General Sans, JetBrains Mono
- Set up Tailwind with custom theme (Paper, Forest, Grid, Coral, Mint, Gold colors + font families)
- Create Zustand store (`src/store.js`) with all CRUD actions + localStorage persist
- Create `src/lib/streaks.js` — pure function to calculate current + best streak from completion dates
- Create `src/lib/dates.js` — helper utilities
- Create MosaicBackground SVG component
- Set up React Router + Layout with technical navigation header

### Phase 2: Schoolwork Tracker
- `AssignmentForm` — inputs with monospaced labels, corner markers, course/title/date/type
- `AssignmentCard` — Forest left-border, course label, title, due date, type badge, complete toggle
- `StatusBadge` — reusable mono label component
- `SchoolworkPage` — sorted list, filter tabs, add form, overdue highlighting (Coral)

### Phase 3: Daily Habits + Streak Visuals
- `HabitRow` — Mint left-border, name, today checkbox, streak badge
- `StreakBadge` — flame icon with tier colors from design system palette + personal best Gold tag
- `CalendarHeatmap` — CSS grid, 52 weeks, Mint/Paper cells, JetBrains Mono month labels
- `HabitsPage` — habit list, add/archive, check-off, expandable heatmaps

### Phase 4: Content Tracker
- `ContentRow` — Coral left-border, platform name, checkbox, streak badge
- `ContentPage` — X + Instagram rows, heatmaps, weekly/monthly posting stats

### Phase 5: Today Dashboard
- Three bento-style cards stacked vertically:
  - "DEADLINES APPROACHING" — assignments due within 3 days
  - "DAILY HABITS" — all habits with today's checkbox + streaks + progress count
  - "CONTENT" — X and Instagram status
- Summary stats in JetBrains Mono
- "VIEW ALL →" links to each full page

### Phase 6: Polish
- Empty states ("NO ASSIGNMENTS YET" in JetBrains Mono with ghost add button)
- Confirm dialogs for destructive actions (1px bordered modal, corner markers)
- Mobile responsive: bottom tab bar, full-width cards, horizontal scroll heatmaps
- Favicon (Forest square with white icon)
- Page title updates per route

### Stretch: ICS Calendar Import
- File upload on SchoolworkPage
- Parse `.ics` with `ical.js` library
- Map calendar events to Assignment objects
- Deduplicate by title + date

---

## Verification
1. `npm run dev` — all 4 routes render with correct design system styling
2. Verify mosaic background renders, fonts load (Space Grotesk, JetBrains Mono, General Sans)
3. Add an assignment → reload page → data persists (localStorage)
4. Create a habit → check off today → streak shows "1" with small flame
5. Check off multiple consecutive days → verify streak count + flame tier progression
6. Verify CalendarHeatmap shows correct Mint cells for completed days
7. Today view shows assignments due soon + habit/content status in bento layout
8. Test mobile layout (Chrome DevTools responsive mode) — bottom tab bar, full-width cards
9. Verify all typography follows spec (Space Grotesk headers, JetBrains Mono labels, General Sans body)
10. Verify no shadows, all borders are 1px hairlines, all radius 0-2px
