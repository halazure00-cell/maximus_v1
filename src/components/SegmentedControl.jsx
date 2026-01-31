const SegmentedControl = ({ options, value, onChange, size = 'md' }) => {
  const sizes = {
    sm: 'min-h-[36px] text-[12px]',
    md: 'min-h-[40px] text-sm',
  }
  const buttonSize = sizes[size] || sizes.md

  return (
    <div className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 p-1">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`px-3 ${buttonSize} rounded-2xl font-semibold transition ${
              active
                ? 'bg-sunrise-400/90 text-night-950'
                : 'text-white/70 hover:bg-white/10'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export default SegmentedControl
