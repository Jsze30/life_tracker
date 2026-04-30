import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import HabitRow from '../components/HabitRow'
import { Plus } from 'lucide-react'
import HabitGrid from '../components/HabitGrid'
import confetti from 'canvas-confetti'
import { today } from '../lib/dates'

export default function HabitsPage() {
  const habits = useStore((s) => s.habits)
  const completions = useStore((s) => s.completions)
  const addHabit = useStore((s) => s.addHabit)
  const todayStr = today()
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [showToast, setShowToast] = useState(false)
  const prevAllDoneRef = useRef(null)

  const activeHabits = habits.filter((h) => !h.archivedAt)

  useEffect(() => {
    const allDone = activeHabits.length > 0 &&
      activeHabits.every(h => (completions[h.id] || []).includes(todayStr))
    if (allDone && prevAllDoneRef.current === false) {
      confetti({ particleCount: 120, spread: 120, origin: { x: 0.5, y: 0.5 }, colors: ['#1A3C2B', '#9EFFBF', '#F4D35E', '#FF8C69', '#ffffff'] })
      setTimeout(() => {
        confetti({ particleCount: 70, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#9EFFBF', '#F4D35E', '#FF8C69'] })
        confetti({ particleCount: 70, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#9EFFBF', '#F4D35E', '#FF8C69'] })
      }, 250)
      setShowToast(true)
      const timer = setTimeout(() => setShowToast(false), 4000)
      return () => clearTimeout(timer)
    }
    prevAllDoneRef.current = allDone
  }, [completions])

  const handleAdd = (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    addHabit(newName.trim())
    setNewName('')
    setShowForm(false)
  }

  return (
    <div>
      <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight text-forest leading-[0.9] mb-1">
        HABITS
      </h1>
      <div className="h-px bg-grid/20 mb-6" />

      {/* Habit List */}
      {activeHabits.length > 0 ? (
        <div className="shadow-sm bg-white border border-grid/20 divide-y divide-grid/20 mb-6">
          {activeHabits.map((habit) => (
            <HabitRow key={habit.id} habit={habit} />
          ))}
        </div>
      ) : (
        <div className="shadow-sm bg-white border border-grid/20 p-12 text-center mb-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-grid/40">
            No habits yet — add one to start tracking
          </p>
        </div>
      )}

      {/* Add Form */}
      {showForm ? (
        <form onSubmit={handleAdd} className="shadow-sm bg-white relative border border-grid/20 p-4">
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-forest" />
          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-forest" />
          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-forest" />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-forest" />

          <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-grid/60 mb-1.5">
            Habit Name
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Exercise, Read 30 min"
              autoFocus
              className="shadow-sm flex-1 bg-white border border-grid/20 px-3 py-2 font-body text-sm text-grid focus:outline-none focus:border-forest transition-colors"
            />
            <button
              type="submit"
              className="bg-forest text-white font-mono text-[10px] uppercase tracking-[0.1em] px-4 py-2 hover:bg-forest/90 transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setNewName('') }}
              className="shadow-sm bg-white px-3 py-2 border border-grid/20 font-mono text-[10px] uppercase tracking-[0.1em] text-grid hover:border-grid/40 transition-colors"
            >
              &times;
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="shadow-sm bg-white w-full border border-grid/20 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.1em] text-grid/60 hover:border-forest hover:text-forest transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={14} strokeWidth={1.5} />
          Add Habit
        </button>
      )}

      {/* Habit Grid */}
      <div className="shadow-sm bg-white mt-10 border border-grid/20 p-4">
        <HabitGrid />
      </div>

      {showToast && (
        <div className="fixed bottom-6 right-6 bg-forest text-white px-4 py-3 shadow-lg flex items-center gap-4 z-50 animate-toast">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em]">Congratulations! You're done for the day.</span>
        </div>
      )}
    </div>
  )
}
