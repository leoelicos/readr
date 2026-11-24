import { compare, hash } from 'bcryptjs';
import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import { bookSchema, type BookDoc } from './Book.ts';

export interface UserFields {
  username: string;
  email: string;
  password: string;
  savedBooks: BookDoc[];
}

interface UserMethods {
  isCorrectPassword(password: string): Promise<boolean>;
}

type UserModel = Model<UserFields, object, UserMethods>;
export type UserDocument = HydratedDocument<UserFields, UserMethods>;

const SALT_ROUNDS = 12;

const userSchema = new Schema<UserFields, UserModel, UserMethods>(
  {
    username: { type: String, required: true, unique: true, trim: true, maxlength: 40 },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Must use a valid email address'],
    },
    password: { type: String, required: true },
    savedBooks: { type: [bookSchema], default: [] },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

// bcryptjs reads hashes created by the original native `bcrypt` package, so existing users can still sign in.
userSchema.pre('save', async function () {
  if (this.isNew || this.isModified('password')) {
    this.password = await hash(this.password, SALT_ROUNDS);
  }
});

userSchema.method('isCorrectPassword', function (this: UserDocument, password: string) {
  return compare(password, this.password);
});

export const User = model<UserFields, UserModel>('User', userSchema);
