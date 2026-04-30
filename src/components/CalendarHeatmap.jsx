import { subDays, format, startOfWeek, addDays } from 'date-fns'
import { today as getToday } from '../lib/dates'

export default function CalendarHeatmap({ completionDates = [] }) {
  const todayStr = getToday()
  const todayDate = new Date(todayStr + 'T12:00:00')
  const dateSet = new Set(completionDates)

  // Build 52 weeks of data (364 days) ending on today's week
  const endOfCurrentWeek = addDays(startOfWeek(todayDate, { weekStartsOn: 1 }), 6)
  const startDate = subDays(endOfCurrentWeek, 52 * 7 - 1)

  const weeks = []
  let currentDate = startDate

  for (let w = 0; w < 52; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      const isFuture = dateStr > todayStr
      week.push({
        date: dateStr,
        completed: dateSet.has(dateStr),
        isToday: dateStr === todayStr,
        isFuture,
      })
      currentDate = addDays(currentDate, 1)
    }
    weeks.push(week)
  }

  // Month labels
  const months = []
  let lastMonth = ''
  weeks.forEach((week, i) => {
    const firstDay = week[0].date
    const month = format(new Date(firstDay + 'T12:00:00'), 'MMM')
    if (month !== lastMonth) {
      months.push({ label: month, col: i })
      lastMonth = month
    }
  })

  return (
    <div className="overflow-x-auto">
      {/* Month labels */}
      <div className="flex mb-1" style={{ paddingLeft: 0 }}>
        {months.map((m, i) => (
          <span
            key={i}
            className="font-mono text-[9px] uppercase tracking-[0.1em] text-grid/40"
            style={{
              position: 'relative',
              left: `${m.col * 14}px`,
              marginRight: i < months.length - 1 ? 0 : undefined,
            }}
          >
            {m.label}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div
        className="grid gap-[2px]"
        style={{
          gridTemplateColumns: `repeat(52, 12px)`,
          gridTemplateRows: `repeat(7, 12px)`,
          gridAutoFlow: 'column',
        }}
      >
        {weeks.flatMap((week) =>
          week.map((day) => (
            <div
              key={day.date}
              title={day.date}
              className={`w-3 h-3 rounded-[1px] transition-colors ${
                day.isFuture
                  ? 'bg-transparent'
                  : day.isToday
                    ? day.completed
                      ? 'bg-mint ring-1 ring-forest'
                      : 'bg-paper ring-1 ring-forest'
                    : day.completed
                      ? 'bg-mint'
                      : 'bg-grid/[0.06] border border-grid/[0.08]'
              }`}
            />
          ))
        )}
      </div>
    </div>
  )
}
