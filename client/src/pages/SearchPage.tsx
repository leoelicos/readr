import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { BookCard, BookSkeleton } from '../components/BookCard';
import { Icon } from '../components/Icon';
import { useAuth } from '../lib/auth';
import { PAGE_SIZE, searchBooks, type Book } from '../lib/books';
import { useDocumentTitle, useShelf } from '../lib/hooks';

const SUGGESTIONS = [
  'Ursula K. Le Guin',
  'Station Eleven',
  'Cosy mysteries',
  'Octavia Butler',
  'Design systems',
];
const nf = new Intl.NumberFormat('en-AU');

type Status = 'idle' | 'loading' | 'success' | 'error';
interface Result {
  key: string;
  status: 'success' | 'error';
  books: Book[];
  total: number;
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q')?.trim() ?? '';
  const [draft, setDraft] = useState(query);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [extraAnnouncement, setExtraAnnouncement] = useState<{ key: string; text: string } | null>(
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingSave = useRef<Book | null>(null);

  const { token, openAuth } = useAuth();
  const { me, savedIds, saveBook } = useShelf();

  useDocumentTitle(query ? `“${query}”` : '');

  // Keep the box in sync with back/forward navigation (state adjusted during render, no effect).
  const [syncedQuery, setSyncedQuery] = useState(query);
  if (syncedQuery !== query) {
    setSyncedQuery(query);
    setDraft(query);
  }

  // Everything visible is derived from the latest result for the *current* request.
  const requestKey = `${query}\u0000${retry}`;
  const current = result?.key === requestKey ? result : null;
  const status: Status = !query ? 'idle' : (current?.status ?? 'loading');
  const books = current?.books ?? [];
  const total = current?.total ?? 0;

  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    searchBooks(query, { signal: controller.signal })
      .then(({ items, total: count }) =>
        setResult({ key: requestKey, status: 'success', books: items, total: count }),
      )
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error(error);
        setResult({ key: requestKey, status: 'error', books: [], total: 0 });
      });
    return () => controller.abort();
  }, [query, requestKey]);

  const announcement =
    extraAnnouncement?.key === requestKey
      ? extraAnnouncement.text
      : status === 'loading'
        ? `Searching for ${query}…`
        : status === 'error'
          ? 'Search failed. Check your connection and try again.'
          : status === 'success'
            ? books.length
              ? `Showing ${books.length} of ${nf.format(total)} results for ${query}.`
              : `No books found for ${query}.`
            : '';

  // ⌘K / Ctrl+K jumps to search from anywhere on the page (modifier key, so WCAG 2.1.4 safe).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // If someone tried to save while signed out, finish the job once they sign in.
  useEffect(() => {
    const book = pendingSave.current;
    if (token && me && book) {
      pendingSave.current = null;
      if (!savedIds.has(book.bookId)) void saveBook(book);
    }
  }, [token, me, savedIds, saveBook]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = draft.trim();
    if (!next) {
      inputRef.current?.focus();
      return;
    }
    if (next === query) setRetry((r) => r + 1);
    else setParams({ q: next });
  };

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const { items } = await searchBooks(query, { startIndex: books.length });
      const known = new Set(books.map((b) => b.bookId));
      const fresh = items.filter((b) => !known.has(b.bookId));
      setResult((r) => (r && r.key === requestKey ? { ...r, books: [...r.books, ...fresh] } : r));
      setExtraAnnouncement({
        key: requestKey,
        text: `Loaded ${fresh.length} more. Showing ${books.length + fresh.length} results.`,
      });
    } catch {
      setExtraAnnouncement({
        key: requestKey,
        text: 'Could not load more results. Please try again.',
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const onSave = (book: Book) => {
    if (token) return void saveBook(book);
    pendingSave.current = book;
    openAuth('login', `Sign in or create a free account to save “${book.title}” to your shelf.`);
  };

  const hasMore = status === 'success' && books.length < total && books.length >= PAGE_SIZE;

  return (
    <>
      <section className="hero" data-compact={query ? '' : undefined} aria-labelledby="page-title">
        <div className="wrap hero-inner">
          <p className="eyebrow">Powered by Google Books</p>
          <h1 id="page-title" tabIndex={-1}>
            Find your next <em>great read</em>.
          </h1>
          <form role="search" className="search" onSubmit={submit} aria-label="Books">
            <label htmlFor="q" className="sr-only">
              Search by title, author or topic
            </label>
            <Icon name="search" size={22} />
            <input
              ref={inputRef}
              id="q"
              name="q"
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              placeholder="Title, author or topic"
              aria-describedby="q-hint"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <kbd className="search-kbd" aria-hidden="true">
              ⌘K
            </kbd>
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>
          <p id="q-hint" className="sr-only">
            Tip: press Control K or Command K to jump back to this field.
          </p>
          {!query ? (
            <div className="chips">
              <span id="try-label">Try</span>
              <ul role="list" aria-labelledby="try-label">
                {SUGGESTIONS.map((s) => (
                  <li key={s}>
                    <button type="button" className="chip" onClick={() => setParams({ q: s })}>
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <div className="spines" aria-hidden="true">
          {Array.from({ length: 14 }, (_, i) => (
            <span key={i} style={{ '--n': i } as React.CSSProperties} />
          ))}
        </div>
      </section>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <section
        className="wrap results"
        aria-labelledby="results-title"
        aria-busy={status === 'loading'}
      >
        {status === 'idle' ? (
          <div className="empty">
            <h2 id="results-title">Start with a word, a name or a feeling.</h2>
            <p>
              Search Google Books, then save favourites to your shelf. They’ll be waiting on any
              device you sign in to.
            </p>
          </div>
        ) : null}

        {status === 'loading' ? (
          <>
            <h2 id="results-title" className="results-title">
              Searching for “{query}”…
            </h2>
            <ul role="list" className="grid">
              {Array.from({ length: 6 }, (_, i) => (
                <li key={i}>
                  <BookSkeleton />
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {status === 'error' ? (
          <div className="empty" data-tone="error">
            <h2 id="results-title">We couldn’t reach Google Books.</h2>
            <p>Check your connection and try again.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setRetry((r) => r + 1)}
            >
              Try again
            </button>
          </div>
        ) : null}

        {status === 'success' ? (
          books.length ? (
            <>
              <h2 id="results-title" className="results-title">
                {nf.format(total)} results for “{query}”
              </h2>
              <ul role="list" className="grid">
                {books.map((book, i) => (
                  <li key={book.bookId}>
                    <BookCard
                      book={book}
                      index={i % PAGE_SIZE}
                      saved={savedIds.has(book.bookId)}
                      onSave={() => onSave(book)}
                    />
                  </li>
                ))}
              </ul>
              {hasMore ? (
                <div className="more">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={loadMore}
                    aria-disabled={loadingMore || undefined}
                  >
                    {loadingMore ? <span className="spinner" aria-hidden="true" /> : null}
                    {loadingMore ? 'Loading…' : 'Show more books'}
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="empty">
              <h2 id="results-title">No books found for “{query}”.</h2>
              <p>Try a broader term, check the spelling, or search by author.</p>
            </div>
          )
        ) : null}
      </section>
    </>
  );
}
