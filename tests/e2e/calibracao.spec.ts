import { createClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const canRun = email && password && supabaseUrl && serviceRoleKey;

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email!);
  await page.getByLabel('Senha').fill(password!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('http://localhost:3000/', { timeout: 15_000 });
}

(canRun ? test : test.skip)(
  'seed N corridas com análise → /calibracao mostra stats → aplica calibração manual',
  async ({ page }) => {
    const admin = createClient(supabaseUrl!, serviceRoleKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Descobre user_id e parametros_id ativos
    const { data: userResp } = await admin.auth.admin.listUsers();
    const user = userResp.users.find((u) => u.email === email);
    expect(user).toBeDefined();
    const userId = user!.id;

    const { data: param } = await admin
      .from('parametros_forno')
      .select('id')
      .is('valid_to', null)
      .limit(1)
      .maybeSingle();
    expect(param).toBeDefined();
    const paramId = param!.id;

    const { data: cli } = await admin
      .from('clientes')
      .select('id')
      .is('valid_to', null)
      .limit(1)
      .maybeSingle();
    const clienteId = cli!.id;

    const { data: mins } = await admin
      .from('minerios')
      .select('id')
      .is('valid_to', null)
      .limit(3);
    const blendRef = [
      { minerio_id: mins![0]!.id, pct: 34 },
      { minerio_id: mins![1]!.id, pct: 33 },
      { minerio_id: mins![2]!.id, pct: 33 },
    ];

    // Cria 10 corridas reais com P real consistentemente 10% acima do previsto.
    // resultado.gusa.p = 0.1; real = 0.11 → +10%.
    const batchTag = `CalibE2E_${Date.now()}`;
    const rows = Array.from({ length: 10 }, (_, i) => ({
      user_id: userId,
      nome: `${batchTag}_${i}`,
      tipo: 'corrida_real',
      cliente_id: clienteId,
      blend: blendRef,
      carvao_mdc: 23.3,
      carvao_densidade: 220,
      coque_kg: 1280,
      calcario_kg: 0,
      bauxita_kg: 192.5,
      dolomita_kg: 0,
      quebras: { minerio: 0.1, carvao: 0.1, coque: 0.05, fundentes: 0.05 },
      estabilidade: 'estavel',
      sucata_kg: 0,
      sucata_preco_ton: 0,
      sucata_destino: 'venda',
      classificacao: 'viavel',
      parametros_id: paramId,
      resultado: {
        gusa: { p: 0.1, si: 0.5, mn: 0.15, s: 0.025, c: 4.2 },
        escoria: { b2: 0.85, b4: 0.7, al2o3Pct: 13, mgoAl2o3: 0.3, volumeTon: 2, sio2Ton: 1, al2o3Ton: 0.3, caoTon: 0.85, mgoTon: 0.1, volumePorTonGusa: 200, calcarioNecessario: 0.1 },
        producao: { rendimentoTeorico: 0.62, fatorEstabilidade: 1, rendimentoEfetivo: 0.62, consumoMinerioCorrida: 14, gusaVazado: 8.68, sucataGerada: 0, producaoTotal: 8.68 },
        blend: { fe: 63, sio2: 4, al2o3: 2.5, p: 0.06, mn: 0.15, cao: 0.1, mgo: 0.08, ppc: 0, precoMedio: 400 },
        financeiro: { custoMaterias: 0, custoQuebras: 0, custoFixo: 0, custoFrete: 0, custoTotal: 0, custoPorTonGusa: 0, receitaGusa: 0, receitaSucata: 0, creditoFuturoReprocesso: 0, faturamentoTotal: 0, debitoTributos: 0, creditoTributos: 0, tributosLiquidos: 0, margemPorTon: 0, resultadoCorrida: 0, resultadoProjetadoMes: 0 },
        validacao: { specCliente: { p: true, si: true, mn: true, s: true, c: true }, escoria: { al2o3OK: true, mgoAl2o3OK: true, b2OK: true }, classificacao: 'viavel', alertas: [], erros: [] },
      },
      corrida_timestamp: new Date(Date.now() - (10 - i) * 86_400_000).toISOString(),
      analise_gusa_real: { p: 0.11 },
      analise_escoria_real: null,
    }));

    const { error: insErr } = await admin.from('simulacoes').insert(rows);
    expect(insErr).toBeNull();

    try {
      await login(page);
      await page.goto('/calibracao');

      // Resumo mostra 10 corridas analisadas
      await expect(page.getByTestId('resumo-stats')).toContainText('10 corrida');

      // Ajuste manual simples: mudar c_gusa_fixo de 4.2 para 4.25
      await page.getByLabel('C gusa fixo (%)').fill('4.25');

      // Preview deve mostrar 1 mudança
      await expect(page.getByTestId('patch-preview')).toContainText('c_gusa_fixo');

      // Justificativa
      await page.getByLabel(/Justificativa/).fill('Ajuste preliminar via E2E teste — calibração de C gusa.');

      await page.getByTestId('aplicar-calibracao').click();

      // Sucesso: nova versão de parametros_forno + linha em calibracoes
      await expect(page.getByText(/Calibração aplicada/)).toBeVisible({ timeout: 10_000 });

      const { data: paramRows } = await admin
        .from('parametros_forno')
        .select('id, c_gusa_fixo, valid_to')
        .eq('user_id', userId);
      const ativos = paramRows!.filter((p) => p.valid_to === null);
      expect(ativos.length).toBe(1);
      expect(Number(ativos[0]!.c_gusa_fixo)).toBeCloseTo(4.25, 3);

      const { count: logCount } = await admin
        .from('calibracoes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      expect(logCount ?? 0).toBeGreaterThanOrEqual(1);
    } finally {
      // Cleanup: soft-deleta as corridas criadas; reverte parametros para o
      // estado original (fecha os novos, reabre o mais antigo seria complexo —
      // preferimos só soft-deletar as corridas; parametros ficam como ficou).
      await admin
        .from('simulacoes')
        .update({ deleted_at: new Date().toISOString() })
        .ilike('nome', `${batchTag}_%`);
    }
  },
);
