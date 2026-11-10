import { expect, test } from '@playwright/test';
import { dueDate } from '../../src/lib/emprestimos';

test('CA-003-01 CA-003-02 CA-003-03 colaborador entra, consulta o catálogo e solicita um item', async ({ page, context }) => {
  const password = process.env.CATALOGO_TEST_PASSWORD;
  if (!password) throw new Error('Senha descartável do cenário ausente.');

  await page.goto('/login');
  await page.getByLabel('E-mail').fill('colaborador@example.test');
  await page.getByLabel('Senha').fill(password);
  const login = page.waitForResponse((response) => response.url().includes('/api/trpc/auth.login'));
  await page.getByRole('button', { name: 'Entrar' }).click();
  expect((await login).status()).toBe(200);
  await expect(page).toHaveURL(/\/catalogo$/);
  await expect(page.getByRole('heading', { name: 'Catálogo', exact: true })).toBeVisible();
  const sessionCookies = (await context.cookies()).filter(({ name }) => /^sb-.*-auth-token(?:\.\d+)?$/.test(name));
  expect(sessionCookies.length).toBeGreaterThan(0);
  expect(sessionCookies.every(({ httpOnly }) => httpOnly)).toBe(true);

  const catalog = page.locator('.equipment-grid');
  const cards = catalog.getByRole('link');
  await expect(cards).toHaveCount(12);
  for (const card of await cards.all()) {
    await card.scrollIntoViewIfNeeded();
    await expect(card.getByRole('img')).toHaveJSProperty('naturalWidth', 800);
  }
  const available = catalog.getByRole('link', { name: /TI-0001/ });
  await expect(available.getByText('notebook · TI-0001')).toBeVisible();
  await expect(available.getByText('Disponível', { exact: true })).toBeVisible();
  const maintenance = catalog.getByRole('link', { name: /TI-0004/ });
  await expect(maintenance.getByText('Em manutenção')).toBeVisible();
  await expect(page.getByRole('link', { name: /Fotos: Pixabay/ })).toHaveCount(0);

  const availableOnly = page.getByRole('checkbox', { name: 'Só disponíveis' });
  await availableOnly.check();
  await expect(cards).toHaveCount(10);
  await expect(maintenance).toHaveCount(0);

  await available.click();
  await expect(page.getByRole('heading', { name: 'Notebook 14 polegadas' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Notebook 14 polegadas' })).toHaveJSProperty('naturalWidth', 800);
  await page.getByRole('button', { name: 'Solicitar empréstimo', exact: true }).click();
  const confirmation = page.getByRole('dialog', { name: 'Confirmar empréstimo' });
  await expect(confirmation.getByText(/Previsão de devolução/)).toBeVisible();
  const earliest = dueDate(new Date()).getTime();
  await confirmation.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page).toHaveURL(/\/meus-emprestimos$/);
  const loan = page.getByRole('listitem').filter({ hasText: 'TI-0001' });
  await expect(loan.getByRole('link', { name: 'Notebook 14 polegadas' })).toBeVisible();
  const due = Date.parse(await loan.locator('time').getAttribute('datetime') ?? '');
  expect(due).toBeGreaterThanOrEqual(earliest);
  expect(due).toBeLessThanOrEqual(dueDate(new Date()).getTime());

  await page.goto('/catalogo');
  await expect(available.getByText('Emprestado', { exact: true })).toBeVisible();
  await availableOnly.check();
  await expect(cards).toHaveCount(9);
  await expect(available).toHaveCount(0);
});
