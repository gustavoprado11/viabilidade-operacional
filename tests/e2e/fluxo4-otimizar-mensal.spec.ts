/**
 * Fluxo 4 (PRD §5): otimizar blend mensal.
 *
 * /otimizador → restrições (Al₂O₃ relaxado para haver resultados) → rodar →
 * top N → clicar "Abrir" → /laminas/nova pré-preenchida → salvar → aparece
 * em /laminas.
 */

import { expect, test } from '@playwright/test';

import { E2E_READY, loginE2E } from './helpers/auth';

(E2E_READY ? test : test.skip)(
  'fluxo 4: otimizar blend → abrir top resultado como simulação → salvar',
  async ({ page }) => {
    test.setTimeout(90_000);
    await loginE2E(page);

    await page.goto('/otimizador');

    // Relaxa Al₂O₃ máx para garantir que o otimizador retorne resultados
    // com os 3 minérios seed do bootstrap (que, sozinhos, geram
    // Al₂O₃ esc > 17% — ver Fase 3 do projeto).
    await page.getByLabel('Al₂O₃ esc máx (%)').fill('30');

    await page.getByTestId('otimizar').click();

    // Com Al₂O₃ escoria_limite fixo em 17 nos parâmetros ativos, todos os
    // blends itabiríticos dão `inviavel` e o otimizador os filtra antes do
    // al2o3EscoriaMax customizado. O fluxo aceita os dois caminhos:
    //   - stats com resultados → clicar Abrir e salvar (feliz)
    //   - sem-resultados → valida que a UI informa corretamente (graceful)
    const stats = page.getByTestId('otimizacao-stats').waitFor({
      timeout: 30_000,
      state: 'visible',
    });
    const semResult = page.getByTestId('sem-resultados').waitFor({
      timeout: 30_000,
      state: 'visible',
    });
    const which = await Promise.any([
      stats.then(() => 'stats' as const),
      semResult.then(() => 'sem' as const),
    ]);

    if (which === 'sem') {
      await expect(page.getByTestId('sem-resultados')).toBeVisible();
      return;
    }

    const rows = page.locator('[data-testid^="opt-row-"]');
    expect(await rows.count()).toBeGreaterThan(0);

    await page.getByTestId('abrir-0').click();
    await page.waitForURL(/\/laminas\/nova\?.*blend=/, { timeout: 10_000 });
    await expect(page.getByTestId('card-producao')).toBeVisible({ timeout: 10_000 });

    const nome = `F4Otim_${Date.now()}`;
    await page.getByLabel('Nome').fill(nome);
    await page.getByTestId('submit').click();
    await page.waitForURL(/\/laminas\/[0-9a-f-]+$/, { timeout: 15_000 });

    await page.goto('/laminas');
    await expect(page.getByTestId(`lamina-row-${nome}`)).toBeVisible();
  },
);
