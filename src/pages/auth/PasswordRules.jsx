import { Check, Circle } from 'lucide-react'
import { cx } from '../../lib/utils.js'

// Mirrors the API's password policy so people see what is missing before submitting
const PASSWORD_RULES = [
  { key: 'length', label: 'At least 10 characters', test: (p) => p.length >= 10 },
  { key: 'lower', label: 'A lowercase letter', test: (p) => /[a-z]/.test(p) },
  { key: 'upper', label: 'An uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { key: 'number', label: 'A number', test: (p) => /\d/.test(p) },
]

export const meetsPolicy = (p) => PASSWORD_RULES.every((r) => r.test(p))

export default function PasswordRules({ password }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5" aria-label="Password requirements">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(password)
        return (
          <li key={r.key} className={cx('flex items-center gap-1.5 text-[12px]', ok ? 'text-success' : 'text-ink-muted')}>
            {ok ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3 w-3" />}
            <span>
              {r.label}
              <span className="sr-only">{ok ? ' (met)' : ' (not met)'}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
