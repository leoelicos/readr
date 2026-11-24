import { GraphQLError } from 'graphql';
import { mongo } from 'mongoose';
import { z } from 'zod';
import { User, type UserDocument } from '../models/User.ts';
import type { Context } from './context.ts';

const unauthenticated = () =>
  new GraphQLError('You need to be logged in.', { extensions: { code: 'UNAUTHENTICATED' } });

const badInput = (message: string, field?: string) =>
  new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT', field } });

const signupInput = z.object({
  username: z.string().trim().min(2, 'Username must be at least 2 characters').max(40),
  email: z.email('Enter a valid email address').trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
});

const bookInput = z.object({
  bookId: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1).max(500),
  authors: z.array(z.string().max(200)).max(50).nullish(),
  description: z.string().max(20_000).nullish(),
  image: z
    .url({ protocol: /^https?$/ })
    .max(2000)
    .nullish(),
  link: z
    .url({ protocol: /^https?$/ })
    .max(2000)
    .nullish(),
});

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw badInput(issue?.message ?? 'Invalid input', issue?.path.join('.'));
  }
  return result.data;
}

function requireUser(ctx: Context) {
  if (!ctx.user) throw unauthenticated();
  return ctx.user;
}

/** Case-insensitive email match so accounts created before emails were lower-cased still work. */
const byEmail = (email: string) =>
  User.findOne({ email: email.trim() }).collation({ locale: 'en', strength: 2 });

export const resolvers = {
  User: {
    bookCount: (user: UserDocument) => user.savedBooks.length,
  },

  Query: {
    me: async (_: unknown, __: unknown, ctx: Context) => {
      const { _id } = requireUser(ctx);
      const user = await User.findById(_id);
      if (!user) throw unauthenticated();
      return user;
    },
  },

  Mutation: {
    addUser: async (_: unknown, args: unknown, ctx: Context) => {
      const input = parse(signupInput, args);
      try {
        const user = await User.create(input);
        return { token: await ctx.auth.sign(user), user };
      } catch (error) {
        if (error instanceof mongo.MongoServerError && error.code === 11000) {
          const field = Object.keys(error.keyPattern ?? {})[0] ?? 'email';
          throw badInput(`That ${field} is already registered.`, field);
        }
        throw error;
      }
    },

    login: async (
      _: unknown,
      { email, password }: { email: string; password: string },
      ctx: Context,
    ) => {
      const user = await byEmail(email);
      // One generic message for both cases so the API doesn't reveal which emails exist.
      if (!user || !(await user.isCorrectPassword(password))) {
        throw new GraphQLError('Incorrect email or password.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return { token: await ctx.auth.sign(user), user };
    },

    saveBook: async (_: unknown, { input }: { input: unknown }, ctx: Context) => {
      const { _id } = requireUser(ctx);
      const book = parse(bookInput, input);
      // Only add if this bookId isn't already on the shelf (the old $addToSet compared whole objects).
      await User.updateOne(
        { _id, 'savedBooks.bookId': { $ne: book.bookId } },
        { $push: { savedBooks: book } },
        { runValidators: true },
      );
      return User.findById(_id);
    },

    removeBook: async (_: unknown, { bookId }: { bookId: string }, ctx: Context) => {
      const { _id } = requireUser(ctx);
      return User.findByIdAndUpdate(
        _id,
        { $pull: { savedBooks: { bookId } } },
        { returnDocument: 'after' },
      );
    },
  },
};
