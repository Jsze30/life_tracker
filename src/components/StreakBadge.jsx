import { Flame } from 'lucide-react'
import { getStreakTier } from '../lib/streaks'

export default function StreakBadge({ current, best }) {
  const { tier, label, flames } = getStreakTier(current)
  const isPersonalBest = current > 0 && current === best

  if (tier === 0) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-grid/20" />
        <span className="font-mono text-xs text-grid/40">0</span>
      </div>
    )
  }

  const colorMap = {
    1: 'text-coral/60',
    2: 'text-coral',
    3: 'text-forest',
    4: 'text-forest',
    5: 'text-forest',
  }

  const sizeMap = {
    1: 14,
    2: 16,
    3: 18,
    4: 18,
    5: 20,
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className={`flex items-center ${tier >= 5 ? 'animate-streak-pulse' : ''}`}>
        {Array.from({ length: flames }).map((_, i) => (
          <Flame
            key={i}
            size={sizeMap[tier]}
            className={`${colorMap[tier]} ${i > 0 ? '-ml-1.5' : ''}`}
            strokeWidth={1.5}
            fill="currentColor"
          />
        ))}
      </div>
      <span className="font-mono text-sm font-bold text-grid">{current}</span>
      {isPersonalBest && (
        <span className="inline-flex items-center px-1.5 py-0.5 bg-gold/20 text-gold font-mono text-[9px] uppercase tracking-[0.1em] font-bold animate-streak-pulse">
          PB!
        </span>
      )}
    </div>
  )
}
