import { expect, test, type Page, type Route } from '@playwright/test';

const sumDistributionResponse = {
  status: 200,
  message: 'Success',
  action_at: '2026-11-21T02:59:12.823Z',
  data: {
    gameName: '6/55',
    totalDrawsAnalyzed: 38,
    distribution: [
      {
        range: '100 - 129',
        count: 5,
        minSum: 100,
        maxSum: 128,
        avgSum: 118.2,
        percentage: 13.16,
      },
      {
        range: '130 - 159',
        count: 14,
        minSum: 134,
        maxSum: 157,
        avgSum: 145.9,
        percentage: 36.84,
      },
    ],
  },
};

async function openAnalytics(
  page: Page,
  sumRoute: (route: Route) => Promise<void> = (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(sumDistributionResponse),
    }),
) {
  await page.route('**/stats/frequency/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 200,
        message: 'Success',
        action_at: '2026-11-21T02:59:12.823Z',
        data: {
          gameName: '6/58',
          totalDrawsAnalyzed: 38,
          hotNumbers: [],
          coldNumbers: [],
        },
      }),
    }),
  );
  await page.route('**/stats/odd-even/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 200,
        message: 'Success',
        action_at: '2026-11-21T02:59:12.823Z',
        data: {
          gameName: '6/58',
          totalDrawsAnalyzed: 38,
          distribution: [],
        },
      }),
    }),
  );
  await page.route('**/stats/sum-distribution/**', sumRoute);
  await page.goto('/');
  await page.getByRole('tab', { name: 'Analytics & Smart Picks' }).click();
}

test('renders sum distribution bars and range details', async ({ page }) => {
  let requestedUrl = '';
  page.on('request', (request) => {
    if (request.url().includes('/stats/sum-distribution/')) {
      requestedUrl = request.url();
    }
  });
  await openAnalytics(page);

  const card = page.getByTestId('sum-distribution-card');
  await expect(page.getByTestId('sum-distribution-total')).toContainText(
    '38 draws analyzed',
  );
  await expect(card.getByTestId('sum-distribution-progress')).toHaveCount(2);
  await expect(
    card.getByTestId('sum-distribution-progress').nth(0).locator('.progress-bar'),
  ).toHaveAttribute('aria-valuenow', '13.16');
  await expect(
    card.getByTestId('sum-distribution-progress').nth(1).locator('.progress-bar'),
  )
    .toHaveAttribute('aria-valuenow', '36.84');
  await expect(
    card.getByTestId('sum-distribution-progress').nth(1).locator('.progress-bar'),
  ).toHaveClass(/bg-warning/);

  const rows = card.getByTestId('sum-distribution-table-row');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText('100 - 129');
  await expect(rows.nth(0)).toContainText('5');
  await expect(rows.nth(1)).toContainText('130 - 159');
  await expect(rows.nth(1)).toContainText('14');

  await card.getByRole('button', { name: 'Details for 130 - 159' }).hover();
  await expect(page.getByRole('tooltip')).toContainText('Minimum: 134');
  await expect(page.getByRole('tooltip')).toContainText('Maximum: 157');
  await expect(page.getByRole('tooltip')).toContainText('Average: 145.9');
  expect(new URL(requestedUrl).pathname).toContain(
    '/stats/sum-distribution/6%2F58',
  );
});

test('shows loading state while sum distribution is loading', async ({ page }) => {
  await openAnalytics(page, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(sumDistributionResponse),
    });
  });

  await expect(page.getByTestId('sum-distribution-loading')).toBeVisible();
  await expect(page.getByTestId('sum-distribution-table')).toBeVisible();
});

test('shows a danger alert when sum distribution request fails', async ({
  page,
}) => {
  await openAnalytics(page, (route) =>
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        statusCode: 400,
        message: 'Unsupported lotto game.',
        error: 'Bad Request',
      }),
    }),
  );

  await expect(page.getByTestId('sum-distribution-error')).toContainText(
    'Bad Request',
  );
});
