import { useStore } from '../store'
import { today } from '../lib/dates'
import { calculateStreak } from '../lib/streaks'
import StreakBadge from './StreakBadge'
import confetti from 'canvas-confetti'
import { Trash2 } from 'lucide-react'

export default function HabitRow({ habit }) {
  const toggleCompletion = useStore((s) => s.toggleCompletion)
  const completions = useStore((s) => s.completions)
  const deleteHabit = useStore((s) => s.deleteHabit)

  const todayStr = today()
  const dates = completions[habit.id] || []
  const completedToday = dates.includes(todayStr)
  const { current, best } = calculateStreak(dates, todayStr)

  const handleCheckboxChange = (e) => {
    if (!completedToday) {
      const rect = e.target.getBoundingClientRect()
      const x = (rect.left + rect.width / 2) / window.innerWidth
      const y = (rect.top + rect.height / 2) / window.innerHeight
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x, y },
        colors: ['#1A3C2B', '#9EFFBF', '#FF8C69', '#F4D35E'],
        disableForReducedMotion: true,
        zIndex: 100
      })
    }
    toggleCompletion(habit.id, todayStr)
  }

  return (
    <div className="border-l-4 border-l-mint">
      <div className="flex items-center gap-4 p-4">
        <input
          type="checkbox"
          checked={completedToday}
          onChange={handleCheckboxChange}
        />

        <div className="flex-1 min-w-0">
          <span className={`font-body text-sm transition-all duration-300 ${completedToday ? 'text-forest line-through opacity-50' : 'text-grid'}`}>
            {habit.name}
          </span>
        </div>

        <StreakBadge current={current} best={best} />

        <span className="font-mono text-[10px] text-grid/40">
          Best: {best}
        </span>

        <button
          onClick={() => {
            if (window.confirm(`Delete "${habit.name}" and all its history?`)) {
              deleteHabit(habit.id)
            }
          }}
          className="text-grid/30 hover:text-coral transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
