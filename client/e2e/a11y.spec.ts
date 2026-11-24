import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

const volumes = {
  totalItems: 120,
  items: Array.from({ length: 20 }, (_, i) => ({
    id: `vol${i}`,
    volumeInfo: {
      title: i === 0 ? 'The Left Hand of Darkness' : `Speculative Fiction Volume ${i + 1}`,
      authors: i % 3 ? ['Ursula K. Le Guin'] : ['Ursula K. Le Guin', 'Octavia E. Butler'],
      description:
        'A groundbreaking work of science fiction that explores gender, politics and friendship on the icy planet Gethen. '.repeat(
          i % 2 ? 1 : 3,
        ),
      publishedDate: `${1969 + i}-01-01`,
      pageCount: 200 + i * 7,
      infoLink: `https://books.google.com/books?id=vol${i}`,
    },
  })),
};

const me = {
  __typename: 'User',
  _id: 'u1',
  username: 'leo',
  email: 'leo@example.com',
  bookCount: 2,
  savedBooks: volumes.items.slice(0, 2).map((v) => ({
    __typename: 'Book',
    _id: `b-${v.id}`,
    bookId: v.id,
    title: v.volumeInfo.title,
    authors: v.volumeInfo.authors,
    description: v.volumeInfo.description,
    image: null,
    link: v.volumeInfo.infoLink,
  })),
};

async function mockNetwork(page: Page, { signedIn = false } = {}) {
  await page.route('https://www.googleapis.com/books/v1/volumes**', (route) =>
    route.fulfill({ json: volumes }),
  );
  await page.route('**/graphql', (route) => {
    const op = route.request().postDataJSON()?.operationName;
    if (op === 'Me') return route.fulfill({ json: { data: { me } } });
    return route.fulfill({ json: { data: null, errors: [{ message: 'not mocked' }] } });
  });
  if (signedIn) {
    const payload = Buffer.from(
      JSON.stringify({
        data: { _id: 'u1', username: 'leo', email: 'leo@example.com' },
        exp: 4102444800,
      }),
    ).toString('base64url');
    await page.addInitScript(
      (token) => localStorage.setItem('readr:token', token),
      `x.${payload}.y`,
    );
  }
}

async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  const summary = results.violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`,
  );
  expect(summary, summary.join('\n')).toEqual([]);
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} theme`, () => {
    test.use({ colorScheme: scheme });

    test('home page passes axe (incl. colour contrast)', async ({ page }) => {
      await mockNetwork(page);
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
      await expectNoViolations(page);
    });

    test('search results pass axe', async ({ page }) => {
      await mockNetwork(page);
      await page.goto('/');
      await page.getByRole('searchbox').fill('le guin');
      await page.keyboard.press('Enter');
      await expect(page.getByRole('heading', { name: '120 results for “le guin”' })).toBeVisible();
      await expect(page.getByRole('article')).toHaveCount(20);
      await page.waitForTimeout(1200); // let entrance animations settle before contrast checks
      await expectNoViolations(page);
    });

    test('sign-in dialog passes axe and traps focus', async ({ page }) => {
      await mockNetwork(page);
      await page.goto('/');
      await page.getByRole('button', { name: 'Sign in' }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByRole('tabpanel', { name: 'Sign in' }).getByLabel('Email'),
      ).toBeFocused();
      await page.waitForTimeout(400);
      await expectNoViolations(page);
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(page.getByRole('button', { name: 'Sign in' })).toBeFocused();
    });

    test('signed-in shelf passes axe', async ({ page }) => {
      await mockNetwork(page, { signedIn: true });
      await page.goto('/shelf');
      await expect(page.getByRole('article')).toHaveCount(2);
      await page.waitForTimeout(800);
      await expectNoViolations(page);
    });
  });
}

test('keyboard: skip link, theme toggle and ⌘K', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard flow is desktop-only');
  await mockNetwork(page);
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);

  await page.keyboard.press('ControlOrMeta+k');
  await expect(page.getByRole('searchbox')).toBeFocused();

  const toggle = page.getByRole('button', { name: /switch to (dark|light) theme/i });
  const before = await page.locator('html').getAttribute('data-theme');
  await toggle.click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', before ?? '');
});

test('reduced motion disables animations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mockNetwork(page);
  await page.goto('/?q=le+guin');
  await expect(page.getByRole('article').first()).toBeVisible();
  const animation = await page
    .getByRole('article')
    .first()
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(animation).toBe('none');
});

test('no horizontal scroll at 320px (WCAG 1.4.10 reflow)', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await mockNetwork(page, { signedIn: true });
  await page.goto('/?q=le+guin');
  await expect(page.getByRole('article').first()).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
