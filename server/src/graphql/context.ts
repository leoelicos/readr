import type { Auth, TokenUser } from '../auth.ts';

export interface Context {
  user: TokenUser | null;
  auth: Auth;
}
