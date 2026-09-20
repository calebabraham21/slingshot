interface DogMeterProps {
  value: number
  breedLabel: string
  breedBlurb: string
}

export function DogMeter({ value, breedLabel, breedBlurb }: DogMeterProps) {
  const fill = Math.round(value)

  return (
    <div className="mt-4 border-t border-zinc-800 pt-3">
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium text-zinc-300">
          Dog meter · {breedLabel}
        </span>
        <span className="text-zinc-500">{breedBlurb}</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-zinc-800"
        role="meter"
        aria-label="Dog meter"
        aria-valuenow={fill}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-zinc-300 transition-[width] duration-500"
          style={{ width: `${fill}%` }}
        />
      </div>
    </div>
  )
}
