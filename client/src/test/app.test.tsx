import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations, renderApp, stubGoogleBooks } from './utils';

describe('Search page', () => {
  it('renders an accessible landing page', async () => {
    renderApp('/');
    expect(
      screen.getByRole('heading', { level: 1, name: /find your next great read/i }),
    ).toBeTruthy();
    expect(screen.getByRole('search', { name: 'Books' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /skip to content/i })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeTruthy();
    expect(await axeViolations()).toEqual([]);
  });

  it('searches Google Books, shows results and announces the count', async () => {
    const fetchMock = vi.fn<typeof fetch>(stubGoogleBooks());
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    const { router } = renderApp('/');

    await user.type(screen.getByRole('searchbox', { name: /search by title/i }), 'dune');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(router.state.location.search).toBe('?q=dune');
    expect(await screen.findByRole('heading', { name: '42 results for “dune”' })).toBeTruthy();
    await waitFor(() =>
      expect(document.querySelector('main [role="status"]')?.textContent).toBe(
        'Showing 2 of 42 results for dune.',
      ),
    );

    const url = new URL(String(fetchMock.mock.calls[0]![0]));
    expect(url.searchParams.get('q')).toBe('dune');

    const card = screen.getByRole('article', { name: 'Dune' });
    expect(within(card).getByText(/Frank Herbert/)).toBeTruthy();
    const img = card.querySelector('img');
    expect(img?.getAttribute('src')).toBe('https://books.google.com/books/content?id=dune1');
    expect(img?.getAttribute('alt')).toBe(''); // title is already the article's name

    // Long descriptions are clamped behind an expandable button.
    const more = within(card).getByRole('button', { name: /read more about dune/i });
    expect(more.getAttribute('aria-expanded')).toBe('false');
    await user.click(more);
    expect(more.getAttribute('aria-expanded')).toBe('true');

    // A book without artwork still gets a (decorative) generated cover.
    const messiah = screen.getByRole('article', { name: 'Dune Messiah' });
    expect(messiah.querySelector('.cover-generated')?.getAttribute('aria-hidden')).toBe('true');

    expect(await axeViolations()).toEqual([]);
  });

  it('shows a recoverable error when Google Books is down', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(stubGoogleBooks({}, false)));
    renderApp('/?q=dune');
    expect(
      await screen.findByRole('heading', { name: /couldn’t reach google books/i }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  it('asks signed-out readers to sign in when they press Save, with context', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(stubGoogleBooks()));
    const user = userEvent.setup();
    renderApp('/?q=dune');

    await user.click(await screen.findByRole('button', { name: 'Save Dune to your shelf' }));
    const dialog = await screen.findByRole('dialog', { name: /your reading life, saved/i });
    expect(within(dialog).getByText(/save “Dune” to your shelf/i)).toBeTruthy();
    expect(await axeViolations(dialog)).toEqual([]);
  });
});

describe('Auth dialog', () => {
  it('implements the ARIA tabs pattern with arrow keys', async () => {
    const user = userEvent.setup();
    renderApp('/');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    const signIn = screen.getByRole('tab', { name: 'Sign in' });
    expect(signIn.getAttribute('aria-selected')).toBe('true');
    signIn.focus();
    await user.keyboard('{ArrowRight}');
    const create = screen.getByRole('tab', { name: 'Create account' });
    expect(create.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(create);
    expect(screen.getByRole('tabpanel', { name: 'Create account' })).toBeTruthy();
  });

  it('validates inline, marks fields invalid and focuses the first problem', async () => {
    const user = userEvent.setup();
    renderApp('/');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await user.click(screen.getByRole('tab', { name: 'Create account' }));

    const panel = screen.getByRole('tabpanel', { name: 'Create account' });
    await user.click(within(panel).getByRole('button', { name: 'Create account' }));

    const username = within(panel).getByLabelText('Username');
    await waitFor(() => expect(username.getAttribute('aria-invalid')).toBe('true'));
    expect(document.activeElement).toBe(username);
    expect(username.getAttribute('aria-describedby')).toBeTruthy();
    expect(within(panel).getByText(/at least 2 characters/)).toBeTruthy();

    const password = within(panel).getByLabelText('Password');
    expect(password.getAttribute('autocomplete')).toBe('new-password');
    await user.click(within(panel).getByRole('button', { name: 'Show password' }));
    expect(password.getAttribute('type')).toBe('text');
  });
});

describe('Routing', () => {
  it('invites signed-out readers to sign in on the shelf', async () => {
    renderApp('/shelf');
    expect(await screen.findByRole('heading', { name: 'Sign in to see your shelf.' })).toBeTruthy();
    expect(await axeViolations()).toEqual([]);
  });

  it('redirects the v1 /saved URL to /shelf', async () => {
    const { router } = renderApp('/saved');
    await waitFor(() => expect(router.state.location.pathname).toBe('/shelf'));
  });

  it('has a friendly 404', async () => {
    renderApp('/nope');
    expect(await screen.findByRole('heading', { level: 1, name: /checked out/i })).toBeTruthy();
  });
});
