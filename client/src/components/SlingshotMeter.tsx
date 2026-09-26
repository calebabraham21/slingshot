/** Centered stone silhouettes (viewBox 0 0 40 40). */
const ROCK_PATHS = [
  'M20 6.5c4.2.2 8.2 2.4 10.2 6.1 1.9 3.5 1.6 7.8-.6 11.1-2.3 3.4-6.2 5.4-10.2 5.3-4.1-.1-8.1-2.3-10-5.9-1.8-3.4-1.4-7.6.9-10.8C12.6 8.2 16.4 6.3 20 6.5z',
  'M20 5.8c4.6.4 8.6 3.1 10.4 7.1 1.7 3.8.9 8.3-1.8 11.4-2.6 3-6.8 4.6-10.8 4.2-4.1-.4-7.8-3.1-9.5-6.9-1.6-3.6-.8-7.9 1.9-10.9 2.8-3.1 6.6-5.1 9.8-4.9z',
  'M19.8 6.2c4.8-.2 9.1 2.6 11 6.8 1.8 3.9.9 8.5-1.9 11.6-2.7 3-7 4.5-11 4.1-4-.4-7.6-3.2-9.3-6.9-1.6-3.5-.7-7.7 2-10.7 2.6-2.9 6.1-4.7 9.2-4.9z',
  'M20.2 5.5c4.4.1 8.5 2.8 10.5 6.6 2 3.7 1.5 8.2-.9 11.5-2.4 3.3-6.5 5.2-10.6 5-4.2-.2-8.1-2.6-10.1-6.3-1.9-3.5-1.4-7.8 1-11 2.5-3.3 6.4-5.6 10.1-5.8z',
  'M20 6c4.5-.3 8.8 2.2 11 6.1 2.1 3.7 1.6 8.3-.9 11.6-2.5 3.3-6.7 5.1-10.8 4.9-4.2-.2-8.2-2.5-10.3-6.2-2-3.5-1.5-7.9.9-11.1C12.3 7.8 16.2 5.7 20 6z',
  'M20.1 5.2c4.7.2 9 3 11.1 7.1 2 3.9 1.2 8.7-1.7 12-2.8 3.2-7.2 4.8-11.4 4.4-4.3-.4-8.2-3.3-10.1-7.3-1.8-3.8-.9-8.4 2-11.5 2.9-3.1 7-4.9 10.1-4.7z',
]

/** Small → large across the card (horizontal cone). */
const ROCK_SIZES = [12, 16, 20, 26, 32, 38]

function RockSvg({
  path,
  size,
  active,
  hot,
}: {
  path: string
  size: number
  active: boolean
  hot: boolean
}) {
  const fill = !active
    ? 'var(--rock-idle)'
    : hot
      ? 'var(--rock-hot)'
      : 'var(--rock-active)'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      className="block transition-colors duration-500"
    >
      <path d={path} fill={fill} />
      <ellipse
        cx="15.5"
        cy="14"
        rx="5"
        ry="3.2"
        fill={active ? 'var(--rock-shine)' : 'var(--rock-shine-idle)'}
        transform="rotate(-28 15.5 14)"
      />
    </svg>
  )
}

interface SlingshotMeterProps {
  value: number
}

/**
 * Full-width slingshot meter: small → large rocks on one straight center line.
 */
export function SlingshotMeter({ value }: SlingshotMeterProps) {
  const fill = Math.min(100, Math.max(0, Math.round(value)))
  const lit = Math.min(
    ROCK_SIZES.length,
    Math.max(0, Math.ceil((fill / 100) * ROCK_SIZES.length)),
  )
  const hot = fill >= 75

  return (
    <div className="mt-3 min-w-0">
      <div className="mb-1.5 text-xs text-zinc-500">Slingshot meter</div>
      <div
        className="grid w-full min-w-0 grid-cols-6 items-center"
        role="meter"
        aria-label="Slingshot meter"
        aria-valuenow={fill}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {ROCK_SIZES.map((size, i) => (
          <div key={i} className="flex min-w-0 items-center justify-center">
            <RockSvg
              path={ROCK_PATHS[i]!}
              size={size}
              active={i < lit}
              hot={hot && i < lit}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
