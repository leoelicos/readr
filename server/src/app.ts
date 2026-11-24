import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled';
import { expressMiddleware } from '@as-integrations/express5';
import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import type { Server } from 'node:http';
import { createAuth } from './auth.ts';
import type { Env } from './env.ts';
import type { Context } from './graphql/context.ts';
import { resolvers } from './graphql/resolvers.ts';
import { typeDefs } from './graphql/typeDefs.ts';

const clientDist = fileURLToPath(new URL('../../client/dist', import.meta.url));

/** Builds the Express app. Kept separate from listen() so tests can drive it with supertest. */
export async function createApp(env: Env, httpServer?: Server) {
  const isProd = env.NODE_ENV === 'production';
  const auth = createAuth(env.JWT_SECRET, env.JWT_TTL);

  const apollo = new ApolloServer<Context>({
    typeDefs,
    resolvers,
    introspection: !isProd,
    plugins: [
      ...(httpServer ? [ApolloServerPluginDrainHttpServer({ httpServer })] : []),
      ...(isProd ? [ApolloServerPluginLandingPageDisabled()] : []),
    ],
  });
  await apollo.start();

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: isProd
        ? {
            directives: {
              'img-src': [
                "'self'",
                'data:',
                'https://books.google.com',
                'https://*.googleusercontent.com',
              ],
              'connect-src': ["'self'", 'https://www.googleapis.com'],
            },
          }
        : false, // Apollo Sandbox needs inline scripts in development
    }),
  );

  app.get('/healthz', (_req, res) => {
    res.json({ ok: true });
  });

  app.use(
    '/graphql',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 600,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
    }),
    cors<cors.CorsRequest>({ origin: env.CORS_ORIGINS, credentials: false }),
    express.json({ limit: '100kb' }),
    expressMiddleware(apollo, {
      context: async ({ req }) => ({ user: await auth.userFromRequest(req), auth }),
    }),
  );

  // In production the API can also serve the built client as a single-page app.
  if (isProd && existsSync(clientDist)) {
    app.use(express.static(clientDist, { maxAge: '1y', index: false, immutable: true }));
    app.get('/{*splat}', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile('index.html', { root: clientDist });
    });
  }

  return { app, apollo };
}
