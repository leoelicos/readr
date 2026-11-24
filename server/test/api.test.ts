import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.ts';
import { connectDb, disconnectDb } from '../src/db.ts';
import { loadEnv } from '../src/env.ts';

let mongo: MongoMemoryServer;
let app: Awaited<ReturnType<typeof createApp>>['app'];

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const env = loadEnv({ NODE_ENV: 'test', MONGODB_URI: mongo.getUri() });
  await connectDb(env.MONGODB_URI);
  ({ app } = await createApp(env));
});

afterAll(async () => {
  await disconnectDb();
  await mongo?.stop();
});

const gql = (query: string, variables?: object, token?: string) => {
  const req = request(app).post('/graphql').set('Content-Type', 'application/json');
  if (token) req.set('Authorization', `Bearer ${token}`);
  return req.send({ query, variables });
};

const SIGNUP = `mutation($u: String!, $e: String!, $p: String!) {
  addUser(username: $u, email: $e, password: $p) { token user { _id username email bookCount } }
}`;
const LOGIN = `mutation($e: String!, $p: String!) { login(email: $e, password: $p) { token user { username } } }`;
const ME = `{ me { username bookCount savedBooks { bookId title authors link } } }`;
const SAVE = `mutation($input: BookInput!) { saveBook(input: $input) { bookCount savedBooks { bookId } } }`;
const REMOVE = `mutation($id: String!) { removeBook(bookId: $id) { bookCount } }`;

const book = {
  bookId: 'abc123',
  title: 'The Left Hand of Darkness',
  authors: ['Ursula K. Le Guin'],
  description: 'A classic.',
  image: 'https://books.google.com/books/content?id=abc123',
  link: 'https://books.google.com/books?id=abc123',
};

describe('Readr GraphQL API', () => {
  let token = '';

  it('reports health', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('signs up a user and never exposes the password field', async () => {
    const res = await gql(SIGNUP, { u: 'leo', e: 'Leo@Example.com', p: 'correct horse battery' });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.addUser.user).toMatchObject({
      username: 'leo',
      email: 'leo@example.com',
      bookCount: 0,
    });
    token = res.body.data.addUser.token;
    expect(token).toMatch(/^ey/);

    const leak = await gql(`{ me { password } }`, undefined, token);
    expect(leak.body.errors?.[0]?.message).toMatch(/Cannot query field "password"/);
  });

  it('rejects duplicate emails with a friendly BAD_USER_INPUT error', async () => {
    const res = await gql(SIGNUP, { u: 'leo2', e: 'leo@example.com', p: 'another password' });
    expect(res.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
    expect(res.body.errors[0].message).toMatch(/already registered/);
  });

  it('validates short passwords', async () => {
    const res = await gql(SIGNUP, { u: 'sam', e: 'sam@example.com', p: 'short' });
    expect(res.body.errors[0].message).toMatch(/at least 8/);
  });

  it('logs in case-insensitively and rejects bad passwords generically', async () => {
    const ok = await gql(LOGIN, { e: 'LEO@example.com', p: 'correct horse battery' });
    expect(ok.body.data.login.user.username).toBe('leo');

    const bad = await gql(LOGIN, { e: 'leo@example.com', p: 'nope nope nope' });
    expect(bad.body.errors[0].message).toBe('Incorrect email or password.');
    const missing = await gql(LOGIN, { e: 'ghost@example.com', p: 'nope nope nope' });
    expect(missing.body.errors[0].message).toBe('Incorrect email or password.');
  });

  it('requires auth for me', async () => {
    const res = await gql(ME);
    expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
    const forged = await gql(ME, undefined, 'not-a-real-token');
    expect(forged.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
  });

  it('saves a book once, even when saved twice', async () => {
    await gql(SAVE, { input: book }, token);
    const res = await gql(SAVE, { input: { ...book, description: 'changed' } }, token);
    expect(res.body.data.saveBook.bookCount).toBe(1);

    const me = await gql(ME, undefined, token);
    expect(me.body.data.me.savedBooks[0]).toMatchObject({ bookId: 'abc123', link: book.link });
  });

  it('rejects non-http image URLs', async () => {
    const res = await gql(
      SAVE,
      { input: { ...book, bookId: 'x', image: 'javascript:alert(1)' } },
      token,
    );
    expect(res.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
  });

  it('removes a book', async () => {
    const res = await gql(REMOVE, { id: 'abc123' }, token);
    expect(res.body.data.removeBook.bookCount).toBe(0);
  });
});

describe('env', () => {
  it('refuses to boot in production without a strong JWT_SECRET', () => {
    const exit = process.exit;
    let code: number | undefined;
    process.exit = ((c?: number) => {
      code = c;
      throw new Error('exit');
    }) as typeof process.exit;
    try {
      expect(() => loadEnv({ NODE_ENV: 'production', JWT_SECRET: 'short' })).toThrow('exit');
      expect(code).toBe(1);
    } finally {
      process.exit = exit;
    }
  });
});
