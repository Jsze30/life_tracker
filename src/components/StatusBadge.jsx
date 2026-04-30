export default function StatusBadge({ label, color = 'forest' }) {
  const colorMap = {
    forest: 'bg-forest text-white',
    coral: 'bg-coral text-white',
    gold: 'bg-gold text-forest',
    mint: 'bg-mint text-forest',
    ghost: 'border border-grid/20 text-grid',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] rounded-sm ${colorMap[color] || colorMap.ghost}`}
    >
      {label}
    </span>
  )
}
