import { expect, test, type Page, type Route } from '@playwright/test';

interface FrequencyPayload {
  gameName: string;
  hot: number;
  cold: number;
}

function frequencyResponse(payload: FrequencyPayload) {
  return {
    status: 200,
    message: 'Success',
    action_at: '2026-11-19T07:00:00.000Z',
    data: {
      gameName: payload.gameName,
      totalDrawsAnalyzed: 128,
      hotNumbers: [{ number: payload.hot, count: 22 }],
      coldNumbers: [{ number: payload.cold, count: 3 }],
    },
  };
}

function oddEvenResponse() {
  return {
    status: 200,
    message: 'Success',
    action_at: '2026-11-19T07:00:00.000Z',
    data: {
      gameName: '6/58',
      totalDrawsAnalyzed: 128,
      distribution: [
        {
          pattern: '3 Odd / 3 Even',
          odd: 3,
          even: 3,
          count: 40,
          percentage: 31.25,
        },
      ],
    },
  };
}

function sumDistributionResponse() {
  return {
    status: 200,
    message: 'Success',
    action_at: '2026-11-21T02:59:12.823Z',
    data: {
      gameName: '6/58',
      totalDrawsAnalyzed: 128,
      distribution: [
        {
          range: '100 - 129',
          count: 5,
          minSum: 100,
          maxSum: 128,
          avgSum: 118.2,
          percentage: 13.16,
        },
      ],
    },
  };
}

async function fulfillFrequency(route: Route, delayMs = 0) {
  const url = new URL(route.request().url());
  const encodedGame = url.pathname.split('/').pop() ?? '';
  const game = decodeURIComponent(encodedGame);
  const payload =
    game === '6/49'
      ? frequencyResponse({ gameName: game, hot: 27, cold: 8 })
      : frequencyResponse({ gameName: game, hot: 12, cold: 4 });

  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });
}

async function openDashboard(page: Page, delayMs = 0) {
  await page.route('**/stats/frequency/**', (route) => fulfillFrequency(route, delayMs));
  await page.route('**/stats/odd-even/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(oddEvenResponse()),
    }),
  );
  await page.route('**/stats/sum-distribution/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(sumDistributionResponse()),
    }),
  );
  await page.goto('/');
  await page.getByRole('tab', { name: 'Analytics & Smart Picks' }).click();
}

test('selecting a game loads hot and cold stats', async ({ page }) => {
  const requested: string[] = [];

  await page.route('**/stats/frequency/**', async (route) => {
    requested.push(route.request().url());
    await fulfillFrequency(route);
  });
  await page.route('**/stats/odd-even/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(oddEvenResponse()),
    }),
  );
  await page.route('**/stats/sum-distribution/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(sumDistributionResponse()),
    }),
  );

  await page.goto('/');
  await page.getByRole('tab', { name: 'Analytics & Smart Picks' }).click();

  await expect(page.getByTestId('stats-panel')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hot numbers' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cold numbers' })).toBeVisible();
  await expect(page.getByTestId('hot-numbers')).toContainText('12');
  await expect(page.getByTestId('cold-numbers')).toContainText('04');

  await page.getByLabel('Lotto game').selectOption('6/49');

  await expect(page.getByTestId('hot-numbers')).toContainText('27');
  await expect(page.getByTestId('cold-numbers')).toContainText('08');
  await expect(page.getByLabel('Lotto game')).toHaveValue('6/49');
  await expect(page.getByText(/Showing results for/)).toContainText('Super Lotto 6/49');

  expect(requested.some((url) => url.includes('/stats/frequency/6%2F49'))).toBe(true);
});

test('shows a loading spinner while frequency stats are in flight', async ({ page }) => {
  await openDashboard(page, 600);

  await expect(page.getByTestId('stats-loading')).toBeVisible();
  await expect(page.getByText('Loading statistics for Ultra Lotto 6/58')).toBeVisible();
  await expect(page.getByTestId('hot-numbers')).toContainText('12');
});

test('shows a Bad Request alert when frequency returns 400', async ({ page }) => {
  await page.route('**/stats/frequency/**', (route) =>
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        statusCode: 400,
        message: 'Invalid game: 6/99. Supported games are: 6/58, 6/55, 6/49, 6/45, 6/42.',
        error: 'Bad Request',
      }),
    }),
  );
  await page.route('**/stats/odd-even/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(oddEvenResponse()),
    }),
  );
  await page.route('**/stats/sum-distribution/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(sumDistributionResponse()),
    }),
  );

  await page.goto('/');
  await page.getByRole('tab', { name: 'Analytics & Smart Picks' }).click();

  const alert = page.getByTestId('frequency-error');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText('Bad Request');
  await expect(page.getByTestId('stats-panel')).toHaveCount(0);
});
