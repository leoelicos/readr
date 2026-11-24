export interface TokenProfile {
  _id: string;
  username: string;
  email: string;
}

interface Payload {
  data?: TokenProfile;
  exp?: number;
}

/** Reads (does not verify) a JWT payload. Verification happens on the server. */
export function decodeToken(token: string): Payload | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = new TextDecoder().decode(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)));
    return JSON.parse(json) as Payload;
  } catch {
    return null;
  }
}

export function isExpired(payload: Payload | null, now = Date.now()): boolean {
  return !payload?.exp || payload.exp * 1000 <= now;
}
