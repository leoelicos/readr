import { SignJWT, jwtVerify } from 'jose';
import type { Request } from 'express';

export interface TokenUser {
  _id: string;
  username: string;
  email: string;
}

export interface Auth {
  sign(user: { _id: { toString(): string }; username: string; email: string }): Promise<string>;
  /** Returns the user encoded in a Bearer token, or null if missing/invalid/expired. */
  userFromRequest(req: Request): Promise<TokenUser | null>;
}

const ISSUER = 'readr';

export function createAuth(secret: string, ttl: string): Auth {
  const key = new TextEncoder().encode(secret);

  return {
    async sign({ _id, username, email }) {
      return new SignJWT({ data: { _id: String(_id), username, email } })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuer(ISSUER)
        .setIssuedAt()
        .setExpirationTime(ttl)
        .sign(key);
    },

    async userFromRequest(req) {
      const header = req.headers.authorization ?? '';
      const [scheme, token] = header.split(' ');
      if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
      try {
        const { payload } = await jwtVerify<{ data: TokenUser }>(token, key, {
          issuer: ISSUER,
          algorithms: ['HS256'],
        });
        return payload.data ?? null;
      } catch {
        return null;
      }
    },
  };
}
