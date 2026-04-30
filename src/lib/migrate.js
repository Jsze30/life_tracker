import { supabase } from './supabase'

const STORAGE_KEY = 'habit-tracker-store'

export async function migrateFromLocalStorage() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return false

  let state
  try {
    const parsed = JSON.parse(raw)
    state = parsed.state || parsed
  } catch {
    return false
  }

  const { habits = [], tasks = [], courses = [], assignments = [], contentItems = [], contentTasks = [], completions = {} } = state

  const hasData = habits.length || tasks.length || courses.length || assignments.length || contentItems.length
  if (!hasData) {
    localStorage.removeItem(STORAGE_KEY)
    return false
  }

  const { data: { user } } = await supabase.auth.getUser()
  const userId = user.id

  const ops = []

  if (habits.length) {
    ops.push(supabase.from('habits').upsert(
      habits.map(h => ({ id: h.id, name: h.name, created_at: h.createdAt, archived_at: h.archivedAt, user_id: userId }))
    ))
  }

  if (tasks.length) {
    ops.push(supabase.from('tasks').upsert(
      tasks.map(t => ({ id: t.id, title: t.title, date: t.date, completed: t.completed, user_id: userId }))
    ))
  }

  if (courses.length) {
    ops.push(supabase.from('courses').upsert(
      courses.map(c => ({ id: c.id, name: c.name, user_id: userId }))
    ))
  }

  if (assignments.length) {
    ops.push(supabase.from('assignments').upsert(
      assignments.map(a => ({
        id: a.id,
        course_id: a.courseId,
        title: a.title,
        due_date: a.dueDate,
        type: a.type,
        completed: a.completed,
        user_id: userId,
      }))
    ))
  }

  if (contentItems.length) {
    ops.push(supabase.from('content_items').upsert(
      contentItems.map(i => ({ id: i.id, platform: i.platform, name: i.name, user_id: userId }))
    ))
  }

  if (contentTasks.length) {
    ops.push(supabase.from('content_tasks').upsert(
      contentTasks.map(t => ({ id: t.id, platform: t.platform, name: t.name, count: t.count, user_id: userId }))
    ))
  }

  // Flatten completions map → rows, insert in batches of 500
  const completionRows = []
  Object.entries(completions).forEach(([item_id, dates]) => {
    if (Array.isArray(dates)) {
      dates.forEach(date => completionRows.push({ item_id, date, user_id: userId }))
    }
  })
  for (let i = 0; i < completionRows.length; i += 500) {
    ops.push(supabase.from('completions').upsert(completionRows.slice(i, i + 500)))
  }

  await Promise.all(ops)
  localStorage.removeItem(STORAGE_KEY)
  console.log('Migration complete — localStorage data moved to Supabase')
  return true
}
