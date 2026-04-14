import { createClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';

import { E2E_READY, loginE2E } from './helpers/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function ts() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

(E2E_READY ? test : test.skip)(
  'criar corrida real avulsa → registrar análise química → desvios aparecem',
  async ({ page }) => {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const nome = `Corrida_${Date.now()}`;

    await loginE2E(page);
    await page.goto('/corridas/nova');
    await page.getByLabel('Nome').fill(nome);
    // Já começa com tipo=corrida_real (default da page)
    await page.getByLabel('Data/hora da corrida').fill(ts());
    await expect(page.getByTestId('card-producao')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('submit').click();
    await page.waitForURL(/\/corridas\/[0-9a-f-]+$/, { timeout: 15_000 });

    // Sem análise, tabela de desvios mostra "Sem análise química real"
    // A corrida fica em /laminas/[id] após criar (mesma rota); acessamos via /corridas
    await page.goto('/corridas');
    await expect(page.getByTestId(`corrida-row-${nome}`)).toBeVisible();
    await page
      .getByTestId(`corrida-row-${nome}`)
      .getByRole('link', { name: 'Abrir' })
      .click();

    await expect(page.getByTestId('desvios-card')).toBeVisible();
    await expect(page.getByTestId('desvios-card')).toContainText('Sem análise química real');

    // Preenche análise de P e B2
    await page.getByLabel('P', { exact: false }).first().fill('0.11');
    await page.getByLabel('B2').fill('0.82');
    await page.getByTestId('salvar-analise').click();

    // Após salvar, tabela mostra valores reais preenchidos
    await expect(page.getByTestId('desvios-card')).toContainText('Comparação entre snapshot', {
      timeout: 10_000,
    });

    // Cleanup
    await admin
      .from('simulacoes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('nome', nome);
  },
);

(E2E_READY ? test : test.skip)(
  'corrida real com simulação de origem vincula via /corridas/nova?origem=<id>',
  async ({ page, request }) => {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    void request;

    const nomeSim = `OrigemSim_${Date.now()}`;
    const nomeCor = `Corrida_${Date.now()}`;

    await loginE2E(page);

    // Cria uma simulação
    await page.goto('/laminas/nova');
    await page.getByLabel('Nome').fill(nomeSim);
    await expect(page.getByTestId('card-producao')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('submit').click();
    await page.waitForURL(/\/laminas\/([0-9a-f-]+)$/, { timeout: 15_000 });
    const simUrl = page.url();
    const simId = simUrl.match(/\/laminas\/([0-9a-f-]+)/)![1]!;

    // Cria corrida com vínculo
    await page.goto(`/corridas/nova?origem=${simId}`);
    await page.getByLabel('Nome').fill(nomeCor);
    await page.getByLabel('Data/hora da corrida').fill(ts());
    await page.getByTestId('submit').click();
    await page.waitForURL(/\/corridas\/[0-9a-f-]+$/, { timeout: 15_000 });

    // Abre a corrida pela tela de corridas
    await page.goto('/corridas');
    await page
      .getByTestId(`corrida-row-${nomeCor}`)
      .getByRole('link', { name: 'Abrir' })
      .click();

    // Cartão de vínculo mostra a simulação de origem pelo nome
    await expect(page.getByTestId('vinculo-simulacao')).toContainText(nomeSim);

    // Cleanup
    await admin
      .from('simulacoes')
      .update({ deleted_at: new Date().toISOString() })
      .in('nome', [nomeSim, nomeCor]);
  },
);

(E2E_READY ? test : test.skip)(
  'corrida real SEM simulação de origem mostra placeholder',
  async ({ page }) => {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const nome = `CorridaSemOrigem_${Date.now()}`;

    await loginE2E(page);
    await page.goto('/corridas/nova');
    await page.getByLabel('Nome').fill(nome);
    await page.getByLabel('Data/hora da corrida').fill(ts());
    await page.getByTestId('submit').click();
    await page.waitForURL(/\/corridas\/[0-9a-f-]+$/, { timeout: 15_000 });

    await page.goto('/corridas');
    await page
      .getByTestId(`corrida-row-${nome}`)
      .getByRole('link', { name: 'Abrir' })
      .click();

    await expect(page.getByTestId('vinculo-simulacao')).toContainText(
      'não está vinculada',
    );

    await admin
      .from('simulacoes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('nome', nome);
  },
);
