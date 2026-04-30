import { useState } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, format, isSameMonth
} from 'date-fns'
import { useStore } from '../store'
import { today as getToday } from '../lib/dates'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function MonthCalendar() {
  const [viewDate, setViewDate] = useState(new Date())
  const habits = useStore((s) => s.habits)
  const completions = useStore((s) => s.completions)

  const todayStr = getToday()
  const activeHabits = habits.filter((h) => !h.archivedAt)

  // Count completions per date
  const completionCountByDate = {}
  activeHabits.forEach((h) => {
    const dates = completions[h.id] || []
    dates.forEach((d) => {
      completionCountByDate[d] = (completionCountByDate[d] || 0) + 1
    })
  })

  // Calendar grid
  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const weeks = []
  let day = calStart
  while (day <= calEnd) {
    const week = []
    for (let i = 0; i < 7; i++) {
      week.push(new Date(day))
      day = addDays(day, 1)
    }
    weeks.push(week)
  }

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setViewDate(subMonths(viewDate, 1))}
          className="text-grid/40 hover:text-forest transition-colors p-1"
        >
          <ChevronLeft size={16} strokeWidth={1.5} />
        </button>
        <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-grid/60">
          {format(viewDate, 'MMMM yyyy')}
        </span>
        <button
          onClick={() => setViewDate(addMonths(viewDate, 1))}
          className="text-grid/40 hover:text-forest transition-colors p-1"
        >
          <ChevronRight size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-grid/15">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="text-center font-mono text-[9px] uppercase tracking-[0.1em] text-grid/30 py-1.5">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 border-l border-grid/15">
        {weeks.flatMap((week) =>
          week.map((date) => {
            const dateStr = format(date, 'yyyy-MM-dd')
            const inMonth = isSameMonth(date, viewDate)
            const isToday = dateStr === todayStr
            const isFuture = dateStr > todayStr
            const count = inMonth && !isFuture ? (completionCountByDate[dateStr] || 0) : 0
            const allDone = count >= 3

            return (
              <div
                key={dateStr}
                className="relative aspect-square border-r border-b border-grid/15 overflow-hidden flex items-center justify-center p-1"
              >
                {/* Date number — top right */}
                <div className="absolute top-1 right-1 z-10 flex items-start justify-end">
                  <span
                    className={`font-mono text-[9px] leading-none ${
                        !inMonth
                        ? 'text-grid/15'
                        : isFuture
                          ? 'text-grid/20'
                          : allDone
                            ? 'text-forest font-semibold'
                            : 'text-grid/50'
                    } ${isToday ? 'w-4 h-4 flex items-center justify-center rounded-full ring-1.5 ring-forest text-forest font-semibold' : ''}`}
                  >
                    {format(date, 'd')}
                  </span>
                </div>

                {/* Big Dot if all 3 are completed */}
                {allDone && (
                  <div className="w-[60%] h-[60%] bg-mint rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80" />
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Legend */}
      {activeHabits.length > 0 && (
        <div className="flex items-center gap-3 mt-3 justify-center">
          <span className="font-mono text-[9px] text-grid/40 uppercase tracking-[0.1em]">
            • All 3 habits completed
          </span>
        </div>
      )}
    </div>
  )
}
