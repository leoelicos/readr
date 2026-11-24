import { createServer } from 'node:http';
import { createApp } from './app.ts';
import { connectDb, disconnectDb } from './db.ts';
import { loadEnv } from './env.ts';

const env = loadEnv();
const httpServer = createServer();
const { app, apollo } = await createApp(env, httpServer);
httpServer.on('request', app);

await connectDb(env.MONGODB_URI);
httpServer.listen(env.PORT, () => {
  console.info(`📚 Readr API ready at http://localhost:${env.PORT}/graphql (${env.NODE_ENV})`);
});

// Graceful shutdown for Render/containers: stop accepting requests, drain, close Mongo.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    console.info(`${signal} received, shutting down…`);
    await apollo.stop();
    await disconnectDb();
    process.exit(0);
  });
}
