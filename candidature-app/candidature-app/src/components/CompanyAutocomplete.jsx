import { useMemo, useState } from 'react'
import { findCompanySuggestions } from '../lib/companySuggestions'

export default function CompanyAutocomplete({
  value,
  onChange,
  onSelect,
  onBlur,
  placeholder,
  className = '',
  autoFocus = false,
}) {
  const [focused, setFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const suggestions = useMemo(() => findCompanySuggestions(value), [value])
  const isOpen = focused && suggestions.length > 0

  const choose = company => {
    onChange(company.name)
    onSelect?.(company)
    setFocused(false)
    setActiveIndex(-1)
  }

  const handleKeyDown = event => {
    if (!isOpen) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex(index => (index + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex(index => index <= 0 ? suggestions.length - 1 : index - 1)
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault()
      choose(suggestions[activeIndex])
    } else if (event.key === 'Escape') {
      setFocused(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div className="relative">
      <input
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={event => {
          onChange(event.target.value)
          setFocused(true)
          setActiveIndex(-1)
        }}
        onFocus={() => setFocused(true)}
        onBlur={event => {
          setFocused(false)
          onBlur?.(event)
        }}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
      />
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
          <p className="border-b border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-disabled">
            Suggerimenti sul dispositivo
          </p>
          {suggestions.map((company, index) => (
            <button
              key={company.name}
              type="button"
              onMouseDown={event => event.preventDefault()}
              onClick={() => choose(company)}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                activeIndex === index ? 'bg-purple/20 text-purple-soft' : 'text-txt active:bg-purple/10'
              }`}
            >
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-purple/15 font-bold text-purple-soft">
                {company.name.charAt(0)}
              </span>
              <span className="truncate font-semibold">{company.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
