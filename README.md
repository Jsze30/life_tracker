# Life Tracker

A robust, fully client-side React application designed to manage and track everyday routines, schoolwork, and social media content creation. The app offers a unified daily dashboard that perfectly balances productivity and habit-building.

## Features

- **Unified Daily Dashboard**: Merges tasks, habits, assignments, and content into one sorted list (incomplete first).
- **Schoolwork Management**: Keep track of courses and organize assignments manually.
- **Habit Tracking**: Create recurring habits and monitor them with a monthly calendar heatmap.
- **Content Creation Tracking**: Manage your social media pipeline (X, Instagram) with built-in streak tracking.
- **Insights & Streaks**: View analytics, completion trends, and earn "flame tier" badges for your streaks.
- **Instant UI Feedback**: Local state overrides for instant UI updates coupled with rewarding confetti animations on completion!

## Technical Architecture

This project is built using modern frontend tools with a focus on simplicity and a backend-free architecture:

- **Framework**: React via Vite
- **State Management**: Zustand
- **Task Parsing**: Natural language parsing provided by `chrono-node`.
- **Routing**: Client-side routing with specialized pages for each core function (`/`, `/schoolwork`, `/habits`, `/content`, `/insights`).

### State Structure

The single Zustand store tracks:

- `courses` & `assignments`: For schoolwork tracking.
- `habits` & `tasks`: For recurring and ad-hoc daily items.
- `completions`: An index representing string dates of completion per task/habit identifier.
- `contentItems`: Social media content tracking.

## Getting Started

### Prerequisites

You will need [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Jsze30/life_tracker.git
   ```
2. Navigate to the project directory:
   ```bash
   cd life_tracker
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Setting up Supabase

This project uses Supabase. To configure it, you will need to set up your environment variables:

1. Create a `.env` or `.env.local` file in the root of the project.
2. Add your Supabase URL and Anon Key:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Scripts

- `npm run dev` — Start the development server at `http://localhost:5173`
- `npm run build` — Create a production build to `/dist`
- `npm run lint` — Run ESLint validation
- `npm run preview` — Serve the production build locally

## Contributing

This is designed primarily as a personal life tracker, but feel free to fork the repository and tweak the features, designs, and structure to meet your organizational needs!
