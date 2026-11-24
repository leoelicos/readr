import { useId, useState, type CSSProperties } from 'react';
import { formatAuthors, type Book } from '../lib/books';
import { coverPalette } from '../lib/cover';
import type { SavedBook } from '../lib/graphql';
import { Icon } from './Icon';

interface BookCardProps {
  book: Book | SavedBook;
  saved?: boolean;
  /** When signed out we still render the button; it opens sign-in with context. */
  onSave?: () => void;
  onRemove?: () => void;
  headingLevel?: 'h2' | 'h3';
  index?: number;
}

function Cover({ book }: { book: Book | SavedBook }) {
  const [failed, setFailed] = useState(false);
  if (book.image && !failed) {
    return (
      <img
        className="cover-img"
        src={book.image}
        alt=""
        width={128}
        height={192}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }
  const { bg, fg, angle } = coverPalette(book.bookId + book.title);
  return (
    <div
      className="cover-generated"
      style={
        { '--cover-bg': bg, '--cover-fg': fg, '--cover-angle': `${angle}deg` } as CSSProperties
      }
      aria-hidden="true"
    >
      <span className="cover-title">{book.title}</span>
      <span className="cover-author">{book.authors?.[0] ?? ''}</span>
    </div>
  );
}

export function BookCard({
  book,
  saved,
  onSave,
  onRemove,
  headingLevel: H = 'h3',
  index = 0,
}: BookCardProps) {
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  const description = book.description?.trim();
  const long = (description?.length ?? 0) > 220;
  const year = 'year' in book ? book.year : undefined;
  const pages = 'pageCount' in book ? book.pageCount : undefined;

  return (
    <article
      className="book"
      aria-labelledby={`${id}-title`}
      style={{ '--i': Math.min(index, 12) } as CSSProperties}
    >
      <div className="book-cover">
        <Cover book={book} />
      </div>
      <div className="book-body">
        <H className="book-title" id={`${id}-title`}>
          {book.title}
        </H>
        <p className="book-meta">
          <span>{formatAuthors(book.authors)}</span>
          {year ? <span>{year}</span> : null}
          {pages ? <span>{pages} pages</span> : null}
        </p>
        {description ? (
          <>
            <p
              className="book-desc"
              id={`${id}-desc`}
              data-clamped={long && !expanded ? '' : undefined}
            >
              {description}
            </p>
            {long ? (
              <button
                type="button"
                className="link-btn"
                aria-expanded={expanded}
                aria-controls={`${id}-desc`}
                onClick={() => setExpanded((e) => !e)}
              >
                {expanded ? 'Show less' : 'Read more'}{' '}
                <span className="sr-only">about {book.title}</span>
              </button>
            ) : null}
          </>
        ) : (
          <p className="book-desc muted">No description available.</p>
        )}

        <div className="book-actions">
          {onRemove ? (
            <button type="button" className="btn btn-small btn-ghost" onClick={onRemove}>
              <Icon name="trash" size={18} />
              Remove <span className="sr-only">{book.title} from your shelf</span>
            </button>
          ) : onSave ? (
            <button
              type="button"
              className="btn btn-small"
              data-variant={saved ? 'saved' : 'save'}
              aria-disabled={saved || undefined}
              onClick={saved ? undefined : onSave}
            >
              <Icon name={saved ? 'check' : 'bookmark'} size={18} />
              {saved ? 'On your shelf' : 'Save'}{' '}
              <span className="sr-only">
                {saved ? `(${book.title})` : `${book.title} to your shelf`}
              </span>
            </button>
          ) : null}
          {book.link ? (
            <a
              className="btn btn-small btn-quiet"
              href={book.link}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="external" size={18} />
              Preview{' '}
              <span className="sr-only">{book.title} on Google Books (opens in a new tab)</span>
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function BookSkeleton() {
  return (
    <div className="book book-skeleton" aria-hidden="true">
      <div className="book-cover shimmer" />
      <div className="book-body">
        <div className="shimmer line w-80" />
        <div className="shimmer line w-50" />
        <div className="shimmer line" />
        <div className="shimmer line" />
        <div className="shimmer line w-60" />
      </div>
    </div>
  );
}
