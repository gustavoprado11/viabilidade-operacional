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
  'preview mostra projeção diária (Produção e Financeiro)',
  async ({ page }) => {
    await loginE2E(page);
    await page.goto('/laminas/nova');
    await expect(page.getByTestId('card-producao')).toBeVisible({ timeout: 10_000 });

    const producao = page.getByTestId('card-producao');
    await expect(producao.getByTestId('projecao-diaria-header')).toBeVisible();
    await expect(producao).toContainText('Gusa vazado/dia');
    await expect(producao).toContainText('Sucata gerada/dia');
    await expect(producao).toContainText('Produção total/dia');
    await expect(producao).toContainText('Corridas por dia');

    const financeiro = page.getByTestId('card-financeiro');
    await expect(financeiro).toContainText('Resultado/dia');
    await expect(financeiro).toContainText(/Projeção:.*corridas\/dia/);
  },
);

(E2E_READY ? test : test.skip)(
  'editar cargas/peso do carvão recalcula MDC em tempo real',
  async ({ page }) => {
    await loginE2E(page);
    await page.goto('/laminas/nova');
    await expect(page.getByTestId('card-producao')).toBeVisible({ timeout: 10_000 });

    const mdcBox = page.getByTestId('carvao-mdc-calculado');
    const mdcAntes = await mdcBox.innerText();

    await page.getByTestId('carvao-cargas').fill('10');
    await page.getByTestId('carvao-peso-carga').fill('500');
    // (10 × 500) / 220 = 22.73
    await expect(mdcBox).toContainText('22,73');
    expect(mdcAntes).not.toContain('22,73');
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
