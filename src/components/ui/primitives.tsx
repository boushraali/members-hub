import { forwardRef, useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { LoaderCircle } from 'lucide-react'

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

type Variant = 'primary' | 'teal' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-bg hover:bg-navy-mid dark:bg-teal-strong dark:text-[#061826] dark:hover:bg-teal',
  teal: 'bg-teal-strong text-white hover:brightness-110 dark:text-[#061826]',
  outline: 'border-[1.5px] border-line-strong text-ink bg-surface hover:border-teal-strong hover:text-teal-strong',
  ghost: 'text-ink-2 hover:bg-surface-2 hover:text-ink',
  danger: 'bg-danger text-white hover:brightness-110 dark:text-[#061826]',
}
const sizes: Record<Size, string> = {
  sm: 'min-h-9 px-3 text-[13px] rounded-[10px] gap-1.5',
  md: 'min-h-11 px-5 text-sm rounded-xl gap-2',
  lg: 'min-h-12 px-7 text-[15px] rounded-xl gap-2',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex items-center justify-center font-extrabold transition duration-200 select-none',
        'disabled:opacity-55 disabled:cursor-not-allowed active:translate-y-px',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  )
})

type Tone = 'neutral' | 'teal' | 'sky' | 'ok' | 'warn' | 'danger' | 'info'
const tones: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-ink-2 border-line',
  teal: 'bg-teal-light text-teal-strong border-transparent',
  sky: 'bg-info-bg text-sky-strong border-transparent',
  ok: 'bg-ok-bg text-ok border-transparent',
  warn: 'bg-warn-bg text-warn border-transparent',
  danger: 'bg-danger-bg text-danger border-transparent',
  info: 'bg-info-bg text-info border-transparent',
}

export function Badge({ tone = 'neutral', icon, children, className }: { tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold leading-5 whitespace-nowrap', tones[tone], className)}>
      {icon}
      {children}
    </span>
  )
}

export function Card({ children, className, as: As = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'section' | 'article' }) {
  return <As className={cx('rounded-[18px] border border-line bg-surface shadow-card', className)}>{children}</As>
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx('skeleton rounded-lg', className)} />
}

interface FieldProps {
  label: string
  hint?: ReactNode
  error?: string
  required?: boolean
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode
  className?: string
  counter?: ReactNode
}

export function Field({ label, hint, error, required, children, className, counter }: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errId = `${id}-err`
  const describedBy = [hint ? hintId : null, error ? errId : null].filter(Boolean).join(' ') || undefined
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-bold text-ink">
          {label}
          {required && <span className="text-danger ms-0.5" aria-hidden>*</span>}
          {required && <span className="sr-only"> (مطلوب)</span>}
        </label>
        {counter}
      </div>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} role="alert" className="text-xs font-bold text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

const control =
  'w-full rounded-xl border-[1.5px] border-line bg-surface px-3.5 text-sm text-ink placeholder:text-muted/80 transition focus:border-teal-strong focus:outline-none focus-visible:outline-none focus:ring-3 focus:ring-teal/25 aria-[invalid=true]:border-danger disabled:opacity-60'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cx(control, 'min-h-11', className)} {...rest} />
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cx(control, 'py-2.5 leading-7 resize-y', className)} {...rest} />
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...rest }, ref) {
  return (
    <select ref={ref} className={cx(control, 'min-h-11 cursor-pointer appearance-none bg-no-repeat pe-3.5 ps-9', className)} style={{ backgroundImage: chevron, backgroundPosition: 'left 0.75rem center', backgroundSize: '1rem' }} {...rest}>
      {children}
    </select>
  )
})

const chevron = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235a6b80' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: ReactNode
  disabled?: boolean
}) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-bold text-ink cursor-pointer">
          {label}
        </label>
        {description && (
          <p id={`${id}-d`} className="text-xs text-muted mt-0.5">
            {description}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-d` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-50',
          checked ? 'bg-teal-strong' : 'bg-line-strong',
        )}
      >
        <span className={cx('inline-block size-5 rounded-full bg-white shadow transition-transform', checked ? '-translate-x-6' : '-translate-x-1')} />
      </button>
    </div>
  )
}

/** وسم قابل للتحديد (يُستخدم لاختيار التخصصات والاهتمامات) */
export function ChoiceChip({ selected, onToggle, children, disabled, count }: { selected: boolean; onToggle: () => void; children: ReactNode; disabled?: boolean; count?: number }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled && !selected}
      onClick={onToggle}
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1.5 text-[13px] font-bold transition',
        selected ? 'border-teal-strong bg-teal-light text-teal-strong' : 'border-line bg-surface text-ink-2 hover:border-line-strong',
        'disabled:opacity-45 disabled:cursor-not-allowed',
      )}
    >
      {selected && <span aria-hidden>✓</span>}
      {children}
      {count !== undefined && <span className="text-[11px] font-semibold text-muted">({count})</span>}
    </button>
  )
}

export function SectionTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <span className="mb-1 inline-block text-[13px] font-extrabold tracking-wide text-teal-strong">{eyebrow}</span>}
        <h2 className="text-xl font-extrabold text-ink md:text-2xl">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}
