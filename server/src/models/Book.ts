import { Schema, type InferSchemaType } from 'mongoose';

/** Sub-document schema for a book saved to a user's shelf. */
export const bookSchema = new Schema({
  bookId: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  authors: [{ type: String, trim: true }],
  description: { type: String },
  image: { type: String },
  link: { type: String },
  savedAt: { type: Date, default: () => new Date() },
});

export type BookDoc = InferSchemaType<typeof bookSchema>;
