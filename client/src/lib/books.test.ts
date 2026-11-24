import { describe, expect, it } from 'vitest';
import { formatAuthors, secureImage, toBook } from './books';

describe('books', () => {
  it('maps a Google Books volume to a Book', () => {
    const book = toBook({
      id: 'x1',
      volumeInfo: {
        title: 'Piranesi',
        subtitle: 'A Novel',
        authors: ['Susanna Clarke'],
        publishedDate: '2020-09-15',
        pageCount: 272,
        imageLinks: { thumbnail: 'http://books.google.com/x?id=1&edge=curl' },
        infoLink: 'https://books.google.com/x1',
      },
    });
    expect(book).toMatchObject({
      bookId: 'x1',
      title: 'Piranesi: A Novel',
      authors: ['Susanna Clarke'],
      year: '2020',
      pageCount: 272,
      image: 'https://books.google.com/x?id=1',
      link: 'https://books.google.com/x1',
    });
  });

  it('copes with sparse volumes', () => {
    expect(toBook({ id: 'y' })).toMatchObject({
      bookId: 'y',
      title: 'Untitled',
      authors: [],
      image: null,
    });
  });

  it('upgrades insecure cover URLs', () => {
    expect(secureImage('http://a.b/c')).toBe('https://a.b/c');
    expect(secureImage(undefined)).toBeUndefined();
  });

  it('formats author lists naturally', () => {
    expect(formatAuthors(['A', 'B', 'C'])).toBe('A, B, and C');
    expect(formatAuthors([])).toBe('Unknown author');
  });
});
