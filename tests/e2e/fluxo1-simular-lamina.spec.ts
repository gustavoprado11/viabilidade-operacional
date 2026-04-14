/**
 * Fluxo 1 (PRD §5): simular uma lâmina antes de carregar o forno.
 *
 * Login → /laminas/nova → preencher → preview renderiza 4 cards →
 * salvar → redireciona /laminas/[id] → aparece em /laminas.
 */

import { expect, test } from '@playwright/test';

import { E2E_READY, loginE2E } from './helpers/auth';

(E2E_READY ? test : test.skip)('fluxo 1: simular lâmina ponta-a-ponta', async ({ page }) => {
  await loginE2E(page);

  const nome = `F1_${Date.now()}`;

  await page.goto('/laminas/nova');
  await page.getByLabel('Nome').fill(nome);

  // Preview renderiza 4 cards (blend default 33/33/34 já soma 100)
  await expect(page.getByTestId('card-producao')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('card-escoria')).toBeVisible();
  await expect(page.getByTestId('card-gusa')).toBeVisible();
  await expect(page.getByTestId('card-financeiro')).toBeVisible();

  // Banner de classificação presente
  const banner = page.locator('[data-testid^="classificacao-"]').first();
  await expect(banner).toBeVisible();

  // Salvar
  await page.getByTestId('submit').click();
  await page.waitForURL(/\/laminas\/[0-9a-f-]+$/, { timeout: 15_000 });

  // Listagem
  await page.goto('/laminas');
  await expect(page.getByTestId(`lamina-row-${nome}`)).toBeVisible();
});
