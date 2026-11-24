import { useId, useState, type InputHTMLAttributes } from 'react';
import { Icon } from './Icon';

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  name: string;
  hint?: string;
  error?: string;
}

/** Labelled input with hint + inline error wired up via aria-describedby / aria-invalid. */
export function Field({ label, hint, error, type = 'text', ...input }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const [reveal, setReveal] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="field" data-invalid={error ? '' : undefined}>
      <label htmlFor={id}>{label}</label>
      {hint ? (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      <div className="field-control">
        <input
          id={id}
          type={isPassword && reveal ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          {...input}
        />
        {isPassword ? (
          <button
            type="button"
            className="icon-btn field-reveal"
            aria-pressed={reveal}
            aria-label="Show password"
            onClick={() => setReveal((r) => !r)}
          >
            <Icon name={reveal ? 'eyeOff' : 'eye'} />
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="field-error" id={errorId}>
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      ) : null}
    </div>
  );
}
