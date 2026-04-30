import { useState } from 'react'
import { useStore } from '../store'
import { formatDate, isOverdue, daysUntil, today } from '../lib/dates'
import StatusBadge from './StatusBadge'

export default function AssignmentCard({ assignment, courseName, onToggle }) {
  const toggleAssignment = useStore((s) => s.toggleAssignment)
  const deleteAssignment = useStore((s) => s.deleteAssignment)
  const [isCompleting, setIsCompleting] = useState(false)
  const [localOverride, setLocalOverride] = useState(null)

  const todayStr = today()
  const hasDueDate = !!assignment.dueDate

  // Use localOverride if present, otherwise use assignment.completed
  const isCompleted = localOverride !== null ? localOverride : assignment.completed

  const overdue = hasDueDate && !isCompleted && isOverdue(assignment.dueDate, todayStr)
  const days = hasDueDate ? daysUntil(assignment.dueDate, todayStr) : null

  let dueLabel = ''
  if (!hasDueDate) dueLabel = 'No due date'
  else if (days === 0) dueLabel = 'Due today'
  else if (days === 1) dueLabel = 'Due tomorrow'
  else if (days < 0) dueLabel = `${Math.abs(days)} day${Math.abs(days) > 1 ? 's' : ''} overdue`
  else dueLabel = `Due in ${days} days`

  const handleCheckboxChange = () => {
    if (!assignment.completed) {
      // 1. Immediately visually check and cross out
      setLocalOverride(true)

      // 2. Wait half a second before sliding out
      setTimeout(() => {
        setIsCompleting(true)
      }, 100)

      // 3. After slide out finishes (500ms wait + 400ms transition), commit to store
      setTimeout(() => {
        setIsCompleting(false)
        setLocalOverride(null)
        if (onToggle) onToggle(assignment.id)
        else toggleAssignment(assignment.id)
      }, 600)
    } else {
      setLocalOverride(false)
      if (onToggle) onToggle(assignment.id)
      else toggleAssignment(assignment.id)

      // Reset local override after a tick
      setTimeout(() => setLocalOverride(null), 50)
    }
  }

  return (
    <div
      className={`flex items-start gap-4 p-5 border-l-4 transition-all duration-500 ease-in-out ${isCompleting ? 'translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'
        } ${isCompleted
          ? 'border-l-grid/20 opacity-50'
          : overdue
            ? 'border-l-coral'
            : 'border-l-forest'
        }`}
    >
      <input
        type="checkbox"
        checked={isCompleted}
        onChange={handleCheckboxChange}
        className="mt-1"
      />

      <div className="flex-1 min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-grid/60 mb-1">
          {courseName || assignment.course}
        </div>
        <div
          className={`font-body text-base mb-1.5 transition-all duration-200 ${isCompleted ? 'line-through text-grid/40' : 'text-grid'
            }`}
        >
          {assignment.title}
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`font-mono text-[11px] ${overdue ? 'text-coral' : 'text-grid/60'
              }`}
          >
            {hasDueDate ? `${formatDate(assignment.dueDate)} · ${dueLabel}` : dueLabel}
          </span>
          <StatusBadge
            label={assignment.type}
            color={assignment.type === 'test' ? 'gold' : 'ghost'}
          />
        </div>
      </div>

      <button
        onClick={() => {
          if (window.confirm(`Delete "${assignment.title}"?`)) {
            deleteAssignment(assignment.id)
          }
        }}
        className="font-mono text-[10px] text-grid/30 hover:text-coral transition-colors uppercase tracking-[0.1em] mt-1 z-10"
      >
        &times;
      </button>
    </div>
  )
}
