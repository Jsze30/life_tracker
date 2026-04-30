import { format, isAfter, isBefore, addDays, differenceInDays } from 'date-fns'

export function today() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function formatDate(dateStr) {
  const date = new Date(dateStr + 'T12:00:00')
  return format(date, 'MMM d, yyyy')
}

export function formatShortDate(dateStr) {
  const date = new Date(dateStr + 'T12:00:00')
  return format(date, 'MMM d')
}

export function isOverdue(dateStr, todayStr) {
  return isBefore(new Date(dateStr + 'T12:00:00'), new Date(todayStr + 'T12:00:00'))
}

export function isDueSoon(dateStr, todayStr, days = 3) {
  const due = new Date(dateStr + 'T12:00:00')
  const todayDate = new Date(todayStr + 'T12:00:00')
  const limit = addDays(todayDate, days)
  return !isBefore(due, todayDate) && !isAfter(due, limit)
}

export function daysUntil(dateStr, todayStr) {
  return differenceInDays(new Date(dateStr + 'T12:00:00'), new Date(todayStr + 'T12:00:00'))
}

export const CONTENT_PLATFORMS = [
  { id: 'content-x', name: 'X' },
  { id: 'content-instagram', name: 'Instagram' },
]
