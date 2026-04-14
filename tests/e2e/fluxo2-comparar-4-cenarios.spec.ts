/**
 * Fluxo 2 (PRD §5): comparar 4 cenários de blend.
 *
 * Cria 4 simulações → /laminas/comparar → seleciona 4 → tabela + gráficos →
 * export CSV baixa arquivo.
 */

import { expect, test } from '@playwright/test';

import { E2E_READY, loginE2E } from './helpers/auth';

(E2E_READY ? test : test.skip)(
  'fluxo 2: comparar 4 cenários de blend',
  async ({ page }) => {
    test.setTimeout(90_000);
    await loginE2E(page);

    const base = Date.now();
    const nomes = [`F2_A_${base}`, `F2_B_${base}`, `F2_C_${base}`, `F2_D_${base}`];

    for (const nome of nomes) {
      await page.goto('/laminas/nova');
      await page.getByLabel('Nome').fill(nome);
      await expect(page.getByTestId('card-producao')).toBeVisible({ timeout: 10_000 });
      await page.getByTestId('submit').click();
      await page.waitForURL(/\/laminas\/[0-9a-f-]+$/, { timeout: 15_000 });
    }

    await page.goto('/laminas/comparar');
    await page.getByTestId('abrir-seletor').click();
    for (const nome of nomes) {
      await page.getByTestId(`check-${nome}`).check();
    }
    await page.getByTestId('aplicar-selecao').click();
    await page.waitForURL(/\/laminas\/comparar\?ids=/, { timeout: 10_000 });

    // Resumo + 4 colunas
    await expect(page.getByTestId('resumo-classificacao')).toBeVisible();
    for (const nome of nomes) {
      await expect(page.getByRole('cell', { name: nome })).toBeVisible();
    }

    // Export CSV
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-csv').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^comparativo-laminas-\d{4}-\d{2}-\d{2}-\d{4}\.csv$/);
  },
);
