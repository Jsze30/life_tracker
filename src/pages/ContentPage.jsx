import { useState, useEffect, useRef, useMemo } from 'react'
import { useStore } from '../store'
import { today } from '../lib/dates'
import confetti from 'canvas-confetti'
import { Plus, Trash2 } from 'lucide-react'

const fireConfetti = () => {
  confetti({ particleCount: 120, spread: 120, origin: { x: 0.5, y: 0.5 }, colors: ['#1A3C2B', '#9EFFBF', '#F4D35E', '#FF8C69', '#ffffff'] })
  setTimeout(() => {
    confetti({ particleCount: 70, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#9EFFBF', '#F4D35E', '#FF8C69'] })
    confetti({ particleCount: 70, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#9EFFBF', '#F4D35E', '#FF8C69'] })
  }, 250)
}

function ImpactCheckbox({ id, label }) {
  const toggleCompletion = useStore(s => s.toggleCompletion)
  const completions = useStore(s => s.completions)
  const todayStr = today()

  const dates = completions[id] || []
  const completedToday = dates.includes(todayStr)
  const [animating, setAnimating] = useState(false)

  const handleToggle = (e) => {
    if (!completedToday) {
      setAnimating(true)
      const rect = e.currentTarget.getBoundingClientRect()
      const x = (rect.left + rect.width / 2) / window.innerWidth
      const y = (rect.top + rect.height / 2) / window.innerHeight
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x, y },
        colors: ['#1A3C2B', '#9EFFBF', '#FF8C69', '#F4D35E'],
        disableForReducedMotion: true,
        zIndex: 100,
      })
      setTimeout(() => setAnimating(false), 500)
    }
    toggleCompletion(id, todayStr)
  }

  return (
    <button
      onClick={handleToggle}
      className={`relative flex-shrink-0 transition-colors flex items-center justify-center outline-none ${
        completedToday ? 'bg-forest border-forest' : 'bg-white border-forest'
      } ${animating ? 'animate-shockwave' : ''}`}
      style={{ width: '18px', height: '18px', border: '1px solid var(--color-forest)', borderRadius: '0px' }}
      aria-label={label}
    >
      {completedToday && (
        <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={`w-[14px] h-[14px] ${animating ? 'animate-crash' : ''}`}>
          <path d="M3 7l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}

function AddTaskForm({ platform, onAdd, onCancel }) {
  const [name, setName] = useState('')
  const [count, setCount] = useState(1)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(platform, name.trim(), count)
  }

  return (
    <form onSubmit={handleSubmit} className="px-5 py-4 border-t border-grid/20 bg-grid/5 flex items-center gap-3 flex-wrap">
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Task name"
        autoFocus
        className="flex-1 min-w-[120px] font-mono text-[11px] uppercase tracking-[0.08em] bg-white border border-grid/20 px-3 py-2 outline-none focus:border-forest text-grid placeholder-grid/30"
      />
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setCount(c => Math.max(1, c - 1))}
          className="w-7 h-7 border border-grid/20 bg-white font-mono text-[13px] text-grid hover:bg-grid/10 flex items-center justify-center"
        >−</button>
        <span className="font-mono text-[12px] w-7 text-center text-grid">{count}</span>
        <button
          type="button"
          onClick={() => setCount(c => Math.min(50, c + 1))}
          className="w-7 h-7 border border-grid/20 bg-white font-mono text-[13px] text-grid hover:bg-grid/10 flex items-center justify-center"
        >+</button>
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-grid/40 ml-1">per day</span>
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" className="font-mono text-[10px] uppercase tracking-[0.1em] bg-forest text-white px-3 py-2 hover:bg-forest/90">
          Add
        </button>
        <button type="button" onClick={onCancel} className="font-mono text-[10px] uppercase tracking-[0.1em] text-grid/40 hover:text-grid px-2 py-2">
          Cancel
        </button>
      </div>
    </form>
  )
}

function PlatformSection({ platform, label }) {
  const contentTasks = useStore(s => s.contentTasks)
  const completions = useStore(s => s.completions)
  const addContentTask = useStore(s => s.addContentTask)
  const deleteContentTask = useStore(s => s.deleteContentTask)
  const todayStr = today()
  const [showForm, setShowForm] = useState(false)

  const platformTasks = contentTasks.filter(t => t.platform === platform)

  const handleAdd = (platform, name, count) => {
    addContentTask(platform, name, count)
    setShowForm(false)
  }

  return (
    <div className="shadow-sm bg-white border border-grid/20 mb-6">
      <div className="px-5 py-3 border-b border-grid/20 bg-grid/5">
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-forest font-bold">
          {label}
        </span>
      </div>

      <div className="divide-y divide-grid/20">
        {platformTasks.length === 0 && !showForm && (
          <div className="px-5 py-4 font-mono text-[10px] uppercase tracking-[0.08em] text-grid/30">
            No tasks yet
          </div>
        )}
        {platformTasks.map(task => {
          const checkboxIds = Array.from({ length: task.count }, (_, i) => `${task.id}-${i}`)
          const allDone = checkboxIds.every(id => (completions[id] || []).includes(todayStr))
          return (
            <div key={task.id} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-mono text-[10px] uppercase tracking-[0.1em] ${allDone ? 'text-forest' : 'text-grid/60'}`}>
                  {task.name} {task.count}x daily
                </h3>
                <button
                  onClick={() => deleteContentTask(task.id)}
                  className="text-grid/20 hover:text-coral transition-colors p-0.5"
                  aria-label={`Delete ${task.name}`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {checkboxIds.map((id, i) => (
                  <ImpactCheckbox key={id} id={id} label={`${task.name} ${i + 1}`} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {showForm ? (
        <AddTaskForm platform={platform} onAdd={handleAdd} onCancel={() => setShowForm(false)} />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full px-5 py-3 border-t border-grid/20 font-mono text-[10px] uppercase tracking-[0.1em] text-grid/40 hover:text-forest hover:bg-grid/5 transition-colors flex items-center gap-2"
        >
          <Plus size={12} /> Add task
        </button>
      )}
    </div>
  )
}

export default function ContentPage() {
  const completions = useStore(s => s.completions)
  const contentTasks = useStore(s => s.contentTasks)
  const todayStr = today()
  const [showCongrats, setShowCongrats] = useState(false)
  const prevAllDoneRef = useRef(null)

  const allCheckboxIds = useMemo(() =>
    contentTasks.flatMap(task =>
      Array.from({ length: task.count }, (_, i) => `${task.id}-${i}`)
    ),
    [contentTasks]
  )

  useEffect(() => {
    if (allCheckboxIds.length === 0) return
    const allDone = allCheckboxIds.every(id => (completions[id] || []).includes(todayStr))
    if (allDone && prevAllDoneRef.current === false) {
      fireConfetti()
      setShowCongrats(true)
      const timer = setTimeout(() => setShowCongrats(false), 4000)
      return () => clearTimeout(timer)
    }
    prevAllDoneRef.current = allDone
  }, [completions, allCheckboxIds, todayStr])

  return (
    <div>
      <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight text-forest leading-[0.9] mb-1">
        CONTENT
      </h1>
      <div className="h-px bg-grid/20 mb-6" />

      <PlatformSection platform="x" label="X" />
      <PlatformSection platform="instagram" label="INSTAGRAM" />

      {showCongrats && (
        <div className="fixed bottom-6 right-6 bg-forest text-white px-4 py-3 shadow-lg flex items-center gap-4 z-50 animate-toast">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em]">Congratulations! You're done for the day.</span>
        </div>
      )}
    </div>
  )
}
