/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute GraphQL endpoint for production builds; defaults to same-origin /graphql. */
  readonly VITE_GRAPHQL_URL?: string;
  /** Optional Google Books API key (referrer-restricted) to avoid anonymous rate limits. */
  readonly VITE_GOOGLE_BOOKS_API_KEY?: string;
}
