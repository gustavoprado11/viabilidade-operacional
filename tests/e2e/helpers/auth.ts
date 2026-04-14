import type { Page } from '@playwright/test';

export const E2E_EMAIL = process.env.E2E_USER_EMAIL ?? '';
export const E2E_PASSWORD = process.env.E2E_USER_PASSWORD ?? '';

export const E2E_READY = !!(
  E2E_EMAIL && E2E_PASSWORD && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Loga o usuário E2E. Todos os specs devem começar por isto — a conta
 * é isolada (ver scripts/bootstrap-e2e-user.ts + tests/e2e/helpers/cleanup.ts).
 */
export async function loginE2E(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(E2E_EMAIL);
  await page.getByLabel('Senha').fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('http://localhost:3000/', { timeout: 15_000 });
}
