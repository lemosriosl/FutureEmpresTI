import { expect, test } from '@playwright/test';

test('CA-003-01 rota autenticada redireciona visitante para o formulário de login', async ({ page }) => {
  await page.goto('/catalogo');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
  await expect(page.getByLabel('E-mail')).toBeEditable();
  await expect(page.getByLabel('Senha')).toBeEditable();
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
});

test('CA-003-01 mutação de outra origem recebe 403', async ({ request }) => {
  const response = await request.post('/api/trpc/auth.login', {
    headers: { origin: 'https://origem-externa.invalid' },
    data: {},
  });
  expect(response.status()).toBe(403);
});

test('CA-003-01 formulário envia credenciais ao endpoint da mesma origem', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('colaborador@example.test');
  await page.getByLabel('Senha').fill('fixture-local');
  const response = page.waitForResponse((res) => res.url().includes('/api/trpc/auth.login'));
  await page.getByRole('button', { name: 'Entrar' }).click();
  expect((await response).status()).toBe(503);
  await expect(page.locator('form').getByRole('alert'))
    .toHaveText('O serviço de login está indisponível. Tente novamente.');
});
