import { expect, test } from '@playwright/test';

test('redireciona para /login sem sessão', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
});

test('credenciais inválidas mostram mensagem de erro', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('naoexiste@teste.com');
  await page.getByLabel('Senha').fill('senhaerrada123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByTestId('login-error')).toBeVisible({ timeout: 10_000 });
});

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;

(email && password ? test : test.skip)(
  'login válido redireciona para /',
  async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(email!);
    await page.getByLabel('Senha').fill(password!);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL('http://localhost:3000/', { timeout: 15_000 });
    await expect(page.getByText('Bem-vindo ao sistema')).toBeVisible();
  },
);
