/**
 * Fluxo completo de cadastro versionado (minérios).
 *
 * Cria → edita → verifica (via service role) que existem 2 linhas
 * (1 com valid_to preenchido + 1 ativa com novo valor) → exclui (soft) →
 * verifica que a ativa ficou sem linhas; histórico preservado.
 */

import { createClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const canRun = email && password && supabaseUrl && serviceRoleKey;

(canRun ? test : test.skip)(
  'criar → editar → excluir minério com versionamento',
  async ({ page }) => {
    const admin = createClient(supabaseUrl!, serviceRoleKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const nome = `Teste_${Date.now()}`;

    // login
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(email!);
    await page.getByLabel('Senha').fill(password!);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL('http://localhost:3000/', { timeout: 15_000 });

    // criar
    await page.goto('/cadastros/minerios/novo');
    await page.getByLabel('Nome').fill(nome);
    await page.getByLabel('Preço R$/ton').fill('500');
    await page.getByLabel('Fe', { exact: true }).fill('62.5');
    await page.getByLabel('SiO₂', { exact: true }).fill('5.0');
    await page.getByLabel('Al₂O₃', { exact: true }).fill('2.5');
    await page.getByLabel('P', { exact: true }).fill('0.06');
    await page.getByLabel('Mn', { exact: true }).fill('0.15');
    await page.getByLabel('CaO', { exact: true }).fill('0.1');
    await page.getByLabel('MgO', { exact: true }).fill('0.08');
    await page.getByLabel('PPC', { exact: true }).fill('0');
    await page.getByLabel('PIS crédito (R$/ton)').fill('20');
    await page.getByLabel('ICMS crédito (R$/ton)').fill('30');
    await page.getByRole('button', { name: 'Criar minério' }).click();
    await page.waitForURL('**/cadastros/minerios', { timeout: 10_000 });

    // aparece na lista
    await expect(page.getByTestId(`minerio-row-${nome}`)).toBeVisible();
    await expect(page.getByTestId(`minerio-preco-${nome}`)).toHaveText('500.00');

    // editar: mudar preço para 600
    await page
      .getByTestId(`minerio-row-${nome}`)
      .getByRole('link', { name: 'Editar' })
      .click();
    const precoInput = page.getByLabel('Preço R$/ton');
    await precoInput.fill('600');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await page.waitForURL('**/cadastros/minerios', { timeout: 10_000 });
    await expect(page.getByTestId(`minerio-preco-${nome}`)).toHaveText('600.00');

    // banco: 2 linhas para esse nome, 1 ativa com preço 600 e outra com valid_to preenchido
    const { data: rowsPostEdit, error: e1 } = await admin
      .from('minerios')
      .select('id, preco_ton, valid_to')
      .eq('nome', nome);
    expect(e1).toBeNull();
    expect(rowsPostEdit).toHaveLength(2);
    const ativa = rowsPostEdit!.filter((r) => r.valid_to === null);
    const arquivada = rowsPostEdit!.filter((r) => r.valid_to !== null);
    expect(ativa).toHaveLength(1);
    expect(arquivada).toHaveLength(1);
    expect(Number(ativa[0]!.preco_ton)).toBe(600);
    expect(Number(arquivada[0]!.preco_ton)).toBe(500);

    // soft delete
    await page
      .getByTestId(`minerio-row-${nome}`)
      .getByRole('button', { name: 'Excluir' })
      .click();
    await page.getByRole('button', { name: 'Excluir', exact: true }).last().click();
    await expect(page.getByTestId(`minerio-row-${nome}`)).toHaveCount(0, {
      timeout: 10_000,
    });

    // banco: 0 ativas, 2 arquivadas
    const { data: rowsPostDelete } = await admin
      .from('minerios')
      .select('id, valid_to')
      .eq('nome', nome);
    expect(rowsPostDelete).toHaveLength(2);
    expect(rowsPostDelete!.every((r) => r.valid_to !== null)).toBe(true);
  },
);
