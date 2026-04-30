import { useState } from 'react'
import { useStore } from '../store'
import AssignmentCard from '../components/AssignmentCard'
import AssignmentForm from '../components/AssignmentForm'
import { Plus, X } from 'lucide-react'

export default function SchoolworkPage() {
  const assignments = useStore((s) => s.assignments)
  const courses = useStore((s) => s.courses)
  const addCourse = useStore((s) => s.addCourse)
  const deleteCourse = useStore((s) => s.deleteCourse)

  const [activeCourseId, setActiveCourseId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [newCourseName, setNewCourseName] = useState('')
  const [undoPrompt, setUndoPrompt] = useState(null)

  const toggleAssignment = useStore((s) => s.toggleAssignment)

  const handleToggle = (id) => {
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

  // Filter assignments by selected course and remove completed ones
  const filtered = activeCourseId
    ? assignments.filter((a) => a.courseId === activeCourseId && !a.completed)
    : assignments.filter((a) => !a.completed)

  const sorted = [...filtered].sort((a, b) => {
    return (a.dueDate || '').localeCompare(b.dueDate || '')
  })

  const handleAddCourse = (e) => {
    e.preventDefault()
    if (!newCourseName.trim()) return
    addCourse(newCourseName)
    setNewCourseName('')
    setShowAddCourse(false)
  }

  const handleDeleteCourse = (id) => {
    const course = courses.find((c) => c.id === id)
    const count = assignments.filter((a) => a.courseId === id).length
    const msg = count > 0
      ? `Delete "${course.name}" and its ${count} assignment${count > 1 ? 's' : ''}?`
      : `Delete "${course.name}"?`
    if (window.confirm(msg)) {
      if (activeCourseId === id) setActiveCourseId(null)
      deleteCourse(id)
    }
  }

  // Get the course name for display
  const getCourseName = (courseId) => {
    const course = courses.find((c) => c.id === courseId)
    return course ? course.name : 'Unknown'
  }

  return (
    <div>
      <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight text-forest leading-[0.9] mb-1">
        SCHOOLWORK
      </h1>
      <div className="h-px bg-grid/20 mb-6" />

      {/* Course Tabs */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveCourseId(null)}
          className={`shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] px-3 py-1.5 border transition-colors ${
            activeCourseId === null
              ? 'bg-forest text-white border-forest'
              : 'border-grid/20 text-grid/60 hover:border-grid/40'
          }`}
        >
          All
        </button>

        {courses.map((course) => {
          const count = assignments.filter((a) => a.courseId === course.id && !a.completed).length
          return (
            <div key={course.id} className="relative group shrink-0">
              <button
                onClick={() => setActiveCourseId(course.id)}
                className={`font-mono text-[10px] uppercase tracking-[0.1em] px-3 py-1.5 border transition-colors pr-7 ${
                  activeCourseId === course.id
                    ? 'bg-forest text-white border-forest'
                    : 'border-grid/20 text-grid/60 hover:border-grid/40'
                }`}
              >
                {course.name}
                {count > 0 && (
                  <span className={`ml-1.5 ${activeCourseId === course.id ? 'text-white/60' : 'text-grid/30'}`}>
                    {count}
                  </span>
                )}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id) }}
                className={`absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${
                  activeCourseId === course.id ? 'text-white/60 hover:text-white' : 'text-grid/30 hover:text-coral'
                }`}
              >
                <X size={10} />
              </button>
            </div>
          )
        })}

        {/* Add Course Button */}
        {showAddCourse ? (
          <form onSubmit={handleAddCourse} className="flex items-center gap-1 shrink-0">
            <input
              type="text"
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
              placeholder="CS 225"
              autoFocus
              onKeyDown={(e) => e.key === 'Escape' && setShowAddCourse(false)}
              className="w-24 bg-white border border-forest px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-grid focus:outline-none"
            />
            <button
              type="submit"
              className="bg-forest text-white p-1"
            >
              <Plus size={12} />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowAddCourse(true)}
            className="shrink-0 border border-dashed border-grid/20 text-grid/40 hover:border-forest hover:text-forest transition-colors p-1.5"
          >
            <Plus size={12} />
          </button>
        )}
      </div>

      {/* Assignment List */}
      {courses.length === 0 ? (
        <div className="shadow-sm bg-white border border-grid/20 p-12 text-center mb-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-grid/40 mb-3">
            Add a course to get started
          </p>
          <button
            onClick={() => setShowAddCourse(true)}
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-forest border border-forest px-4 py-2 hover:bg-forest hover:text-white transition-colors"
          >
            + Add Course
          </button>
        </div>
      ) : sorted.length > 0 ? (
        <div className="mb-6 flex flex-col gap-6">
          {activeCourseId === null ? (
            courses.map(course => {
              const courseAssignments = sorted.filter(a => a.courseId === course.id)
              if (courseAssignments.length === 0) return null

              return (
                <div key={course.id} className="shadow-sm bg-white border border-grid/20">
                  <div className="px-5 py-3 border-b border-grid/20">
                    <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-forest font-bold">
                      {course.name}
                    </span>
                  </div>
                  <div className="divide-y divide-grid/20">
                    {courseAssignments.map((assignment) => (
                      <AssignmentCard
                        key={assignment.id}
                        assignment={assignment}
                        courseName={course.name}
                        onToggle={handleToggle}
                      />
                    ))}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="shadow-sm bg-white border border-grid/20 divide-y divide-grid/20">
              {sorted.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  courseName={getCourseName(assignment.courseId)}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="shadow-sm bg-white border border-grid/20 p-12 text-center mb-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-grid/40">
            {activeCourseId
              ? 'No assignments for this course'
              : 'No assignments yet'}
          </p>
        </div>
      )}

      {/* Add Assignment */}
      {courses.length > 0 && (
        <>
          {showForm ? (
            <div className="mb-6">
              {/* Course selector if viewing "All" */}
              {!activeCourseId && courses.length > 1 && (
                <div className="mb-3">
                  <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-grid/60 mb-1.5">
                    Course
                  </label>
                  <div className="flex gap-1 flex-wrap">
                    {courses.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setActiveCourseId(c.id)}
                        className="shadow-sm bg-white font-mono text-[10px] uppercase tracking-[0.1em] px-2.5 py-1 border border-grid/20 text-grid/60 hover:border-forest hover:text-forest transition-colors"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {(activeCourseId || courses.length === 1) && (
                <AssignmentForm
                  courseId={activeCourseId || courses[0].id}
                  onClose={() => setShowForm(false)}
                />
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="shadow-sm bg-white w-full border border-grid/20 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.1em] text-grid/60 hover:border-forest hover:text-forest transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={14} strokeWidth={1.5} />
              Add Assignment
            </button>
          )}
        </>
      )}

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
