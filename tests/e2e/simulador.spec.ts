import { expect, test } from '@playwright/test';

import { E2E_READY, loginE2E } from './helpers/auth';

(E2E_READY ? test : test.skip)(
  'criar simulação → preview atualiza → salvar → aparece em /laminas',
  async ({ page }) => {
    await loginE2E(page);
    await page.goto('/laminas/nova');

    const nome = `Sim_${Date.now()}`;
    await page.getByLabel('Nome').fill(nome);

    await expect(page.getByTestId('card-producao')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('card-escoria')).toBeVisible();
    await expect(page.getByTestId('card-gusa')).toBeVisible();
    await expect(page.getByTestId('card-financeiro')).toBeVisible();

    await page.getByTestId('submit').click();
    await Promise.race([
      page.waitForURL(/\/laminas\/[0-9a-f-]+$/, { timeout: 15_000 }),
      page.getByTestId('form-error').waitFor({ timeout: 15_000 }).then(async () => {
        const msg = await page.getByTestId('form-error').innerText();
        throw new Error(`Form error: ${msg}`);
      }),
    ]);

    await page.goto('/laminas');
    await expect(page.getByTestId(`lamina-row-${nome}`)).toBeVisible();
  },
);

(E2E_READY ? test : test.skip)(
  'blend inválido (soma ≠ 100) desabilita submit',
  async ({ page }) => {
    await loginE2E(page);
    await page.goto('/laminas/nova');
    const first = page.getByLabel('pct 0');
    await first.fill('42');
    await expect(page.getByTestId('blend-error')).toBeVisible();
    await expect(page.getByTestId('submit')).toBeDisabled();
  },
);

(E2E_READY ? test : test.skip)(
  'corrida real exige timestamp',
  async ({ page }) => {
    await loginE2E(page);
    await page.goto('/laminas/nova');
    await page.getByLabel('Corrida real').check();
    await expect(page.getByLabel('Data/hora da corrida')).toBeVisible();
  },
);
