import { useMemo } from 'react'
import { subDays, format, getMonth } from 'date-fns'
import { useStore } from '../store'
import { today } from '../lib/dates'
import { calculateStreak } from '../lib/streaks'

const WEEKS = 10
const DAYS = WEEKS * 7 // 70

function buildDays(todayStr) {
  const base = new Date(todayStr + 'T12:00:00')
  const days = []
  for (let i = DAYS - 1; i >= 0; i--) {
    days.push(format(subDays(base, i), 'yyyy-MM-dd'))
  }
  return days
}

// Group 70 days into 10 weeks of 7
function buildWeeks(days) {
  const weeks = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }
  return weeks
}

// Month label for each week: label when a new month starts in that week
function buildMonthLabels(weeks) {
  return weeks.map((week) => {
    const firstDay = new Date(week[0] + 'T12:00:00')
    const hasNewMonth = week.some(
      (d) => getMonth(new Date(d + 'T12:00:00')) !== getMonth(firstDay)
    )
    // Show label at the first day of the week that a new month starts
    const newMonthDay = week.find((d, i) => {
      if (i === 0) return true // always check first week
      return (
        getMonth(new Date(d + 'T12:00:00')) !==
        getMonth(new Date(week[i - 1] + 'T12:00:00'))
      )
    })
    const monthOfFirstDay = format(firstDay, 'MMM').toUpperCase()
    // Only show if it's the first week or the month changes this week
    return { label: monthOfFirstDay, showLabel: hasNewMonth || weeks.indexOf(week) === 0 }
  })
}

function Cell({ done, isToday, isGold }) {
  return (
    <div
      className={[
        'w-2 h-2 shrink-0',
        isGold
          ? 'bg-gold'
          : done
          ? 'bg-mint'
          : 'bg-grid/[0.08]',
        isToday ? 'outline outline-1 outline-forest outline-offset-[-1px]' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    />
  )
}

export default function HabitGrid() {
  const habits = useStore((s) => s.habits).filter((h) => !h.archivedAt)
  const completions = useStore((s) => s.completions)
  const todayStr = today()

  const days = useMemo(() => buildDays(todayStr), [todayStr])
  const weeks = useMemo(() => buildWeeks(days), [days])
  const monthLabels = useMemo(() => buildMonthLabels(weeks), [weeks])

  const allDoneDays = useMemo(() => {
    if (habits.length === 0) return new Set()
    return new Set(
      days.filter((day) =>
        habits.every((h) => (completions[h.id] || []).includes(day))
      )
    )
  }, [days, habits, completions])

  const perfectCount = allDoneDays.size

  if (habits.length === 0) return null

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-grid/40">
          10-Week History
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-grid/30">
          {perfectCount} perfect {perfectCount === 1 ? 'day' : 'days'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels row */}
          <div className="flex gap-1 mb-1 pl-[88px] pr-[52px]">
            {weeks.map((week, wi) => (
              <div
                key={wi}
                className="flex gap-0.5 w-[60px] shrink-0"
              >
                <span className="font-mono text-[8px] uppercase tracking-[0.06em] text-grid/25 w-full">
                  {monthLabels[wi].showLabel ? monthLabels[wi].label : ''}
                </span>
              </div>
            ))}
          </div>

          {/* Habit rows */}
          {habits.map((habit) => {
            const dates = completions[habit.id] || []
            const { current } = calculateStreak(dates, todayStr)
            const doneSet = new Set(dates)

            return (
              <div key={habit.id} className="flex items-center gap-1 mb-1">
                {/* Name */}
                <div className="w-[80px] shrink-0 pr-2">
                  <span className="font-body text-[11px] text-grid/60 truncate block leading-tight">
                    {habit.name}
                  </span>
                </div>

                {/* Week groups */}
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex gap-0.5 shrink-0">
                    {week.map((day) => (
                      <Cell
                        key={day}
                        done={doneSet.has(day)}
                        isToday={day === todayStr}
                        isGold={false}
                      />
                    ))}
                  </div>
                ))}

                {/* Streak */}
                <div className="w-[44px] shrink-0 pl-2 text-right">
                  {current > 0 ? (
                    <span className="font-mono text-[11px] text-gold leading-none">
                      🔥{current}
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] text-grid/20">—</span>
                  )}
                </div>
              </div>
            )
          })}

          {/* All-done summary row */}
          {habits.length > 1 && (
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-grid/10">
              <div className="w-[80px] shrink-0 pr-2">
                <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-grid/25 block leading-tight">
                  All done
                </span>
              </div>

              {weeks.map((week, wi) => (
                <div key={wi} className="flex gap-0.5 shrink-0">
                  {week.map((day) => (
                    <Cell
                      key={day}
                      done={allDoneDays.has(day)}
                      isToday={day === todayStr}
                      isGold={allDoneDays.has(day)}
                    />
                  ))}
                </div>
              ))}

              <div className="w-[44px] shrink-0 pl-2 text-right">
                <span className="font-mono text-[10px] text-grid/25">
                  {perfectCount > 0 ? `×${perfectCount}` : ''}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
