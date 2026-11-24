import { expect, test } from '@playwright/test';

/**
 * Optional full-stack journey against a running API + database (Google Books is still mocked).
 *   npm run dev   # in another terminal, with MongoDB available
 *   E2E_FULL_STACK_URL=http://127.0.0.1:5173 npx playwright test fullstack --project desktop
 */
const url = process.env.E2E_FULL_STACK_URL;
test.use({ baseURL: url });

test('full stack: sign up, save, shelf, remove, undo, sign out, sign in', async ({
  page,
  isMobile,
}) => {
  test.skip(!url || isMobile, 'set E2E_FULL_STACK_URL to run');
  const vols = {
    totalItems: 2,
    items: [
      {
        id: 'aaa',
        volumeInfo: {
          title: 'Dune',
          authors: ['Frank Herbert'],
          description: 'Spice.',
          infoLink: 'https://books.google.com/books?id=aaa',
          imageLinks: { thumbnail: 'http://books.google.com/books/content?id=aaa' },
        },
      },
      { id: 'bbb', volumeInfo: { title: 'Dune Messiah', authors: ['Frank Herbert'] } },
    ],
  };
  await page.route('https://www.googleapis.com/**', (r) => r.fulfill({ json: vols }));
  await page.route('https://books.google.com/**', (r) => r.fulfill({ status: 404 }));
  const email = `smoke${Date.now()}@example.com`;
  await page.goto('/?q=dune');
  await page.getByRole('button', { name: 'Save Dune to your shelf' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('tab', { name: 'Create account' }).click();
  const panel = dialog.getByRole('tabpanel', { name: 'Create account' });
  await panel.getByLabel('Username').fill(`smokey${Date.now()}`);
  await panel.getByLabel('Email').fill(email);
  await panel.getByLabel('Password', { exact: true }).fill('correct horse battery');
  await panel.getByRole('button', { name: 'Create account' }).click();
  await expect(dialog).toBeHidden();
  // pending save completes automatically after sign-up
  await expect(page.getByRole('button', { name: /On your shelf/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Shelf \(1 book\)/ })).toBeVisible();
  await page.getByRole('link', { name: /Shelf/ }).click();
  await expect(page).toHaveURL(/\/shelf$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect(page.getByRole('article', { name: 'Dune' })).toBeVisible();
  await page.getByRole('button', { name: 'Remove Dune from your shelf' }).click();
  await expect(page.getByRole('heading', { name: 'Your shelf is empty.' })).toBeVisible();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByRole('article', { name: 'Dune' })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in to see your shelf.' })).toBeVisible();
  await page.getByRole('main').getByRole('button', { name: 'Sign in' }).click();
  const login = page.getByRole('tabpanel', { name: 'Sign in' });
  await login.getByLabel('Email').fill(email.toUpperCase());
  await login.getByLabel('Password', { exact: true }).fill('wrong password!');
  await login.getByRole('button', { name: 'Sign in' }).click();
  await expect(login.getByRole('alert')).toHaveText('Incorrect email or password.');
  await login.getByLabel('Password', { exact: true }).fill('correct horse battery');
  await login.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('article', { name: 'Dune' })).toBeVisible();
  await page.screenshot({ path: '/workspace/readr-shots/smoke-shelf.png' });
});
