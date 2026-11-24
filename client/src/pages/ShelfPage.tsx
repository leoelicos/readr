import { useDeferredValue, useId, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { BookCard, BookSkeleton } from '../components/BookCard';
import { useAuth } from '../lib/auth';
import { formatAuthors } from '../lib/books';
import { useDocumentTitle, useShelf } from '../lib/hooks';

type Sort = 'recent' | 'title' | 'author';

export default function ShelfPage() {
  useDocumentTitle('Your shelf');
  const { token, profile, openAuth } = useAuth();
  const { me, loading, error, refetch, removeBook } = useShelf();
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<Sort>('recent');
  const deferredFilter = useDeferredValue(filter);
  const id = useId();

  const books = useMemo(() => {
    const list = [...(me?.savedBooks ?? [])];
    if (sort === 'recent') list.reverse();
    if (sort === 'title') list.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'author')
      list.sort((a, b) => formatAuthors(a.authors).localeCompare(formatAuthors(b.authors)));
    const q = deferredFilter.trim().toLowerCase();
    return q
      ? list.filter((b) => `${b.title} ${b.authors?.join(' ') ?? ''}`.toLowerCase().includes(q))
      : list;
  }, [me, sort, deferredFilter]);

  const count = me?.bookCount ?? 0;

  return (
    <>
      <section className="hero hero-shelf" aria-labelledby="page-title">
        <div className="wrap hero-inner">
          <p className="eyebrow">{profile ? `${profile.username}’s library` : 'Your library'}</p>
          <h1 id="page-title" tabIndex={-1}>
            Your <em>shelf</em>
          </h1>
          {token && me ? (
            <p className="lede">
              {count
                ? `${count} ${count === 1 ? 'book' : 'books'} saved for later.`
                : 'Nothing here yet.'}
            </p>
          ) : null}
        </div>
      </section>

      <section className="wrap results" aria-labelledby="shelf-title" aria-busy={loading}>
        {!token ? (
          <div className="empty">
            <h2 id="shelf-title">Sign in to see your shelf.</h2>
            <p>Save books from any search and pick up where you left off, on any device.</p>
            <div className="row">
              <button type="button" className="btn btn-primary" onClick={() => openAuth('login')}>
                Sign in
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => openAuth('signup')}>
                Create an account
              </button>
            </div>
          </div>
        ) : loading && !me ? (
          <>
            <h2 id="shelf-title" className="results-title">
              Loading your shelf…
            </h2>
            <ul role="list" className="grid">
              {Array.from({ length: 3 }, (_, i) => (
                <li key={i}>
                  <BookSkeleton />
                </li>
              ))}
            </ul>
          </>
        ) : error && !me ? (
          <div className="empty" data-tone="error">
            <h2 id="shelf-title">We couldn’t load your shelf.</h2>
            <p>The server may be waking up. Give it a moment and try again.</p>
            <button type="button" className="btn btn-primary" onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        ) : !count ? (
          <div className="empty">
            <h2 id="shelf-title">Your shelf is empty.</h2>
            <p>Find something you love and press Save. It’ll appear here.</p>
            <Link to="/" className="btn btn-primary" viewTransition>
              Start searching
            </Link>
          </div>
        ) : (
          <>
            <div className="toolbar">
              <h2 id="shelf-title" className="results-title">
                {books.length === count ? 'All books' : `${books.length} of ${count} books`}
              </h2>
              <div className="toolbar-controls">
                <div className="mini-field">
                  <label htmlFor={`${id}-filter`}>Filter</label>
                  <input
                    id={`${id}-filter`}
                    type="search"
                    placeholder="Title or author"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </div>
                <div className="mini-field">
                  <label htmlFor={`${id}-sort`}>Sort by</label>
                  <select
                    id={`${id}-sort`}
                    value={sort}
                    onChange={(e) => setSort(e.target.value as Sort)}
                  >
                    <option value="recent">Recently saved</option>
                    <option value="title">Title</option>
                    <option value="author">Author</option>
                  </select>
                </div>
              </div>
            </div>
            {books.length ? (
              <ul role="list" className="grid">
                {books.map((book, i) => (
                  <li key={book.bookId}>
                    <BookCard book={book} index={i} onRemove={() => void removeBook(book)} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No saved books match “{filter}”.</p>
            )}
          </>
        )}
      </section>
    </>
  );
}
