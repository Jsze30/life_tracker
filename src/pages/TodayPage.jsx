import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { today, formatDate, isOverdue, isDueSoon, daysUntil } from '../lib/dates'
import { calculateStreak } from '../lib/streaks'
import StreakBadge from '../components/StreakBadge'
import StatusBadge from '../components/StatusBadge'
import { format } from 'date-fns'
import { ArrowRight, RefreshCcw } from 'lucide-react'
import { QUOTES } from '../lib/quotes'
import AssignmentCard from '../components/AssignmentCard'
import UnifiedTaskRow from '../components/UnifiedTaskRow'
export default function TodayPage() {
  const todayStr = today()
  const dateDisplay = format(new Date(), 'EEEE, MMM d')

  const assignments = useStore((s) => s.assignments)
  const courses = useStore((s) => s.courses)
  const habits = useStore((s) => s.habits)
  const tasks = useStore((s) => s.tasks)
  const completions = useStore((s) => s.completions)
  
  const toggleCompletion = useStore((s) => s.toggleCompletion)
  const getCompletionDates = useStore((s) => s.getCompletionDates)
  const toggleAssignment = useStore((s) => s.toggleAssignment)
  const addTask = useStore((s) => s.addTask)
  const toggleTask = useStore((s) => s.toggleTask)
  const deleteTask = useStore((s) => s.deleteTask)

  const [newTaskInput, setNewTaskInput] = useState('')
  const [quote, setQuote] = useState(null)
  const [displayedText, setDisplayedText] = useState('')
  const [quotePhase, setQuotePhase] = useState('visible') // 'visible' | 'exiting' | 'typing'
  const [isSpinning, setIsSpinning] = useState(false)
  const [showRipple, setShowRipple] = useState(false)
  const [undoPrompt, setUndoPrompt] = useState(null)

  useEffect(() => {
    if (QUOTES && QUOTES.length > 0) {
      const q = QUOTES[Math.floor(Math.random() * QUOTES.length)]
      setQuote(q)
      setDisplayedText(q.text)
    }
  }, [])

  // Typing effect: runs whenever quotePhase switches to 'typing'
  useEffect(() => {
    if (quotePhase !== 'typing' || !quote) return
    const text = quote.text
    let idx = 0
    setDisplayedText('')
    const interval = setInterval(() => {
      idx++
      setDisplayedText(text.slice(0, idx))
      if (idx >= text.length) {
        clearInterval(interval)
        setQuotePhase('visible')
      }
    }, 22)
    return () => clearInterval(interval)
  }, [quotePhase, quote])

  const refreshQuote = () => {
    if (isSpinning || !QUOTES || QUOTES.length === 0) return
    const newQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)]
    setIsSpinning(true)
    setShowRipple(true)
    setQuotePhase('exiting')
    setTimeout(() => {
      setQuote(newQuote)
      setQuotePhase('typing')
    }, 320)
    setTimeout(() => setIsSpinning(false), 2500)
    setTimeout(() => setShowRipple(false), 750)
  }

  const activeHabits = habits.filter((h) => !h.archivedAt)

  const handleToggleUpcoming = (id) => {
    const assignment = assignments.find((a) => a.id === id)
    if (!assignment) return
    const isCompleting = !assignment.completed

    toggleAssignment(id)

    if (isCompleting) {
      if (undoPrompt && undoPrompt.timerId) clearTimeout(undoPrompt.timerId)
      const timerId = setTimeout(() => {
        setUndoPrompt(null)
      }, 4000)
      setUndoPrompt({ id, timerId })
    } else {
      if (undoPrompt && undoPrompt.id === id) {
        clearTimeout(undoPrompt.timerId)
        setUndoPrompt(null)
      }
    }
  }

  const handleUndo = () => {
    if (undoPrompt) {
      toggleAssignment(undoPrompt.id)
      clearTimeout(undoPrompt.timerId)
      setUndoPrompt(null)
    }
  }

  const handleToggleUnifiedSchoolwork = (id) => {
    const assignment = assignments.find((a) => a.id === id)
    if (!assignment) return
    const isCompleting = !assignment.completed

    toggleAssignment(id)

    if (isCompleting) {
      if (undoPrompt && undoPrompt.timerId) clearTimeout(undoPrompt.timerId)
      const timerId = setTimeout(() => {
        setUndoPrompt(null)
      }, 4000)
      setUndoPrompt({ id, timerId })
    } else {
      if (undoPrompt && undoPrompt.id === id) {
        clearTimeout(undoPrompt.timerId)
        setUndoPrompt(null)
      }
    }
  }

  const handleAddTask = (e) => {
    e.preventDefault()
    if (!newTaskInput.trim()) return
    addTask(newTaskInput.trim(), todayStr)
    setNewTaskInput('')
  }

  const getCourseName = (courseId) => {
    const course = courses.find((c) => c.id === courseId)
    return course ? course.name : ''
  }

  // --- 1. Deadlines Approaching (Original Box 2) ---
  const upcoming = assignments
    .filter((a) => !a.completed && a.dueDate && (isDueSoon(a.dueDate, todayStr, 7) || isOverdue(a.dueDate, todayStr)))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  // --- 2. Unified Today's Tasks (Box 1) ---
  // Build unified task list
  const unifiedTasks = []

  // Ad-hoc Tasks
  tasks.filter(t => t.date === todayStr && !t.completed).forEach(t => {
    unifiedTasks.push({
      id: `task-${t.id}`,
      type: 'task',
      title: t.title,
      completed: t.completed,
      onToggle: () => toggleTask(t.id),
      onDelete: () => deleteTask(t.id),
      badgeLabel: 'task',
      badgeColor: 'ghost'
    })
  })

  // Schoolwork due today (incomplete only)
  assignments.filter(a => a.dueDate === todayStr && !a.completed).forEach(a => {
    unifiedTasks.push({
      id: `assignment-${a.id}`,
      type: 'schoolwork',
      title: a.title,
      subtitle: getCourseName(a.courseId),
      completed: a.completed,
      onToggle: () => handleToggleUnifiedSchoolwork(a.id),
      badgeLabel: a.type,
      badgeColor: 'forest'
    })
  })

  // Habits
  activeHabits.forEach(h => {
    const dates = getCompletionDates(h.id)
    const done = dates.includes(todayStr)
    const { current, best } = calculateStreak(dates, todayStr)
    unifiedTasks.push({
      id: `habit-${h.id}`,
      type: 'habit',
      title: h.name,
      completed: done,
      onToggle: () => toggleCompletion(h.id, todayStr),
      badgeLabel: 'habit',
      badgeColor: 'mint',
      streak: { current, best }
    })
  })

  // Sort: incomplete first
  const sortedUnifiedTasks = [...unifiedTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return 0 // preserve insertion order roughly
  })

  const tasksCompleted = sortedUnifiedTasks.filter(t => t.completed).length

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight text-forest leading-[0.9]">
          TODAY
        </h1>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-grid/60">
          {dateDisplay}
        </span>
      </div>
      <div className="h-px bg-grid/20 mb-8" />

      {/* Quote Card */}
      {quote && (
        <section className="bg-forest text-white overflow-hidden p-5 px-6 mb-6 relative group transition-colors rounded-lg flex items-center justify-between gap-6">
          <div className={`flex items-start gap-4 relative z-10 w-full overflow-hidden ${quotePhase === 'exiting' ? 'quote-exit' : ''}`}>
            <span className="font-display text-4xl text-white/30 leading-none mt-1 select-none shrink-0">&ldquo;</span>
            <div className="flex flex-col pt-1 min-w-0">
              <p className={`text-[17px] italic text-white/95 mb-2 leading-relaxed${quotePhase === 'typing' ? ' typing-cursor' : ''}`} style={{fontFamily: 'var(--font-quote)'}}>
                {quotePhase === 'visible' ? quote.text : displayedText}
              </p>
              <div className={`font-mono text-[10px] uppercase tracking-[0.05em] text-white/50 font-medium truncate transition-opacity duration-300 ${quotePhase === 'visible' ? 'opacity-100' : 'opacity-0'}`}>
                — {quote.author}
              </div>
            </div>
          </div>

          <div className="relative shrink-0 z-10">
            {showRipple && (
              <div className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-mint pointer-events-none mint-ripple" />
            )}
            <button
              onClick={refreshQuote}
              className={`p-2 border border-white/10 rounded-md bg-white/[0.02] text-white/60 hover:text-white hover:border-white/30 hover:bg-white/10 transition-all ${!isSpinning ? 'hover:rotate-90 transition-transform duration-200' : 'spin-slot'}`}
              aria-label="New Quote"
            >
              <RefreshCcw size={14} strokeWidth={2.5} />
            </button>
          </div>
        </section>
      )}

      {/* Box 1: Today's Tasks */}
      <section className="shadow-sm bg-white border border-grid/20 mb-6">
        <div className="flex items-center justify-between px-5 py-3 border-b border-grid/20">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-grid/60">
            Today's Tasks
          </span>
          <span className="font-mono text-[11px] text-grid">
            {tasksCompleted}/{sortedUnifiedTasks.length} done
          </span>
        </div>

        {/* Add Task Input */}
        <form onSubmit={handleAddTask} className="border-b border-grid/10 flex">
          <input
            type="text"
            value={newTaskInput}
            onChange={(e) => setNewTaskInput(e.target.value)}
            placeholder="+ Add a daily task..."
            className="w-full bg-white/50 px-5 py-3 font-body text-sm text-grid placeholder-grid/30 focus:outline-none focus:bg-white transition-colors"
          />
        </form>

        {sortedUnifiedTasks.length > 0 ? (
          <div className="divide-y divide-grid/10">
            {sortedUnifiedTasks.map((task) => (
              <UnifiedTaskRow key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <div className="px-5 py-8 text-center bg-white/30">
            <p className="font-mono text-[11px] text-grid/40 uppercase tracking-[0.1em]">
              No tasks for today. You're free!
            </p>
          </div>
        )}
      </section>

      {/* Box 2: Deadlines Approaching */}
      <section className="shadow-sm bg-white border border-grid/20">
        <div className="flex items-center justify-between px-5 py-3 border-b border-grid/20">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-grid/60">
            Deadlines Approaching
          </span>
          <Link
            to="/schoolwork"
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-grid/40 hover:text-forest transition-colors flex items-center gap-1"
          >
            View all <ArrowRight size={10} />
          </Link>
        </div>

        {upcoming.length > 0 ? (
          <div className="divide-y divide-grid/10">
            {upcoming.map((a) => (
              <AssignmentCard
                key={a.id}
                assignment={a}
                courseName={getCourseName(a.courseId)}
                onToggle={handleToggleUpcoming}
              />
            ))}
          </div>
        ) : (
          <div className="px-5 py-8 text-center bg-white/30">
            <p className="font-mono text-[11px] text-grid/40 uppercase tracking-[0.1em]">
              No upcoming deadlines
            </p>
          </div>
        )}
      </section>

      {/* Undo Popup */}
      {undoPrompt && (
        <div className="fixed bottom-6 right-6 bg-forest text-white px-4 py-3 shadow-lg flex items-center gap-4 z-50 animate-toast">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em]">Assignment completed</span>
          <button
            onClick={handleUndo}
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-gold hover:text-white transition-colors underline"
          >
            Undo
          </button>
        </div>
      )}

    </div>
  )
}
