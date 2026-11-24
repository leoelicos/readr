import { z } from 'zod';

const DEV_SECRET = 'readr-local-development-secret-do-not-use-in-prod';

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/readr'),
    JWT_SECRET: z.string().optional(),
    JWT_TTL: z.string().default('2h'),
    CORS_ORIGINS: z
      .string()
      .default('http://localhost:5173,http://127.0.0.1:5173')
      .transform((value) =>
        value
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean),
      ),
  })
  .transform((env, ctx) => {
    const secret = env.JWT_SECRET?.trim();
    if (env.NODE_ENV === 'production' && (!secret || secret.length < 32)) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_SECRET'],
        message: 'JWT_SECRET must be set to at least 32 characters in production',
      });
      return z.NEVER;
    }
    return { ...env, JWT_SECRET: secret || DEV_SECRET };
  });

export type Env = z.output<typeof schema>;

/** Parses and validates process.env once, failing fast with a readable message. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = schema.safeParse(source);
  if (!result.success) {
    console.error('Invalid environment configuration:\n' + z.prettifyError(result.error));
    process.exit(1);
  }
  return result.data;
}
