import { expect, test } from '@playwright/test';

const sampleDraw = {
  gameName: 'Ultra Lotto 6/58',
  type: 'lotto',
  numbers: [4, 18, 22, 35, 41, 53],
  drawDate: '2026-11-19T00:00:00.000Z',
  jackpot: 120000000,
  winners: 3,
};

function drawResponse(data: typeof sampleDraw[] = [sampleDraw]) {
  return {
    status: 200,
    message: 'Success',
    action_at: '2026-11-20T02:00:00.000Z',
    data,
  };
}

test('opens Recent Draw Results and renders filtered draw details', async ({
  page,
}) => {
  const requestedUrls: string[] = [];
  await page.route('**/lotto/draws/**', async (route) => {
    requestedUrls.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(drawResponse()),
    });
  });

  await page.goto('/');
  const coffeeButton = page.getByRole('contentinfo').getByTestId('buy-coffee-button');
  await expect(coffeeButton).toHaveAttribute(
    'href',
    'https://buymeacoffee.com/mrenyrab',
  );
  await expect(coffeeButton).toHaveAttribute('target', '_blank');
  await expect(page.getByTestId('app-disclaimer')).toHaveText(
    'This website is an independent statistical dashboard and is not affiliated with, endorsed by, or connected to the Philippine Charity Sweepstakes Office (PCSO).',
  );
  await page.getByRole('tab', { name: 'Recent Draw Results' }).click();

  await expect(page.getByRole('heading', { name: 'Lotto Results Log' })).toBeVisible();
  await expect(page.getByLabel('From Date')).toBeVisible();
  await expect(page.getByLabel('To Date')).toBeVisible();
  await expect(page.getByLabel('Lotto game')).toHaveValue('6/58');
  const defaultToDate = await page.getByLabel('To Date').inputValue();
  await expect(page.getByLabel('From Date')).toHaveValue(
    `${defaultToDate.slice(0, 7)}-01`,
  );

  await page.getByLabel('From Date').fill('2026-11-18');
  await page.getByLabel('To Date').fill('2026-11-19');
  await page.getByRole('button', { name: 'Filter' }).click();

  await expect(page.getByTestId('draw-results')).toContainText('Ultra Lotto 6/58');
  await expect(page.getByTestId('draw-results')).toContainText('November 19, 2026');
  await expect(page.getByTestId('draw-results')).toContainText('₱120,000,000');
  await expect(page.getByLabel('Winning numbers')).toContainText('04');
  await expect(page.getByTestId('draw-results')).toContainText('3');
  expect(
    requestedUrls.some((url) => {
      const requestUrl = new URL(url);
      return (
        requestUrl.pathname.endsWith('/6%2F58') &&
        requestUrl.searchParams.get('from') === '2026-11-18' &&
        requestUrl.searchParams.get('to') === '2026-11-19'
      );
    }),
  ).toBe(true);
});

test('shows a loading overlay while results are being fetched', async ({ page }) => {
  await page.route('**/lotto/draws/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2600));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(drawResponse([])),
    });
  });

  await page.goto('/');
  await page.getByRole('tab', { name: 'Recent Draw Results' }).click();

  await expect(page.getByTestId('results-loading')).toBeVisible();
  await expect(page.getByTestId('results-backend-wakeup')).toBeVisible();
  await expect(page.getByTestId('results-alert')).toContainText('No draw results');
});

test('shows a dismissible alert when the results endpoint fails', async ({
  page,
}) => {
  await page.route('**/lotto/draws/**', (route) =>
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        statusCode: 400,
        message: 'Invalid draw date.',
        error: 'Bad Request',
      }),
    }),
  );

  await page.goto('/');
  await page.getByRole('tab', { name: 'Recent Draw Results' }).click();

  const alert = page.getByTestId('results-alert');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText('Bad Request');
  await alert.getByRole('button', { name: 'Close' }).click();
  await expect(alert).toHaveCount(0);
});
