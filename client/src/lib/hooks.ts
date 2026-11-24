import { CombinedGraphQLErrors } from '@apollo/client';
import { skipToken, useMutation, useQuery } from '@apollo/client/react';
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useAuth } from './auth';
import type { Book } from './books';
import { GET_ME, REMOVE_BOOK, SAVE_BOOK, type BookInput, type Me, type SavedBook } from './graphql';
import { useToast } from './toast';

/** Sets document.title for the current page, e.g. "Your shelf · Readr". */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · Readr` : 'Readr · Find your next great read';
  }, [title]);
}

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCED_QUERY);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

export type Theme = 'light' | 'dark';
const THEME_KEY = 'readr:theme';

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Light/dark theme that follows the OS until the user picks one. Set pre-paint by /theme-init.js. */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(
    () => (document.documentElement.dataset.theme as Theme | undefined) ?? systemTheme(),
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]:not([media])')
      ?.setAttribute('content', theme === 'dark' ? '#121212' : '#f7f2e8');
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* storage may be unavailable (private mode); theme still applies for this visit */
      }
      return next;
    });
  }, []);

  return [theme, toggle];
}

export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (CombinedGraphQLErrors.is(error)) return error.errors[0]?.message ?? fallback;
  if (error instanceof Error && error.message && !/fetch|network/i.test(error.message)) {
    return error.message;
  }
  return fallback;
}

const isUnauthenticated = (error: unknown) =>
  CombinedGraphQLErrors.is(error) &&
  error.errors.some((e) => e.extensions?.code === 'UNAUTHENTICATED');

const toInput = ({
  bookId,
  title,
  authors,
  description,
  image,
  link,
}: Book | SavedBook): BookInput => ({
  bookId,
  title,
  authors: authors ?? [],
  description: description ?? null,
  image: image ?? null,
  link: link ?? null,
});

/**
 * Single source of truth for the signed-in user's shelf. Saved ids come from the API cache
 * (v1 kept a second copy in localStorage that could drift out of sync).
 */
export function useShelf() {
  const { token } = useAuth();
  const { notify } = useToast();
  const { data, loading, error, refetch } = useQuery(GET_ME, token ? {} : skipToken);
  const [save] = useMutation(SAVE_BOOK);
  const [remove] = useMutation(REMOVE_BOOK);

  const me = token ? (data?.me ?? null) : null;

  const savedIds = useMemo(() => new Set(me?.savedBooks.map((b) => b.bookId)), [me]);

  const optimistic = useCallback(
    (books: SavedBook[]): Me | null =>
      me ? { ...me, __typename: 'User', bookCount: books.length, savedBooks: books } : null,
    [me],
  );

  const saveBook = useCallback(
    async (book: Book | SavedBook) => {
      const input = toInput(book);
      try {
        await save({
          variables: { input },
          optimisticResponse: me
            ? {
                saveBook: optimistic([
                  ...me.savedBooks,
                  { __typename: 'Book', _id: null, ...input },
                ]),
              }
            : undefined,
        });
        notify({ message: `Saved “${book.title}” to your shelf.`, tone: 'success' });
      } catch (err) {
        notify({ message: errorMessage(err, 'Could not save that book.'), tone: 'error' });
      }
    },
    [save, me, optimistic, notify],
  );

  const removeBook = useCallback(
    async (book: SavedBook | Book) => {
      try {
        await remove({
          variables: { bookId: book.bookId },
          optimisticResponse: me
            ? { removeBook: optimistic(me.savedBooks.filter((b) => b.bookId !== book.bookId)) }
            : undefined,
        });
        notify({
          message: `Removed “${book.title}”.`,
          action: { label: 'Undo', onClick: () => void saveBook(book) },
        });
      } catch (err) {
        notify({ message: errorMessage(err, 'Could not remove that book.'), tone: 'error' });
      }
    },
    [remove, me, optimistic, notify, saveBook],
  );

  return { me, loading, error, refetch, savedIds, saveBook, removeBook };
}

/**
 * Mounted once (in the layout): if the API rejects our token (expired, or issued by v1),
 * sign out quietly and say why, instead of leaving a half-signed-in page.
 */
export function useSessionGuard() {
  const { token, signOut } = useAuth();
  const { notify } = useToast();
  const { error } = useQuery(GET_ME, token ? {} : skipToken);
  useEffect(() => {
    if (token && isUnauthenticated(error)) {
      void signOut();
      notify({ message: 'Your session expired. Please sign in again.' });
    }
  }, [error, token, signOut, notify]);
}
