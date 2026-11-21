import { expect, test, type Page } from '@playwright/test';

const oddEvenResponse = {
  status: 200,
  message: 'Success',
  action_at: '2026-11-21T03:01:15.318Z',
  data: {
    gameName: '6/58',
    totalDrawsAnalyzed: 138,
    distribution: [
      {
        pattern: '2 Odd / 4 Even',
        odd: 2,
        even: 4,
        count: 41,
        percentage: 29.71,
      },
      {
        pattern: '3 Odd / 3 Even',
        odd: 3,
        even: 3,
        count: 38,
        percentage: 27.54,
      },
    ],
  },
};

async function openAnalytics(page: Page) {
  await page.route('**/stats/frequency/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 200,
        message: 'Success',
        action_at: '2026-11-21T03:01:15.318Z',
        data: {
          gameName: '6/58',
          totalDrawsAnalyzed: 138,
          hotNumbers: [{ number: 12, count: 22 }],
          coldNumbers: [{ number: 4, count: 3 }],
        },
      }),
    }),
  );

  await page.goto('/');
  await page.getByRole('tab', { name: 'Analytics & Smart Picks' }).click();
}

test('renders odd/even distribution from the API response', async ({ page }) => {
  let requestedUrl = '';
  await page.route('**/stats/odd-even/**', async (route) => {
    requestedUrl = route.request().url();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(oddEvenResponse),
    });
  });
  await openAnalytics(page);

  const card = page.getByTestId('odd-even-patterns');
  await expect(page.getByTestId('odd-even-total')).toContainText('138 draws');
  await expect(card.getByTestId('odd-even-pattern')).toHaveCount(2);
  await expect(card).toContainText('2 Odd / 4 Even');
  await expect(card).toContainText('41');
  await expect(
    card.getByTestId('odd-even-progress').first().locator('.progress-bar'),
  ).toHaveAttribute('aria-valuenow', '29.71');
  await expect(card).toContainText('3 Odd / 3 Even');
  await expect(card).toContainText('38');
  expect(new URL(requestedUrl).pathname).toContain('/stats/odd-even/6%2F58');
});

test('shows loading state while odd/even distribution is loading', async ({
  page,
}) => {
  await page.route('**/stats/odd-even/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(oddEvenResponse),
    });
  });
  await openAnalytics(page);

  await expect(page.getByTestId('odd-even-loading')).toBeVisible();
  await expect(page.getByTestId('odd-even-patterns')).toBeVisible();
});

test('shows a danger alert when odd/even request fails', async ({ page }) => {
  await page.route('**/stats/odd-even/**', (route) =>
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        statusCode: 400,
        message: 'Invalid game.',
        error: 'Bad Request',
      }),
    }),
  );
  await openAnalytics(page);

  await expect(page.getByTestId('odd-even-error')).toContainText('Bad Request');
});
