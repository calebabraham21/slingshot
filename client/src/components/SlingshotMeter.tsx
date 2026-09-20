/** Irregular pebble path (viewBox 0 0 32 32). */
function RockSvg({
  size,
  active,
  hot,
}: {
  size: number
  active: boolean
  hot: boolean
}) {
  const fill = !active
    ? '#3f3f46'
    : hot
      ? '#c2410c'
      : '#a8a29e'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="shrink-0 transition-colors duration-500"
    >
      <path
        d="M9 7.5c3.2-2.8 8.4-3.4 12.2-1.2 3.1 1.8 5.2 5.1 4.9 8.7-.3 3.8-2.1 6.6-5.2 8.4-3.4 2-7.8 2.2-11.1.3C6.4 21.5 4.2 17.8 4.5 13.9c.3-3.2 2.2-4.9 4.5-6.4z"
        fill={fill}
      />
      <path
        d="M11.2 11.4c1.4-.9 3.2-1 4.5-.2.4.3.5.9.1 1.2-.9.7-2.2.7-3.2.1-.4-.3-.5-.8-.1-1.1z"
        fill={active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)'}
      />
    </svg>
  )
}

const ROCK_COUNT = 6
/** Small → large (cone / stone size). */
const ROCK_SIZES = [10, 13, 16, 20, 25, 31]

interface SlingshotMeterProps {
  value: number
}

/**
 * Slingshot meter as growing rocks (David stone size).
 * No numbers. Dark orange when the upset stone is fully loaded.
 */
export function SlingshotMeter({ value }: SlingshotMeterProps) {
  const fill = Math.min(100, Math.max(0, Math.round(value)))
  const lit = Math.min(
    ROCK_COUNT,
    Math.max(0, Math.ceil((fill / 100) * ROCK_COUNT)),
  )
  const hot = fill >= 75

  return (
    <div className="mt-3">
      <div className="mb-1.5 text-xs text-zinc-500">Slingshot</div>
      <div
        className="flex items-end gap-1.5 sm:gap-2"
        role="meter"
        aria-label="Slingshot meter"
        aria-valuenow={fill}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {ROCK_SIZES.map((size, i) => (
          <RockSvg
            key={i}
            size={size}
            active={i < lit}
            hot={hot && i < lit}
          />
        ))}
      </div>
    </div>
  )
}
