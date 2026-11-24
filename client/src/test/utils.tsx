import { ApolloLink } from '@apollo/client';
import { MockLink } from '@apollo/client/testing';
import { render } from '@testing-library/react';
import axe from 'axe-core';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Providers, routes } from '../App';
import { createApolloClient } from '../lib/apollo';

export function renderApp(path = '/', mocks: MockLink.MockedResponse[] = []) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const client = createApolloClient(ApolloLink.from([new MockLink(mocks)]));
  const utils = render(
    <Providers client={client}>
      <RouterProvider router={router} />
    </Providers>,
  );
  return { ...utils, router };
}

/** Runs axe on the rendered DOM. Colour contrast is verified separately (jsdom has no layout). */
export async function axeViolations(node: Element = document.body) {
  const { violations } = await axe.run(node, {
    rules: { 'color-contrast': { enabled: false } },
  });
  return violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target).join(', ')})`);
}

export const googleBooksResponse = {
  totalItems: 42,
  items: [
    {
      id: 'dune1',
      volumeInfo: {
        title: 'Dune',
        authors: ['Frank Herbert'],
        description: 'Set on the desert planet Arrakis. '.repeat(12),
        publishedDate: '1965-08-01',
        pageCount: 412,
        imageLinks: { thumbnail: 'http://books.google.com/books/content?id=dune1&edge=curl' },
        canonicalVolumeLink: 'https://books.google.com/books/about/Dune.html?id=dune1',
      },
    },
    { id: 'nocover', volumeInfo: { title: 'Dune Messiah' } },
  ],
};

export function stubGoogleBooks(body: unknown = googleBooksResponse, ok = true) {
  const fetchMock = async () =>
    new Response(JSON.stringify(body), {
      status: ok ? 200 : 503,
      headers: { 'Content-Type': 'application/json' },
    });
  return fetchMock;
}
