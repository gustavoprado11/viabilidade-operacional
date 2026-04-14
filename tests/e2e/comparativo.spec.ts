import { createClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';

import { E2E_READY, loginE2E } from './helpers/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function criarSimulacao(page: import('@playwright/test').Page, nome: string) {
  await page.goto('/laminas/nova');
  await page.getByLabel('Nome').fill(nome);
  await expect(page.getByTestId('card-producao')).toBeVisible({ timeout: 10_000 });
  await page.getByTestId('submit').click();
  await page.waitForURL(/\/laminas\/[0-9a-f-]+$/, { timeout: 15_000 });
}

(E2E_READY ? test : test.skip)(
  'selecionar 2 lâminas → comparativo → exportar CSV → remover 1',
  async ({ page }) => {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const nomeA = `CmpA_${Date.now()}`;
    const nomeB = `CmpB_${Date.now()}`;

    await loginE2E(page);
    await criarSimulacao(page, nomeA);
    await criarSimulacao(page, nomeB);

    // Vai para /laminas/comparar e abre o seletor
    await page.goto('/laminas/comparar');
    await expect(page.getByTestId('placeholder-vazio')).toBeVisible();
    await page.getByTestId('abrir-seletor').click();
    await page.getByTestId(`check-${nomeA}`).check();
    await page.getByTestId(`check-${nomeB}`).check();

    const [nav] = await Promise.all([
      page.waitForURL(/\/laminas\/comparar\?ids=/, { timeout: 10_000 }),
      page.getByTestId('aplicar-selecao').click(),
    ]);
    void nav;

    // Tabela e resumo aparecem
    await expect(page.getByTestId('resumo-classificacao')).toBeVisible();
    await expect(page.getByRole('cell', { name: nomeA })).toBeVisible();
    await expect(page.getByRole('cell', { name: nomeB })).toBeVisible();

    // Export CSV
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-csv').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^comparativo-laminas-\d{4}-\d{2}-\d{2}-\d{4}\.csv$/);

    // Remove 1 lâmina: abre seletor, desmarca nomeA, aplica
    await page.getByTestId('abrir-seletor').click();
    await page.getByTestId(`check-${nomeA}`).uncheck();
    await page.getByTestId('aplicar-selecao').click();
    await page.waitForURL(/\/laminas\/comparar\?ids=/, { timeout: 10_000 });
    await expect(page.getByRole('cell', { name: nomeA })).toHaveCount(0);
    await expect(page.getByRole('cell', { name: nomeB })).toBeVisible();

    // Cleanup (soft delete via service role — não afeta a suíte)
    await admin
      .from('simulacoes')
      .update({ deleted_at: new Date().toISOString() })
      .in('nome', [nomeA, nomeB]);
  },
);
