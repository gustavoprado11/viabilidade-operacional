/**
 * Fluxo 3 (PRD §5): registrar corrida real baseada em simulação.
 *
 * Cria simulação → /corridas/nova?origem=<id> → preenche timestamp →
 * salva → /corridas/[id] com vínculo → preenche análise química →
 * desvios recalculam → aparece em /corridas.
 */

import { expect, test } from '@playwright/test';

import { E2E_READY, loginE2E } from './helpers/auth';

function ts() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

(E2E_READY ? test : test.skip)(
  'fluxo 3: registrar corrida real vinculada a simulação',
  async ({ page }) => {
    test.setTimeout(90_000);
    await loginE2E(page);

    const nomeSim = `F3Sim_${Date.now()}`;
    const nomeCor = `F3Cor_${Date.now()}`;

    // Cria simulação
    await page.goto('/laminas/nova');
    await page.getByLabel('Nome').fill(nomeSim);
    await expect(page.getByTestId('card-producao')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('submit').click();
    await page.waitForURL(/\/laminas\/([0-9a-f-]+)$/, { timeout: 15_000 });
    const simId = page.url().match(/\/laminas\/([0-9a-f-]+)/)![1]!;

    // Cria corrida com vínculo
    await page.goto(`/corridas/nova?origem=${simId}`);
    await page.getByLabel('Nome').fill(nomeCor);
    await page.getByLabel('Data/hora da corrida').fill(ts());
    await page.getByTestId('submit').click();
    await page.waitForURL(/\/corridas\/[0-9a-f-]+$/, { timeout: 15_000 });

    // Vínculo com simulação visível
    await expect(page.getByTestId('vinculo-simulacao')).toContainText(nomeSim);

    // Preenche análise química parcial
    await page.getByLabel('P', { exact: false }).first().fill('0.11');
    await page.getByLabel('B2').fill('0.82');
    await page.getByTestId('salvar-analise').click();

    // Desvios recalculam
    await expect(page.getByTestId('desvios-card')).toContainText('Comparação entre snapshot', {
      timeout: 10_000,
    });

    // Aparece em /corridas com análise registrada
    await page.goto('/corridas');
    const row = page.getByTestId(`corrida-row-${nomeCor}`);
    await expect(row).toBeVisible();
    await expect(row).toContainText('registrada');
  },
);
