type SegmentedToggleOption<T extends string> = {
  value: T
  label: string
}

type SegmentedToggleProps<T extends string> = {
  label: string
  value: T
  options: SegmentedToggleOption<T>[]
  onChange: (value: T) => void
  disabled?: boolean
}

export function SegmentedToggle<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: SegmentedToggleProps<T>) {
  const groupId = label.replace(/\s+/g, '-').toLowerCase()

  return (
    <div>
      <span id={`${groupId}-label`} className="block text-sm font-medium text-ink-700 mb-2">
        {label}
      </span>
      <div
        className="inline-flex w-full max-w-md rounded-xl border border-ink-200 bg-ink-100 p-1 sm:w-auto"
        role="radiogroup"
        aria-labelledby={`${groupId}-label`}
      >
        {options.map((option) => {
          const selected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors sm:flex-none sm:min-w-[7.5rem] ${
                selected
                  ? 'bg-surface text-ink-900 shadow-sm ring-1 ring-ink-200'
                  : 'text-ink-500 hover:text-ink-900'
              } disabled:opacity-40`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
