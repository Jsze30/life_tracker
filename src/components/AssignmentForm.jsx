import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { parseTask } from '../lib/parseTask'
import { formatShortDate } from '../lib/dates'
import { Calendar, FileText, GraduationCap } from 'lucide-react'

export default function AssignmentForm({ courseId, onClose }) {
  const addAssignment = useStore((s) => s.addAssignment)
  const [input, setInput] = useState('')
  const [preview, setPreview] = useState({ title: '', dueDate: null, type: 'assignment' })

  useEffect(() => {
    const parsed = parseTask(input)
    setPreview(parsed)
  }, [input])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!preview.title.trim()) return

    addAssignment({
      courseId,
      title: preview.title,
      dueDate: preview.dueDate || '',
      type: preview.type,
    })

    setInput('')
    onClose?.()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose?.()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="shadow-sm bg-white relative border border-grid/20">
      {/* Corner markers */}
      <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-forest" />
      <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-forest" />
      <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-forest" />
      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-forest" />

      <div className="p-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='e.g. "MP3 tuesday" or "Midterm next friday"'
          autoFocus
          className="shadow-sm w-full bg-white border border-grid/20 px-3 py-2.5 font-body text-sm text-grid focus:outline-none focus:border-forest transition-colors"
        />

        {/* Live preview */}
        {input.trim() && (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-grid/60">
            {preview.title && (
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em]">
                <FileText size={11} strokeWidth={1.5} />
                {preview.title}
              </span>
            )}
            {preview.dueDate && (
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-forest">
                <Calendar size={11} strokeWidth={1.5} />
                {formatShortDate(preview.dueDate)}
              </span>
            )}
            {!preview.dueDate && (
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-grid/30">
                <Calendar size={11} strokeWidth={1.5} />
                No date detected
              </span>
            )}
            {preview.type === 'test' && (
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-gold">
                <GraduationCap size={11} strokeWidth={1.5} />
                Test
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex border-t border-grid/20">
        <button
          type="submit"
          disabled={!preview.title.trim()}
          className="flex-1 bg-forest text-white font-mono text-[10px] uppercase tracking-[0.1em] px-4 py-2.5 hover:bg-forest/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Add
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border-l border-grid/20 font-mono text-[10px] uppercase tracking-[0.1em] text-grid hover:bg-grid/5 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
