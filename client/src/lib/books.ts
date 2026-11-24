import type { BookInput } from './graphql';

export interface Book extends BookInput {
  authors: string[];
  year?: string;
  pageCount?: number;
}

export interface SearchResult {
  items: Book[];
  total: number;
}

interface VolumeInfo {
  title?: string;
  subtitle?: string;
  authors?: string[];
  description?: string;
  publishedDate?: string;
  pageCount?: number;
  imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  infoLink?: string;
  canonicalVolumeLink?: string;
}

interface Volume {
  id: string;
  volumeInfo?: VolumeInfo;
}

export const PAGE_SIZE = 20;

const ENDPOINT = 'https://www.googleapis.com/books/v1/volumes';
const FIELDS =
  'totalItems,items(id,volumeInfo(title,subtitle,authors,description,publishedDate,pageCount,imageLinks/thumbnail,imageLinks/smallThumbnail,infoLink,canonicalVolumeLink))';

/** Google still returns some http:// cover URLs; upgrade them and drop the curled-page effect. */
export function secureImage(url?: string): string | undefined {
  if (!url) return undefined;
  return url.replace(/^http:\/\//, 'https://').replace('&edge=curl', '');
}

export function toBook(volume: Volume): Book {
  const info = volume.volumeInfo ?? {};
  const title = [info.title, info.subtitle].filter(Boolean).join(': ') || 'Untitled';
  return {
    bookId: volume.id,
    title,
    authors: info.authors?.length ? info.authors : [],
    description: info.description ?? null,
    image: secureImage(info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail) ?? null,
    link: info.canonicalVolumeLink ?? info.infoLink ?? null,
    year: info.publishedDate?.slice(0, 4),
    pageCount: info.pageCount,
  };
}

export async function searchBooks(
  query: string,
  { startIndex = 0, signal }: { startIndex?: number; signal?: AbortSignal } = {},
): Promise<SearchResult> {
  const params = new URLSearchParams({
    q: query,
    startIndex: String(startIndex),
    maxResults: String(PAGE_SIZE),
    printType: 'books',
    fields: FIELDS,
  });
  // Optional browser key (restrict it by HTTP referrer in Google Cloud) for higher rate limits.
  const key = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
  if (key) params.set('key', key);
  const res = await fetch(`${ENDPOINT}?${params}`, { signal });
  if (!res.ok) throw new Error(`Google Books responded with ${res.status}`);
  const json = (await res.json()) as { totalItems?: number; items?: Volume[] };
  return { items: (json.items ?? []).map(toBook), total: json.totalItems ?? 0 };
}

export const formatAuthors = (authors?: string[] | null) => {
  if (!authors?.length) return 'Unknown author';
  return new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(authors);
};
