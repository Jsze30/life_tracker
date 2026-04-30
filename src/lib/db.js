import { supabase } from './supabase'

const DEFAULT_CONTENT_TASKS = [
  { id: 'content-static-x-post', platform: 'x', name: 'Post', count: 2 },
  { id: 'content-static-x-reply', platform: 'x', name: 'Reply', count: 10 },
  { id: 'content-static-ig-post', platform: 'instagram', name: 'Post', count: 1 },
]

async function uid() {
  const { data: { user } } = await supabase.auth.getUser()
  return user.id
}

// ── Fetch all ────────────────────────────────────────────────────────────────

export async function fetchAll() {
  const userId = await uid()
  const [h, t, c, a, ci, ct, comp] = await Promise.all([
    supabase.from('habits').select('*').eq('user_id', userId),
    supabase.from('tasks').select('*').eq('user_id', userId),
    supabase.from('courses').select('*').eq('user_id', userId),
    supabase.from('assignments').select('*').eq('user_id', userId),
    supabase.from('content_items').select('*').eq('user_id', userId),
    supabase.from('content_tasks').select('*').eq('user_id', userId),
    supabase.from('completions').select('*').eq('user_id', userId),
  ])

  // Build completions map: { [item_id]: date[] }
  const completions = {}
  ;(comp.data || []).forEach(({ item_id, date }) => {
    if (!completions[item_id]) completions[item_id] = []
    completions[item_id].push(date)
  })

  // Seed default content tasks on first run
  let contentTasks = ct.data?.map(r => ({ id: r.id, platform: r.platform, name: r.name, count: r.count })) || []
  if (!contentTasks.length) {
    contentTasks = DEFAULT_CONTENT_TASKS
    await Promise.all(
      DEFAULT_CONTENT_TASKS.map(task =>
        supabase.from('content_tasks').insert({ ...task, user_id: userId })
      )
    )
  }

  return {
    habits: (h.data || []).map(r => ({ id: r.id, name: r.name, createdAt: r.created_at, archivedAt: r.archived_at })),
    tasks: (t.data || []).map(r => ({ id: r.id, title: r.title, date: r.date, completed: r.completed })),
    courses: (c.data || []).map(r => ({ id: r.id, name: r.name })),
    assignments: (a.data || []).map(r => ({ id: r.id, courseId: r.course_id, title: r.title, dueDate: r.due_date, type: r.type, completed: r.completed })),
    contentItems: (ci.data || []).map(r => ({ id: r.id, platform: r.platform, name: r.name })),
    contentTasks,
    completions,
  }
}

// ── Habits ───────────────────────────────────────────────────────────────────

export async function insertHabit(habit) {
  const userId = await uid()
  await supabase.from('habits').insert({ id: habit.id, name: habit.name, created_at: habit.createdAt, archived_at: habit.archivedAt, user_id: userId })
}

export async function updateHabit(id, { archivedAt }) {
  await supabase.from('habits').update({ archived_at: archivedAt }).eq('id', id)
}

export async function deleteHabit(id) {
  const userId = await uid()
  await Promise.all([
    supabase.from('habits').delete().eq('id', id),
    supabase.from('completions').delete().eq('item_id', id).eq('user_id', userId),
  ])
}

// ── Tasks ────────────────────────────────────────────────────────────────────

export async function insertTask(task) {
  const userId = await uid()
  await supabase.from('tasks').insert({ id: task.id, title: task.title, date: task.date, completed: task.completed, user_id: userId })
}

export async function updateTask(id, updates) {
  await supabase.from('tasks').update(updates).eq('id', id)
}

export async function deleteTask(id) {
  await supabase.from('tasks').delete().eq('id', id)
}

// ── Courses ──────────────────────────────────────────────────────────────────

export async function insertCourse(course) {
  const userId = await uid()
  await supabase.from('courses').insert({ id: course.id, name: course.name, user_id: userId })
}

export async function deleteCourse(id) {
  await Promise.all([
    supabase.from('courses').delete().eq('id', id),
    supabase.from('assignments').delete().eq('course_id', id),
  ])
}

// ── Assignments ──────────────────────────────────────────────────────────────

export async function insertAssignment(assignment) {
  const userId = await uid()
  await supabase.from('assignments').insert({
    id: assignment.id,
    course_id: assignment.courseId,
    title: assignment.title,
    due_date: assignment.dueDate,
    type: assignment.type,
    completed: assignment.completed,
    user_id: userId,
  })
}

export async function updateAssignment(id, updates) {
  await supabase.from('assignments').update({ completed: updates.completed }).eq('id', id)
}

export async function deleteAssignment(id) {
  await supabase.from('assignments').delete().eq('id', id)
}

// ── Content Items ─────────────────────────────────────────────────────────────

export async function insertContentItem(item) {
  const userId = await uid()
  await supabase.from('content_items').insert({ id: item.id, platform: item.platform, name: item.name, user_id: userId })
}

export async function deleteContentItem(id) {
  const userId = await uid()
  await Promise.all([
    supabase.from('content_items').delete().eq('id', id),
    supabase.from('completions').delete().eq('item_id', id).eq('user_id', userId),
  ])
}

// ── Content Tasks ─────────────────────────────────────────────────────────────

export async function insertContentTask(task) {
  const userId = await uid()
  await supabase.from('content_tasks').insert({ id: task.id, platform: task.platform, name: task.name, count: task.count, user_id: userId })
}

export async function deleteContentTask(id) {
  const userId = await uid()
  await Promise.all([
    supabase.from('content_tasks').delete().eq('id', id),
    supabase.from('completions').delete().like('item_id', `${id}-%`).eq('user_id', userId),
  ])
}

// ── Completions ───────────────────────────────────────────────────────────────

export async function toggleCompletion(id, date, isCompleting) {
  const userId = await uid()
  if (isCompleting) {
    await supabase.from('completions').insert({ item_id: id, date, user_id: userId })
  } else {
    await supabase.from('completions').delete().eq('item_id', id).eq('date', date).eq('user_id', userId)
  }
}
