import { describe, expect, it } from 'vitest';
import { decodeToken, isExpired } from './jwt';

const encode = (payload: object) =>
  `x.${btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}.y`;

describe('jwt', () => {
  it('decodes unicode payloads', () => {
    const token = encode({ data: { _id: '1', username: 'Zoë', email: 'z@e.com' }, exp: 1 });
    // btoa can't take raw unicode; build it via TextEncoder like a real JWT
    const bytes = new TextEncoder().encode(JSON.stringify({ data: { username: 'Zoë' } }));
    const real = `x.${btoa(String.fromCharCode(...bytes))}.y`;
    expect(decodeToken(token)?.data?._id).toBe('1');
    expect(decodeToken(real)?.data?.username).toBe('Zoë');
  });

  it('treats garbage as invalid and expired', () => {
    expect(decodeToken('nope')).toBeNull();
    expect(isExpired(null)).toBe(true);
  });

  it('checks expiry', () => {
    const now = Date.now();
    expect(isExpired({ exp: now / 1000 + 60 }, now)).toBe(false);
    expect(isExpired({ exp: now / 1000 - 1 }, now)).toBe(true);
  });
});
