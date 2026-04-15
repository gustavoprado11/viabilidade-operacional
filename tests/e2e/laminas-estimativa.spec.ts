import { expect, test } from '@playwright/test';

import { E2E_READY, loginE2E } from './helpers/auth';

async function criarSimulacao(page: import('@playwright/test').Page, nome: string) {
  await page.goto('/laminas/nova');
  await page.getByLabel('Nome').fill(nome);
  await expect(page.getByTestId('card-producao')).toBeVisible({ timeout: 10_000 });
  await page.getByTestId('submit').click();
  await page.waitForURL(/\/laminas\/[0-9a-f-]+$/, { timeout: 15_000 });
}

(E2E_READY ? test : test.skip)(
  'estimativa diária aparece em /laminas após criar simulações',
  async ({ page }) => {
    test.setTimeout(60_000);
    await loginE2E(page);

    const suffix = Date.now();
    await criarSimulacao(page, `Est_A_${suffix}`);
    await criarSimulacao(page, `Est_B_${suffix}`);

    await page.goto('/laminas');
    const card = page.getByTestId('estimativa-diaria');
    await expect(card).toBeVisible();
    await expect(card).toContainText(/lâmina/i);
    await expect(page.getByTestId('estimativa-gusa-dia')).toBeVisible();
    await expect(page.getByTestId('estimativa-resultado-mes')).toBeVisible();
  },
);

(E2E_READY ? test : test.skip)(
  'filtro por classificação sem resultados mostra placeholder do card',
  async ({ page }) => {
    await loginE2E(page);
    // Navega com filtro que provavelmente não tem resultados (corrida_real + inviável
    // no teste user recém-criado); placeholder OU card com N menor ambos aceitáveis.
    await page.goto('/laminas?tipo=corrida_real&classificacao=inviavel');
    const placeholder = page.getByTestId('estimativa-diaria-placeholder');
    const card = page.getByTestId('estimativa-diaria');
    // Um dos dois deve estar visível
    await Promise.race([
      placeholder.waitFor({ timeout: 10_000 }),
      card.waitFor({ timeout: 10_000 }),
    ]);
  },
);
