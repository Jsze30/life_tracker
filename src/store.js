import { create } from 'zustand'
import * as db from './lib/db'

export const useStore = create((set, get) => ({
  // --- State ---
  loading: false,
  courses: [],
  assignments: [],
  habits: [],
  tasks: [],
  completions: {},
  contentItems: [],
  contentTasks: [],

  // --- Init ---
  initStore: async () => {
    set({ loading: true })
    try {
      const data = await db.fetchAll()
      set({ ...data, loading: false })
    } catch (err) {
      console.error('Failed to load data:', err)
      set({ loading: false })
    }
  },

  // --- Task Actions ---
  addTask: (title, date) => {
    const task = { id: crypto.randomUUID(), title, date, completed: false }
    set((state) => ({ tasks: [...state.tasks, task] }))
    db.insertTask(task)
  },

  toggleTask: (id) => {
    const task = get().tasks.find(t => t.id === id)
    if (!task) return
    set((state) => ({
      tasks: state.tasks.map((t) => t.id === id ? { ...t, completed: !t.completed } : t),
    }))
    db.updateTask(id, { completed: !task.completed })
  },

  deleteTask: (id) => {
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))
    db.deleteTask(id)
  },

  // --- Course Actions ---
  addCourse: (name) => {
    const course = { id: crypto.randomUUID(), name: name.trim() }
    set((state) => ({ courses: [...state.courses, course] }))
    db.insertCourse(course)
  },

  deleteCourse: (id) => {
    set((state) => ({
      courses: state.courses.filter((c) => c.id !== id),
      assignments: state.assignments.filter((a) => a.courseId !== id),
    }))
    db.deleteCourse(id)
  },

  // --- Assignment Actions ---
  addAssignment: (assignment) => {
    const newAssignment = { id: crypto.randomUUID(), completed: false, ...assignment }
    set((state) => ({ assignments: [...state.assignments, newAssignment] }))
    db.insertAssignment(newAssignment)
  },

  toggleAssignment: (id) => {
    const assignment = get().assignments.find(a => a.id === id)
    if (!assignment) return
    set((state) => ({
      assignments: state.assignments.map((a) => a.id === id ? { ...a, completed: !a.completed } : a),
    }))
    db.updateAssignment(id, { completed: !assignment.completed })
  },

  deleteAssignment: (id) => {
    set((state) => ({ assignments: state.assignments.filter((a) => a.id !== id) }))
    db.deleteAssignment(id)
  },

  // --- Habit Actions ---
  addHabit: (name) => {
    const habit = { id: crypto.randomUUID(), name, createdAt: new Date().toISOString().split('T')[0], archivedAt: null }
    set((state) => ({ habits: [...state.habits, habit] }))
    db.insertHabit(habit)
  },

  archiveHabit: (id) => {
    const archivedAt = new Date().toISOString().split('T')[0]
    set((state) => ({
      habits: state.habits.map((h) => h.id === id ? { ...h, archivedAt } : h),
    }))
    db.updateHabit(id, { archivedAt })
  },

  deleteHabit: (id) => {
    set((state) => {
      const newCompletions = { ...state.completions }
      delete newCompletions[id]
      return { habits: state.habits.filter((h) => h.id !== id), completions: newCompletions }
    })
    db.deleteHabit(id)
  },

  // --- Content Item Actions (legacy) ---
  addContentItem: (platform, name) => {
    const item = { id: crypto.randomUUID(), platform, name }
    set((state) => ({ contentItems: [...state.contentItems, item] }))
    db.insertContentItem(item)
  },

  deleteContentItem: (id) => {
    set((state) => {
      const newCompletions = { ...state.completions }
      delete newCompletions[id]
      return { contentItems: state.contentItems.filter((i) => i.id !== id), completions: newCompletions }
    })
    db.deleteContentItem(id)
  },

  // --- Content Task Actions ---
  addContentTask: (platform, name, count) => {
    const task = { id: crypto.randomUUID(), platform, name, count }
    set((state) => ({ contentTasks: [...state.contentTasks, task] }))
    db.insertContentTask(task)
  },

  deleteContentTask: (id) => {
    set((state) => {
      const newCompletions = { ...state.completions }
      Object.keys(newCompletions).forEach(key => {
        if (key.startsWith(`${id}-`)) delete newCompletions[key]
      })
      return { contentTasks: state.contentTasks.filter((t) => t.id !== id), completions: newCompletions }
    })
    db.deleteContentTask(id)
  },

  // --- Completion Actions ---
  toggleCompletion: (id, date) => {
    const dates = get().completions[id] || []
    const isCompleting = !dates.includes(date)
    const newDates = isCompleting ? [...dates, date].sort() : dates.filter((d) => d !== date)
    set((state) => ({ completions: { ...state.completions, [id]: newDates } }))
    db.toggleCompletion(id, date, isCompleting)
  },

  getCompletionDates: (id) => get().completions[id] || [],

  isCompletedToday: (id, today) => (get().completions[id] || []).includes(today),
}))
