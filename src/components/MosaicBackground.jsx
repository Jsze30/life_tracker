export default function MosaicBackground() {
  const blocks = [
    ['0', '0', '160', '140'],
    ['160', '0', '240', '80'],
    ['160', '80', '120', '120'],
    ['280', '80', '120', '60'],
    ['280', '140', '120', '60'],
    ['0', '140', '80', '160'],
    ['80', '140', '80', '80'],
    ['80', '220', '200', '80'],
    ['160', '200', '120', '20'],
    ['280', '200', '120', '100'],
  ]

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="mosaic" x="0" y="0" width="400" height="300" patternUnits="userSpaceOnUse">
            {blocks.map(([x, y, width, height]) => (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width={width}
                height={height}
                fill="var(--color-paper)"
                stroke="var(--color-grid)"
                strokeOpacity="0.08"
                strokeWidth="0.5"
              />
            ))}
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mosaic)" />
      </svg>
    </div>
  )
}
