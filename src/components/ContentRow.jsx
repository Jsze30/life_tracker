import { useState } from 'react'
import { useStore } from '../store'
import { today } from '../lib/dates'
import { calculateStreak } from '../lib/streaks'
import StreakBadge from './StreakBadge'
import CalendarHeatmap from './CalendarHeatmap'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function ContentRow({ id, name }) {
  const toggleCompletion = useStore((s) => s.toggleCompletion)
  const getCompletionDates = useStore((s) => s.getCompletionDates)
  const [expanded, setExpanded] = useState(false)

  const todayStr = today()
  const dates = getCompletionDates(id)
  const completedToday = dates.includes(todayStr)
  const { current, best } = calculateStreak(dates, todayStr)

  return (
    <div className="border-l-4 border-l-coral">
      <div className="flex items-center gap-4 p-4">
        <input
          type="checkbox"
          checked={completedToday}
          onChange={() => toggleCompletion(id, todayStr)}
        />

        <div className="flex-1 min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-grid/60">
            {name}
          </span>
          <div className="font-body text-sm text-grid mt-0.5">
            {completedToday ? 'Posted today' : 'Not posted'}
          </div>
        </div>

        <StreakBadge current={current} best={best} />

        <span className="font-mono text-[10px] text-grid/40">
          Best: {best}
        </span>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-grid/30 hover:text-grid transition-colors"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4">
          <div className="border-t border-grid/10 pt-4">
            <CalendarHeatmap completionDates={dates} />
          </div>
        </div>
      )}
    </div>
  )
}
