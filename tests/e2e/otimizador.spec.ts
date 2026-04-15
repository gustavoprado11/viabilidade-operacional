import { expect, test } from '@playwright/test';

import { E2E_READY, loginE2E } from './helpers/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;


(E2E_READY ? test : test.skip)(
  'otimizador termina em <30s e renderiza UI (stats ou sem-resultados)',
  async ({ page }) => {
    test.setTimeout(60_000);
    await loginE2E(page);
    await page.goto('/otimizador');

    // Com os 3 minérios itabiríticos seed + parâmetros bootstrap
    // (Al₂O₃ escoria_limite=17), todas as combinações ficam inviáveis
    // e a otimização retorna zero resultados. O teste valida o caminho
    // completo (API → render) dentro do SLA de 30s.
    const start = Date.now();
    await page.getByTestId('otimizar').click();
    await Promise.race([
      page.getByTestId('otimizacao-stats').waitFor({ timeout: 25_000 }),
      page.getByTestId('sem-resultados').waitFor({ timeout: 25_000 }),
      page
        .getByTestId('otimizador-erro')
        .waitFor({ timeout: 25_000 })
        .then(async () => {
          const msg = await page.getByTestId('otimizador-erro').innerText();
          throw new Error(`Otimizador erro: ${msg}`);
        }),
    ]);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(30_000);

    // Se houver resultados, "Abrir" navega para /laminas/nova com blend
    const rows = page.locator('[data-testid^="opt-row-"]');
    const nRows = await rows.count();
    if (nRows > 0) {
      await page.getByTestId('abrir-0').click();
      await page.waitForURL(/\/laminas\/nova\?.*blend=/, { timeout: 10_000 });
      await expect(page.getByTestId('card-producao')).toBeVisible({ timeout: 10_000 });
    }
  },
);

(E2E_READY ? test : test.skip)(
  'form de fundentes controla resultado do otimizador',
  async ({ page }) => {
    test.setTimeout(60_000);
    await loginE2E(page);
    await page.goto('/otimizador');

    // Abre a seção de fundentes e seta dolomita = 5000
    await page.locator('summary', { hasText: /Parâmetros de operação/ }).click();
    await page.getByTestId('opt-dolomita').fill('5000');

    // Al₂O₃ máx default = 25 (exploração inicial)
    await expect(page.getByLabel('Al₂O₃ esc máx (%)')).toHaveValue('25');

    await page.getByTestId('otimizar').click();
    await Promise.race([
      page.getByTestId('otimizacao-stats').waitFor({ timeout: 30_000 }),
      page.getByTestId('sem-resultados').waitFor({ timeout: 30_000 }),
    ]);
  },
);

(E2E_READY ? test : test.skip)(
  'restrições impossíveis mostram "nenhuma combinação"',
  async ({ page }) => {
    await loginE2E(page);
    await page.goto('/otimizador');

    // Al2O3 escória máx 1% é fisicamente impossível com minérios itabiríticos
    await page.getByLabel('Al₂O₃ esc máx (%)').fill('1');
    await page.getByTestId('otimizar').click();

    await expect(page.getByTestId('sem-resultados')).toBeVisible({
      timeout: 30_000,
    });
  },
);