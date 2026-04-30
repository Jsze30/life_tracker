import * as chrono from 'chrono-node'
import { format } from 'date-fns'

/**
 * Parse a natural language task string like "MP3 tuesday" or "Midterm next friday"
 * Returns { title, dueDate } where dueDate is ISO date string or null
 */
export function parseTask(input, referenceDate = new Date()) {
  const trimmed = input.trim()
  if (!trimmed) return { title: '', dueDate: null, type: 'assignment' }

  // Detect type keywords
  let type = 'assignment'
  let cleaned = trimmed
  const testPattern = /\b(test|exam|midterm|final|quiz)\b/i
  if (testPattern.test(cleaned)) {
    type = 'test'
  }

  // Handle "every X" pattern — treat as next occurrence
  const everyPattern = /\bevery\s+/i
  const forParsing = cleaned.replace(everyPattern, 'next ')

  // Parse date from the string
  const results = chrono.parse(forParsing, referenceDate, { forwardDate: true })

  let title = trimmed
  let dueDate = null

  if (results.length > 0) {
    const match = results[0]
    dueDate = format(match.start.date(), 'yyyy-MM-dd')

    // Remove the date text from the title
    const dateText = match.text
    // Find the original date text position in the input
    // We need to find it in the original input, not the cleaned version
    const lowerInput = trimmed.toLowerCase()
    const lowerDate = dateText.toLowerCase()

    // Try to find the date portion in the original text
    // Account for "every" prefix
    const everyMatch = trimmed.match(/\bevery\s+/i)
    if (everyMatch) {
      const everyStart = lowerInput.indexOf(everyMatch[0].toLowerCase())
      title = trimmed.slice(0, everyStart).trim()
    } else {
      const idx = lowerInput.indexOf(lowerDate)
      if (idx !== -1) {
        title = (trimmed.slice(0, idx) + trimmed.slice(idx + dateText.length)).trim()
      }
    }

    // Clean up trailing/leading punctuation and whitespace
    title = title.replace(/[-–—,;:]+$/, '').replace(/^[-–—,;:]+/, '').trim()
  }

  // If title is empty after extraction, use the full input
  if (!title) title = trimmed

  return { title, dueDate, type }
}
