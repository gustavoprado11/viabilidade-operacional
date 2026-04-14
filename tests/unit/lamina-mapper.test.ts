import { describe, it, expect } from 'vitest';

import { simulateLamina } from '@/lib/calculation';
import { buildLaminaInput, type LaminaFormPayload } from '@/lib/actions/lamina-mapper';
import type { Database } from '@/lib/supabase/types';

const minerio = (
  over: Partial<Database['public']['Tables']['minerios']['Row']>,
): Database['public']['Tables']['minerios']['Row'] => ({
  id: 'min-1',
  user_id: 'u1',
  nome: 'Mock',
  preco_ton: 500,
  fe_pct: 63,
  sio2_pct: 4.5,
  al2o3_pct: 2.5,
  p_pct: 0.06,
  mn_pct: 0.15,
  cao_pct: 0.1,
  mgo_pct: 0.08,
  ppc_pct: 0,
  pis_credito_ton: 30,
  icms_credito_ton: 30,
  analise_validada: false,
  valid_from: '2024-01-01',
  valid_to: null,
  created_at: '2024-01-01',
  ...over,
});

const insumo = (
  tipo: 'calcario' | 'bauxita' | 'dolomita' | 'carvao' | 'coque',
  over: Partial<Database['public']['Tables']['insumos']['Row']> = {},
): Database['public']['Tables']['insumos']['Row'] => ({
  id: `${tipo}-1`,
  user_id: 'u1',
  nome: tipo,
  tipo,
  preco_unit: 100,
  unidade: tipo === 'carvao' ? 'MDC' : 'ton',
  fe_pct: 0,
  sio2_pct: 5,
  al2o3_pct: 5,
  cao_pct: 10,
  mgo_pct: 5,
  c_fixo_pct: null,
  densidade_kg_m3: 220,
  pis_credito: 5,
  icms_credito: 5,
  valid_from: '2024-01-01',
  valid_to: null,
  created_at: '2024-01-01',
  ...over,
});

const cliente: Database['public']['Tables']['clientes']['Row'] = {
  id: 'cli-1',
  user_id: 'u1',
  nome: 'Gusa',
  cnpj: null,
  p_max: 0.15,
  si_max: 1,
  mn_max: 1,
  s_max: 0.05,
  c_min: 3.5,
  c_max: 4.5,
  preco_gusa_ton: 2500,
  valid_from: '2024-01-01',
  valid_to: null,
  created_at: '2024-01-01',
};

const parametros: Database['public']['Tables']['parametros_forno']['Row'] = {
  id: 'par-1',
  user_id: 'u1',
  corridas_por_dia: 16,
  duracao_corrida_min: 90,
  consumo_minerio_dia: 225.5,
  b2_min: 0.8,
  b2_max: 0.85,
  b2_alvo: 0.825,
  al2o3_escoria_alvo_min: 12,
  al2o3_escoria_alvo_max: 16,
  al2o3_escoria_limite: 17,
  mgo_al2o3_min: 0.25,
  rend_fe_ref1: 63.33,
  rend_ref1: 0.6235,
  rend_fe_ref2: 62.6,
  rend_ref2: 0.5926,
  fator_estavel: 1.0,
  fator_atencao: 0.95,
  fator_instavel: 0.88,
  particao_p_gusa: 0.95,
  particao_mn_gusa: 0.65,
  si_intercept: 1.5,
  si_coef_b2: -1.2,
  s_gusa_fixo: 0.025,
  c_gusa_fixo: 4.2,
  custo_fixo_dia: 27167,
  frete_gusa_ton: 50.75,
  deb_pis_ton: 212.13,
  deb_icms_ton: 312.72,
  deb_ipi_ton: 84.69,
  valid_from: '2024-01-01',
  valid_to: null,
  created_at: '2024-01-01',
};

const payload: LaminaFormPayload = {
  nome: 'Test',
  tipo: 'simulacao',
  cliente_id: 'cli-1',
  blend: [{ minerio_id: 'min-1', pct: 100 }],
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
};

describe('buildLaminaInput + simulateLamina', () => {
  it('snapshot persistido bate com simulateLamina(input) chamado na hora', () => {
    const bundle = {
      minerios: [minerio({})],
      cliente,
      calcario: insumo('calcario', { cao_pct: 52, sio2_pct: 2, al2o3_pct: 0.5, mgo_pct: 2 }),
      bauxita: insumo('bauxita', { cao_pct: 0.5, sio2_pct: 6, al2o3_pct: 55, mgo_pct: 0.3 }),
      dolomita: insumo('dolomita', { cao_pct: 30, sio2_pct: 1.5, al2o3_pct: 0.3, mgo_pct: 21 }),
      carvao: insumo('carvao', { preco_unit: 360 }),
      coque: insumo('coque', { preco_unit: 1408 }),
      parametros,
    };

    const input = buildLaminaInput(payload, bundle);
    const r1 = simulateLamina(input);
    const r2 = simulateLamina(input);
    // Determinismo
    expect(r2.financeiro.resultadoCorrida).toBe(r1.financeiro.resultadoCorrida);
    expect(r2.escoria.b2).toBe(r1.escoria.b2);
    // Sanity: classificação presente
    expect(['viavel', 'alerta', 'inviavel']).toContain(r1.validacao.classificacao);
  });

  it('lança quando minerio_id não existe no bundle', () => {
    const bundle = {
      minerios: [],
      cliente,
      calcario: insumo('calcario'),
      bauxita: insumo('bauxita'),
      dolomita: insumo('dolomita'),
      carvao: insumo('carvao'),
      coque: insumo('coque'),
      parametros,
    };
    expect(() => buildLaminaInput(payload, bundle)).toThrow(/não encontrado/);
  });

  it('mapeia créditos undefined quando colunas são null', () => {
    const bundle = {
      minerios: [minerio({})],
      cliente,
      calcario: insumo('calcario'),
      bauxita: insumo('bauxita'),
      dolomita: insumo('dolomita'),
      carvao: insumo('carvao', { pis_credito: null, icms_credito: null }),
      coque: insumo('coque', { pis_credito: null, icms_credito: null }),
      parametros,
    };
    const input = buildLaminaInput(payload, bundle);
    expect(input.carvao.pisCredito).toBeUndefined();
    expect(input.carvao.icmsCredito).toBeUndefined();
    expect(input.coque.pisCredito).toBeUndefined();
  });
});
