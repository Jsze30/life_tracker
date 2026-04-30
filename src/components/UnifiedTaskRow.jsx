import { useState } from 'react'
import confetti from 'canvas-confetti'
import StreakBadge from './StreakBadge'

export default function UnifiedTaskRow({ task }) {
  const [localOverride, setLocalOverride] = useState(null)
  const [isCompleting, setIsCompleting] = useState(false)
  
  const isCompleted = localOverride !== null ? localOverride : task.completed

  const handleCheckboxChange = (e) => {
    if (!task.completed) {
      // For schoolwork, use slide-out animation like AssignmentCard
      if (task.type === 'schoolwork') {
        setLocalOverride(true)
        setTimeout(() => {
          setIsCompleting(true)
        }, 100)
        setTimeout(() => {
          setIsCompleting(false)
          setLocalOverride(null)
          task.onToggle()
        }, 600)
      } else {
        // For other items, use confetti animation
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

        setLocalOverride(true)
        setTimeout(() => {
          task.onToggle()
          setLocalOverride(null)
        }, 600)
      }
    } else {
      // Unchecking
      setLocalOverride(false)
      task.onToggle()
      setTimeout(() => setLocalOverride(null), 50)
    }
  }

  const getBorderColor = () => {
    if (isCompleted) return 'border-l-grid/20'
    switch (task.badgeColor) {
      case 'forest': return 'border-l-forest'
      case 'mint': return 'border-l-mint'
      case 'gold': return 'border-l-gold'
      case 'coral': return 'border-l-coral'
      default: return 'border-l-grid/40'
    }
  }

  return (
    <div
      className={`flex items-center gap-4 px-5 py-3 border-l-4 transition-all duration-500 ease-in-out ${
        isCompleting ? 'translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'
      } ${
        isCompleted ? 'opacity-50' : ''
      } ${getBorderColor()}`}
    >
      <input
        type="checkbox"
        checked={isCompleted}
        onChange={handleCheckboxChange}
        className="mt-0.5"
      />
      
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        {task.subtitle && (
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-grid/50 mb-0.5 transition-colors duration-300">
            {task.subtitle}
          </span>
        )}
        <span className={`font-body text-sm transition-all duration-300 ${isCompleted ? 'line-through text-grid/50' : 'text-grid'}`}>
          {task.title}
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0 transition-opacity duration-300">
        {task.streak && <StreakBadge current={task.streak.current} best={task.streak.best} />}
        
        {task.type === 'task' && (
          <button
            onClick={task.onDelete}
            className="ml-2 font-mono text-[10px] text-grid/30 hover:text-coral transition-colors uppercase tracking-[0.1em]"
            aria-label="Delete Task"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  )
}
