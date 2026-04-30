import { subDays, format } from 'date-fns'

/**
 * Calculate current and best streak from an array of ISO date strings.
 * Dates should be sorted ascending.
 */
export function calculateStreak(dates, today) {
  if (!dates || dates.length === 0) {
    return { current: 0, best: 0 }
  }

  const sorted = [...dates].sort()

  // Current streak: walk backward from today (or yesterday if today not done)
  let current = 0
  let checkDate = today

  if (sorted.includes(checkDate)) {
    current = 1
    checkDate = format(subDays(new Date(checkDate + 'T12:00:00'), 1), 'yyyy-MM-dd')
  } else {
    // Check if yesterday was done (streak is still alive but not yet done today)
    checkDate = format(subDays(new Date(today + 'T12:00:00'), 1), 'yyyy-MM-dd')
    if (!sorted.includes(checkDate)) {
      // No completion today or yesterday — streak is broken
      return { current: 0, best: findBestStreak(sorted) }
    }
  }

  while (sorted.includes(checkDate)) {
    current++
    checkDate = format(subDays(new Date(checkDate + 'T12:00:00'), 1), 'yyyy-MM-dd')
  }

  const best = Math.max(current, findBestStreak(sorted))

  return { current, best }
}

function findBestStreak(sortedDates) {
  if (sortedDates.length === 0) return 0

  let best = 1
  let run = 1

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1] + 'T12:00:00')
    const curr = new Date(sortedDates[i] + 'T12:00:00')
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      run++
      best = Math.max(best, run)
    } else if (diffDays > 1) {
      run = 1
    }
    // diffDays === 0 means duplicate date, skip
  }

  return best
}

/**
 * Get the streak tier info for visual display
 */
export function getStreakTier(streak) {
  if (streak === 0) return { tier: 0, label: '', flames: 0 }
  if (streak <= 2) return { tier: 1, label: 'Getting started', flames: 1 }
  if (streak <= 6) return { tier: 2, label: 'On fire', flames: 1 }
  if (streak <= 13) return { tier: 3, label: 'One week+', flames: 1 }
  if (streak <= 29) return { tier: 4, label: 'Unstoppable', flames: 2 }
  return { tier: 5, label: 'Legendary', flames: 3 }
}
