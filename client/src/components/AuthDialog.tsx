import { useMutation } from '@apollo/client/react';
import { useActionState, useEffect, useId, useRef, type KeyboardEvent } from 'react';
import { useFormStatus } from 'react-dom';
import { useAuth, type AuthTab } from '../lib/auth';
import { ADD_USER, LOGIN } from '../lib/graphql';
import { errorMessage } from '../lib/hooks';
import { useToast } from '../lib/toast';
import { Field } from './Field';
import { Icon } from './Icon';

type Values = Record<string, string>;
interface FormState {
  values: Values;
  errors: Values;
  formError?: string;
  /** Bumps on every failed submit so focus can move to the first problem. */
  attempt: number;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const initial: FormState = { values: {}, errors: {}, attempt: 0 };

function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn btn-primary btn-block"
      aria-disabled={pending || undefined}
    >
      {pending ? <span className="spinner" aria-hidden="true" /> : null}
      {pending ? 'Please wait…' : children}
    </button>
  );
}

function useFocusFirstError(state: FormState, formRef: React.RefObject<HTMLFormElement | null>) {
  useEffect(() => {
    if (!state.attempt) return;
    const target =
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
      formRef.current?.querySelector<HTMLElement>('.form-error');
    target?.focus();
  }, [state.attempt, formRef]);
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="form-error" role="alert" tabIndex={-1}>
      {message}
    </p>
  );
}

function LoginForm({ onDone }: { onDone: (username: string) => void }) {
  const [login] = useMutation(LOGIN);
  const { signIn } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);

  const [state, action] = useActionState<FormState, FormData>(async (prev, form) => {
    const values = { email: String(form.get('email') ?? '').trim() };
    const password = String(form.get('password') ?? '');
    const errors: Values = {};
    if (!EMAIL.test(values.email))
      errors.email = 'Enter your email address, like name@example.com.';
    if (!password) errors.password = 'Enter your password.';
    if (Object.keys(errors).length) return { values, errors, attempt: prev.attempt + 1 };
    try {
      const { data } = await login({ variables: { email: values.email, password } });
      if (!data) throw new Error('No response');
      await signIn(data.login.token);
      onDone(data.login.user.username);
      return initial;
    } catch (err) {
      return { values, errors: {}, formError: errorMessage(err), attempt: prev.attempt + 1 };
    }
  }, initial);

  useFocusFirstError(state, formRef);

  return (
    <form ref={formRef} action={action} noValidate className="stack">
      <FormError message={state.formError} />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        spellCheck={false}
        defaultValue={state.values.email}
        error={state.errors.email}
        required
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        error={state.errors.password}
        required
      />
      <SubmitButton>Sign in</SubmitButton>
    </form>
  );
}

function SignupForm({ onDone }: { onDone: (username: string) => void }) {
  const [addUser] = useMutation(ADD_USER);
  const { signIn } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);

  const [state, action] = useActionState<FormState, FormData>(async (prev, form) => {
    const values = {
      username: String(form.get('username') ?? '').trim(),
      email: String(form.get('email') ?? '').trim(),
    };
    const password = String(form.get('password') ?? '');
    const errors: Values = {};
    if (values.username.length < 2) errors.username = 'Choose a username of at least 2 characters.';
    if (!EMAIL.test(values.email))
      errors.email = 'Enter your email address, like name@example.com.';
    if (password.length < 8) errors.password = 'Use at least 8 characters for your password.';
    if (Object.keys(errors).length) return { values, errors, attempt: prev.attempt + 1 };
    try {
      const { data } = await addUser({ variables: { ...values, password } });
      if (!data) throw new Error('No response');
      await signIn(data.addUser.token);
      onDone(data.addUser.user.username);
      return initial;
    } catch (err) {
      return { values, errors: {}, formError: errorMessage(err), attempt: prev.attempt + 1 };
    }
  }, initial);

  useFocusFirstError(state, formRef);

  return (
    <form ref={formRef} action={action} noValidate className="stack">
      <FormError message={state.formError} />
      <Field
        label="Username"
        name="username"
        autoComplete="username"
        spellCheck={false}
        defaultValue={state.values.username}
        error={state.errors.username}
        required
      />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        spellCheck={false}
        defaultValue={state.values.email}
        error={state.errors.email}
        required
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters. Password managers welcome."
        error={state.errors.password}
        required
      />
      <SubmitButton>Create account</SubmitButton>
    </form>
  );
}

const TABS: { id: AuthTab; label: string }[] = [
  { id: 'login', label: 'Sign in' },
  { id: 'signup', label: 'Create account' },
];

export function AuthDialog() {
  const { dialog, openAuth, closeAuth } = useAuth();
  const { notify } = useToast();
  const ref = useRef<HTMLDialogElement>(null);
  const tabRefs = useRef<Record<AuthTab, HTMLButtonElement | null>>({ login: null, signup: null });
  const id = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (dialog.open && !el.open) {
      el.showModal();
      // Start in the first field rather than on the close button.
      el.querySelector<HTMLInputElement>('[role="tabpanel"]:not([hidden]) input')?.focus();
    }
    if (!dialog.open && el.open) el.close();
  }, [dialog.open]);

  const select = (tab: AuthTab) => {
    openAuth(tab, dialog.reason);
    tabRefs.current[tab]?.focus();
  };

  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = TABS.findIndex((t) => t.id === dialog.tab);
    const keys: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1 + TABS.length,
      Home: 0,
      End: TABS.length - 1,
    };
    const next = keys[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(TABS[next % TABS.length]!.id);
  };

  const done = (username: string) => {
    closeAuth();
    notify({ message: `Welcome, ${username}. Your shelf is ready.`, tone: 'success' });
  };

  return (
    <dialog
      ref={ref}
      className="auth-dialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={dialog.reason ? `${id}-reason` : undefined}
      onClose={closeAuth}
      {...{ closedby: 'any' }}
    >
      <div className="auth-card">
        <div className="auth-head">
          <h2 id={`${id}-title`}>Your reading life, saved.</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={closeAuth}>
            <Icon name="close" />
          </button>
        </div>
        {dialog.reason ? (
          <p className="auth-reason" id={`${id}-reason`}>
            {dialog.reason}
          </p>
        ) : null}

        <div role="tablist" aria-label="Account" className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${tab.id}`}
              aria-selected={dialog.tab === tab.id}
              aria-controls={`${id}-panel-${tab.id}`}
              tabIndex={dialog.tab === tab.id ? 0 : -1}
              onClick={() => select(tab.id)}
              onKeyDown={onTabKey}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {TABS.map((tab) => (
          <div
            key={`${tab.id}-${dialog.session}`}
            role="tabpanel"
            id={`${id}-panel-${tab.id}`}
            aria-labelledby={`${id}-tab-${tab.id}`}
            hidden={dialog.tab !== tab.id}
          >
            {tab.id === 'login' ? <LoginForm onDone={done} /> : <SignupForm onDone={done} />}
          </div>
        ))}
      </div>
    </dialog>
  );
}
