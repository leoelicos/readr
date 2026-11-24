import { useApolloClient } from '@apollo/client/react';
import {
  createContext,
  use,
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { TokenProfile } from './jwt';
import { session } from './session';

export type AuthTab = 'login' | 'signup';

interface AuthContextValue {
  token: string | null;
  profile: TokenProfile | null;
  signIn(token: string): Promise<void>;
  signOut(): Promise<void>;
  /** Opens the sign-in dialog, optionally on a tab, with a reason shown to the user. */
  openAuth(tab?: AuthTab, reason?: string): void;
  closeAuth(): void;
  /** `session` changes each time the dialog opens, so forms start fresh. */
  dialog: { open: boolean; tab: AuthTab; reason?: string; session: number };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useApolloClient();
  const token = useSyncExternalStore(session.subscribe, session.getToken, () => null);
  const [dialog, setDialog] = useState<AuthContextValue['dialog']>({
    open: false,
    tab: 'login',
    session: 0,
  });

  const signIn = useCallback(
    async (next: string) => {
      session.set(next);
      await client.resetStore();
    },
    [client],
  );

  const signOut = useCallback(async () => {
    session.set(null);
    await client.clearStore();
  }, [client]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      profile: session.getProfile(token),
      signIn,
      signOut,
      dialog,
      openAuth: (tab = 'login', reason) =>
        setDialog((d) => ({
          open: true,
          tab,
          reason,
          session: d.open ? d.session : d.session + 1,
        })),
      closeAuth: () => setDialog((d) => ({ ...d, open: false })),
    }),
    [token, signIn, signOut, dialog],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
