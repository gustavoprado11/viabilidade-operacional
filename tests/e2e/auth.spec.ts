import { expect, test } from '@playwright/test';

import { E2E_READY, loginE2E } from './helpers/auth';

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

(E2E_READY ? test : test.skip)(
  'login válido redireciona para /',
  async ({ page }) => {
    await loginE2E(page);
    await expect(page.getByText('Bem-vindo ao sistema')).toBeVisible();
  },
);
