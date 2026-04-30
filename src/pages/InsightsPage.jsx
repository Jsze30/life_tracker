import { useState, useEffect, useMemo, useRef } from 'react'
import { useStore } from '../store'
import { today } from '../lib/dates'
import { calculateStreak } from '../lib/streaks'
import { startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, format, getDay } from 'date-fns'
import { ChevronDown, ChevronUp } from 'lucide-react'

// ─── Animation hooks ───────────────────────────────────────────────────────────

function useCountUp(target, duration = 1300, delay = 0) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (target === 0) { setCount(0); return }
    let raf = null
    let startTime = null
    const run = () => {
      raf = requestAnimationFrame(function tick(ts) {
        if (!startTime) startTime = ts
        const t = Math.min((ts - startTime) / duration, 1)
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
        setCount(Math.round(eased * target))
        if (t < 1) raf = requestAnimationFrame(tick)
        else setCount(target)
      })
    }
    const timer = setTimeout(run, delay)
    return () => { clearTimeout(timer); if (raf) cancelAnimationFrame(raf) }
  }, [target, duration, delay])
  return count
}

function useMountDelay(delay = 100) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return ready
}

// ─── Primitives ────────────────────────────────────────────────────────────────

function AnimatedBar({ pct, color = 'bg-forest', delay = 0, height = 'h-2.5' }) {
  const go = useMountDelay(200 + delay)
  return (
    <div className={`${height} w-full bg-grid/10 rounded-full overflow-hidden`}>
      <div
        className={`h-full ${color} rounded-full`}
        style={{
          width: go ? `${Math.min(100, Math.max(0, pct || 0))}%` : '0%',
          transition: 'width 1.1s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
    </div>
  )
}

function FadeIn({ delay = 0, children, className = '' }) {
  const go = useMountDelay(delay)
  return (
    <div
      className={className}
      style={{
        opacity: go ? 1 : 0,
        transform: go ? 'translateY(0px)' : 'translateY(12px)',
        transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {children}
    </div>
  )
}

function SectionHeader({ index, title, accentClass }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`w-1 h-5 rounded-sm ${accentClass}`} />
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-grid/40">{index}.</span>
      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-grid font-bold">{title}</span>
      <div className="flex-1 h-px bg-grid/15" />
    </div>
  )
}

function StreakCard({ label, value, accentColor, delay = 0 }) {
  const count = useCountUp(value, 1300, delay)
  return (
    <div className="shadow-sm bg-white border border-grid/20 p-5 flex flex-col items-center text-center relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 ${accentColor}`} />
      <div className="font-display text-4xl md:text-5xl font-bold tracking-tight text-primary leading-none mb-2 mt-2">
        {count}
      </div>
      <div className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.1em] text-grid/50 leading-tight">
        {label}
      </div>
    </div>
  )
}

// ─── Monthly Vertical Bar Chart ────────────────────────────────────────────────

const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

function MonthlyBarChart({ dates, accentColor, timeRange, label = 'Entries', delay = 0 }) {
  const go = useMountDelay(delay + 200)
  const thisYear = new Date().getFullYear().toString()
  const [hoveredBar, setHoveredBar] = useState(null)
  const [cursor, setCursor] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)

  const monthlyCounts = useMemo(() => {
    const counts = Array(12).fill(0)
    dates.forEach(d => {
      if (timeRange === 'year' && !d.startsWith(thisYear)) return
      const month = parseInt(d.split('-')[1], 10) - 1
      if (month >= 0 && month < 12) counts[month]++
    })
    return counts
  }, [dates, timeRange, thisYear])

  const total = monthlyCounts.reduce((s, c) => s + c, 0)
  const maxCount = Math.max(...monthlyCounts, 1)
  const animatedTotal = useCountUp(total, 1000, delay)

  // Compute nice scale max (round up to nearest 5)
  const scaleMax = Math.ceil(maxCount / 5) * 5 || 5
  const scaleMid = Math.round(scaleMax / 2)

  return (
    <FadeIn delay={delay}>
      <div className="shadow-sm bg-white border border-grid/20 flex items-stretch overflow-hidden">
        {/* Left: big number — fixed width prevents layout shift on toggle */}
        <div className="flex flex-col justify-center px-6 py-5 border-r border-grid/10 w-[120px] shrink-0">
          <div className="font-display text-5xl font-bold tracking-tight text-grid leading-none">
            {animatedTotal}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-grid/50 mt-1">{label}</div>
          <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-grid/30 mt-0.5">
            {timeRange === 'year' ? 'This Year' : 'All Time'}
          </div>
        </div>

        {/* Right: bar chart */}
        <div
          ref={containerRef}
          className="flex-1 px-4 pt-4 pb-3 flex gap-2 relative"
          onMouseMove={e => {
            const rect = containerRef.current.getBoundingClientRect()
            setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top })
          }}
          onMouseLeave={() => setHoveredBar(null)}
        >
          {/* Cursor-following tooltip */}
          {hoveredBar !== null && monthlyCounts[hoveredBar] > 0 && (
            <div
              className="absolute z-10 font-mono text-[10px] text-grid bg-white border border-grid/20 px-1.5 py-0.5 pointer-events-none"
              style={{ left: cursor.x + 10, top: cursor.y - 20 }}
            >
              {monthlyCounts[hoveredBar]}
            </div>
          )}
          {/* Bars + labels */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-end gap-[3px] flex-1">
              {monthlyCounts.map((val, i) => {
                const pct = val / scaleMax
                const dimmed = hoveredBar !== null && hoveredBar !== i
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col justify-end h-full relative"
                    style={{ height: 56 }}
                    onMouseEnter={() => setHoveredBar(i)}
                  >
                    <div
                      className={`w-full rounded-sm ${accentColor}`}
                      style={{
                        height: go ? `${Math.max(pct * 100, val > 0 ? 4 : 0)}%` : '0%',
                        transition: `height 0.8s cubic-bezier(0.16,1,0.3,1) ${i * 40}ms, opacity 0.15s ease`,
                        opacity: dimmed ? 0.25 : hoveredBar === i ? 1 : 0.75,
                        minHeight: 0,
                      }}
                    />
                  </div>
                )
              })}
            </div>
            {/* Month labels */}
            <div className="flex gap-[3px] mt-1.5">
              {MONTH_LABELS.map((m, i) => (
                <div key={i} className="flex-1 text-center font-mono text-[8px] text-grid/35">{m}</div>
              ))}
            </div>
          </div>

          {/* Y-axis scale */}
          <div className="flex flex-col justify-between pb-5 pl-1" style={{ height: 56 + 16 }}>
            <span className="font-mono text-[8px] text-grid/30 leading-none">{scaleMax}</span>
            <span className="font-mono text-[8px] text-grid/30 leading-none">{scaleMid}</span>
            <span className="font-mono text-[8px] text-grid/30 leading-none">0</span>
          </div>
        </div>
      </div>
    </FadeIn>
  )
}

// ─── Toggle helpers ────────────────────────────────────────────────────────────

function ToggleGroup({ options, value, onChange }) {
  return (
    <div className="flex border border-grid/20 overflow-hidden w-fit">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors ${
            value === opt.value
              ? 'bg-forest text-white'
              : 'bg-white text-grid/50 hover:text-grid hover:bg-grid/5'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── Calendar Heatmap ──────────────────────────────────────────────────────────

function CalendarHeatmap({ datesSet, dotColor, label, delay = 0 }) {
  const [expanded, setExpanded] = useState(false)
  const todayDate = new Date()
  todayDate.setHours(12, 0, 0, 0)
  const monthStart = startOfMonth(todayDate)
  const monthEnd = endOfMonth(todayDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startDayOfWeek = getDay(monthStart)

  return (
    <FadeIn delay={delay}>
      <div className="shadow-sm bg-white border border-grid/20 p-4 transition-all">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full font-mono text-[10px] uppercase tracking-[0.1em] text-grid/60 hover:text-grid"
        >
          <span>{label} Calendar</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {expanded && (
          <div className="mt-4 animate-in fade-in duration-300">
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-[8px] font-mono text-grid/40 uppercase">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {daysInMonth.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const isCompleted = datesSet.has(dateStr)
                const isTodayStr = dateStr === format(new Date(), 'yyyy-MM-dd')
                return (
                  <div
                    key={dateStr}
                    title={dateStr}
                    className={`aspect-square relative flex items-center justify-center rounded-sm border ${isTodayStr ? 'border-grid/30 bg-grid/5' : 'border-grid/10 bg-surface/30'}`}
                  >
                    <span className={`absolute top-0.5 right-1 text-[8px] font-mono ${isCompleted ? 'text-primary font-bold' : 'text-grid/80'}`}>
                      {format(day, 'd')}
                    </span>
                    {isCompleted && (
                      <div className={`w-[60%] h-[60%] rounded-full opacity-80 ${dotColor}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </FadeIn>
  )
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

function getLongestWeeklyStreak(datesArray) {
  if (!datesArray || datesArray.length === 0) return 0
  const weeks = [...new Set(datesArray.map(d =>
    startOfWeek(new Date(d + 'T12:00:00'), { weekStartsOn: 1 }).getTime()
  ))].sort((a, b) => a - b)
  if (weeks.length === 0) return 0
  let maxStreak = 1, currentStreak = 1
  for (let i = 1; i < weeks.length; i++) {
    const diffWeeks = Math.round((weeks[i] - weeks[i - 1]) / (1000 * 60 * 60 * 24 * 7))
    if (diffWeeks === 1) { currentStreak++; maxStreak = Math.max(maxStreak, currentStreak) }
    else if (diffWeeks > 1) { currentStreak = 1 }
  }
  return maxStreak
}

// Unique days (for streaks)
function collectDates(completions, ids) {
  const set = new Set()
  ids.forEach(id => (completions[id] || []).forEach(d => set.add(d)))
  return Array.from(set).sort()
}

// All completions including duplicates (for counting posts/replies)
function collectAllDates(completions, ids) {
  const dates = []
  ids.forEach(id => (completions[id] || []).forEach(d => dates.push(d)))
  return dates.sort()
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const habits = useStore((s) => s.habits)
  const completions = useStore((s) => s.completions)
  const contentTasks = useStore((s) => s.contentTasks)

  const todayStr = useMemo(() => today(), [])

  // X toggles
  const [xStatType, setXStatType] = useState(() => contentTasks.find(t => t.platform === 'x')?.id ?? 'all')
  const [xTimeRange, setXTimeRange] = useState('year')

  // Instagram toggle
  const [igTimeRange, setIgTimeRange] = useState('year')

  // Habits toggles
  const [habitsTimeRange, setHabitsTimeRange] = useState('year')
  const [habitsChartTimeRange, setHabitsChartTimeRange] = useState('year')
  const thisYear = useMemo(() => new Date().getFullYear().toString(), [])

  // --- Derive checkbox IDs from contentTasks ---
  const xTasks = useMemo(() => contentTasks.filter(t => t.platform === 'x'), [contentTasks])
  const igTasks = useMemo(() => contentTasks.filter(t => t.platform === 'instagram'), [contentTasks])

  const xAllCheckboxIds = useMemo(() =>
    xTasks.flatMap(t => Array.from({ length: t.count }, (_, i) => `${t.id}-${i}`)),
    [xTasks]
  )
  const igCheckboxIds = useMemo(() =>
    igTasks.flatMap(t => Array.from({ length: t.count }, (_, i) => `${t.id}-${i}`)),
    [igTasks]
  )

  // Toggle options for X chart: one per task
  const xToggleOptions = useMemo(() =>
    xTasks.map(t => ({ label: t.name, value: t.id })),
    [xTasks]
  )

  // --- X data ---
  const xAllDates = useMemo(() => collectDates(completions, xAllCheckboxIds), [completions, xAllCheckboxIds])
  const xAllDatesSet = useMemo(() => new Set(xAllDates), [xAllDates])

  const xChartDates = useMemo(() => {
    if (xStatType === 'all') return collectAllDates(completions, xAllCheckboxIds)
    const task = xTasks.find(t => t.id === xStatType)
    if (!task) return []
    const ids = Array.from({ length: task.count }, (_, i) => `${task.id}-${i}`)
    return collectAllDates(completions, ids)
  }, [xStatType, completions, xAllCheckboxIds, xTasks])

  const xChartLabel = useMemo(() => {
    if (xStatType === 'all') return 'Total'
    return xTasks.find(t => t.id === xStatType)?.name || 'Activity'
  }, [xStatType, xTasks])

  const xStreaks = useMemo(() => {
    const daily = calculateStreak(xAllDates, todayStr)
    return { currentDaily: daily.current, longestDaily: daily.best, longestWeekly: getLongestWeeklyStreak(xAllDates) }
  }, [xAllDates, todayStr])

  // --- Instagram data ---
  const igDates = useMemo(() => collectAllDates(completions, igCheckboxIds), [completions, igCheckboxIds])
  const igUniqueDates = useMemo(() => collectDates(completions, igCheckboxIds), [completions, igCheckboxIds])
  const igDatesSet = useMemo(() => new Set(igUniqueDates), [igUniqueDates])

  const igStreaks = useMemo(() => {
    const daily = calculateStreak(igUniqueDates, todayStr)
    return { currentDaily: daily.current, longestDaily: daily.best, longestWeekly: getLongestWeeklyStreak(igUniqueDates) }
  }, [igUniqueDates, todayStr])

  // --- Habits data ---
  const activeHabits = useMemo(() => habits.filter(h => !h.archivedAt), [habits])

  const allHabitDatesSet = useMemo(() => {
    const counts = {}
    activeHabits.forEach(h => {
      (completions[h.id] || []).forEach(d => { counts[d] = (counts[d] || 0) + 1 })
    })
    const s = new Set()
    Object.keys(counts).forEach(d => { if (counts[d] >= 3) s.add(d) })
    return s
  }, [activeHabits, completions])

  const habitStreaks = useMemo(() => {
    const allHabitDates = Array.from(allHabitDatesSet).sort()
    const daily = calculateStreak(allHabitDates, todayStr)
    return { currentDaily: daily.current, longestDaily: daily.best, longestWeekly: getLongestWeeklyStreak(allHabitDates) }
  }, [allHabitDatesSet, todayStr])

  const habitYearlyStats = useMemo(() => {
    return activeHabits.map(h => {
      const allDates = completions[h.id] || []
      const value = habitsTimeRange === 'year'
        ? allDates.filter(d => d.startsWith(thisYear)).length
        : allDates.length
      return { label: h.name, id: h.id, dates: allDates, value }
    }).sort((a, b) => b.value - a.value)
  }, [activeHabits, completions, habitsTimeRange, thisYear])

  const maxHabitStat = Math.max(...habitYearlyStats.map(s => s.value), 1)

  return (
    <div className="pb-12 max-w-[800px]">
      <FadeIn delay={0}>
        <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight text-forest leading-[0.9] mb-1">
          INSIGHTS
        </h1>
        <div className="h-px bg-grid/20 mb-10" />
      </FadeIn>

      {/* ──────────────── X ──────────────── */}

      <FadeIn delay={100}>
        <SectionHeader index="01" title="X (TWITTER)" accentClass="bg-coral" />
      </FadeIn>

      <div className="mb-12">
        <FadeIn delay={200}>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.1em] text-grid/50 mb-4 ml-1">Streaks</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
            <StreakCard label="Current Daily" value={xStreaks.currentDaily} accentColor="bg-coral" delay={200} />
            <StreakCard label="Longest Daily" value={xStreaks.longestDaily} accentColor="bg-coral" delay={300} />
            <StreakCard label="Longest Weekly" value={xStreaks.longestWeekly} accentColor="bg-coral" delay={400} />
          </div>
        </FadeIn>

        <FadeIn delay={400}>
          <div className="flex items-center justify-between mb-4 ml-1">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.1em] text-grid/50">Activity</h3>
            <div className="flex gap-2 flex-wrap justify-end">
              {xToggleOptions.length > 1 && (
                <ToggleGroup
                  options={xToggleOptions}
                  value={xStatType}
                  onChange={setXStatType}
                />
              )}
              <ToggleGroup
                options={[{ label: 'This Year', value: 'year' }, { label: 'All Time', value: 'alltime' }]}
                value={xTimeRange}
                onChange={setXTimeRange}
              />
            </div>
          </div>
          <MonthlyBarChart
            dates={xChartDates}
            accentColor="bg-coral"
            timeRange={xTimeRange}
            label={xChartLabel}
            delay={450}
          />
        </FadeIn>

        <div className="mt-3">
          <CalendarHeatmap datesSet={xAllDatesSet} dotColor="bg-coral" label="X activity" delay={600} />
        </div>
      </div>

      {/* ──────────────── INSTAGRAM ──────────────── */}

      <FadeIn delay={300}>
        <SectionHeader index="02" title="INSTAGRAM" accentClass="bg-gold" />
      </FadeIn>

      <div className="mb-12">
        <FadeIn delay={400}>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.1em] text-grid/50 mb-4 ml-1">Streaks</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
            <StreakCard label="Current Daily" value={igStreaks.currentDaily} accentColor="bg-gold" delay={400} />
            <StreakCard label="Longest Daily" value={igStreaks.longestDaily} accentColor="bg-gold" delay={500} />
            <StreakCard label="Longest Weekly" value={igStreaks.longestWeekly} accentColor="bg-gold" delay={600} />
          </div>
        </FadeIn>

        <FadeIn delay={550}>
          <div className="flex items-center justify-between mb-4 ml-1">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.1em] text-grid/50">Activity</h3>
            <ToggleGroup
              options={[{ label: 'This Year', value: 'year' }, { label: 'All Time', value: 'alltime' }]}
              value={igTimeRange}
              onChange={setIgTimeRange}
            />
          </div>
          <MonthlyBarChart
            dates={igDates}
            accentColor="bg-gold"
            timeRange={igTimeRange}
            label="Posts"
            delay={600}
          />
        </FadeIn>

        <div className="mt-3">
          <CalendarHeatmap datesSet={igDatesSet} dotColor="bg-gold" label="Instagram activity" delay={700} />
        </div>
      </div>

      {/* ──────────────── HABITS ──────────────── */}

      <FadeIn delay={400}>
        <SectionHeader index="03" title="HABITS" accentClass="bg-mint" />
      </FadeIn>

      <div>
        <FadeIn delay={500}>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.1em] text-grid/50 mb-4 ml-1">Streaks</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
            <StreakCard label="Current Daily" value={habitStreaks.currentDaily} accentColor="bg-mint" delay={500} />
            <StreakCard label="Longest Daily" value={habitStreaks.longestDaily} accentColor="bg-mint" delay={600} />
            <StreakCard label="Longest Weekly" value={habitStreaks.longestWeekly} accentColor="bg-mint" delay={700} />
          </div>
        </FadeIn>

        <FadeIn delay={600}>
          <div className="flex items-center justify-between mb-4 ml-1">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.1em] text-grid/50">Full Days (All Habits Done)</h3>
            <ToggleGroup
              options={[{ label: 'This Year', value: 'year' }, { label: 'All Time', value: 'alltime' }]}
              value={habitsChartTimeRange}
              onChange={setHabitsChartTimeRange}
            />
          </div>
          <MonthlyBarChart
            dates={Array.from(allHabitDatesSet).sort()}
            accentColor="bg-mint"
            timeRange={habitsChartTimeRange}
            label="Completions"
            delay={650}
          />
        </FadeIn>

        <FadeIn delay={700}>
          <div className="flex items-center justify-between mb-4 ml-1 mt-6">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.1em] text-grid/50">Completions per Habit</h3>
            <ToggleGroup
              options={[{ label: 'This Year', value: 'year' }, { label: 'All Time', value: 'alltime' }]}
              value={habitsTimeRange}
              onChange={setHabitsTimeRange}
            />
          </div>
          <div className="shadow-sm bg-white border border-grid/20 p-5 pt-6">
            {habitYearlyStats.length > 0 ? (
              habitYearlyStats.map((stat, i) => {
                const pct = maxHabitStat > 0 ? (stat.value / maxHabitStat) * 100 : 0
                return (
                  <FadeIn key={stat.id} delay={800 + i * 100}>
                    <div className="mb-4">
                      <div className="flex justify-between items-end mb-1.5">
                        <span className="font-body text-sm text-grid font-medium">{stat.label}</span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-display text-xl font-bold text-grid">{stat.value}</span>
                          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-grid/40">times</span>
                        </div>
                      </div>
                      <AnimatedBar pct={pct} color="bg-mint" delay={900 + i * 100} height="h-2" />
                    </div>
                  </FadeIn>
                )
              })
            ) : (
              <div className="font-mono text-[10px] uppercase text-grid/40 text-center py-4">No habits added yet</div>
            )}
          </div>
        </FadeIn>

        <div className="mt-3">
          <CalendarHeatmap datesSet={allHabitDatesSet} dotColor="bg-mint" label="Habit completion" delay={900} />
        </div>
      </div>
    </div>
  )
}
