/**
 * Catálogo das linhas do comparativo. Cada entrada descreve:
 *   - section: agrupamento
 *   - label: exibição
 *   - extract(lamina, ctx): valor bruto (number | string | null)
 *   - format(v): como mostrar na tabela (humano)
 *   - direcao: para destaque melhor/pior
 *
 * Usado pela tabela e pelo CSV (CSV pega extract direto, sem format).
 */

import type { LaminaResultado } from '@/lib/calculation/types';
import type { Database } from '@/lib/supabase/types';

import type { Direcao } from './destaques';

export type Simulacao = Database['public']['Tables']['simulacoes']['Row'];
type MinerioRow = Database['public']['Tables']['minerios']['Row'];
type ClienteRow = Database['public']['Tables']['clientes']['Row'];

export type RowContext = {
  mineriosById: Map<string, MinerioRow>;
  clientesById: Map<string, ClienteRow>;
};

export type Section =
  | 'Identificação'
  | 'Blend'
  | 'Forno'
  | 'Escória'
  | 'Gusa'
  | 'Financeiro';

export type RowDef = {
  section: Section;
  label: string;
  direcao: Direcao;
  extract: (l: Simulacao, ctx: RowContext) => number | string | null;
  format?: (v: number | string | null) => string;
};

const brl = (n: number | string | null) =>
  typeof n === 'number' && Number.isFinite(n)
    ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '—';
const pct = (n: number | string | null, digits = 2) =>
  typeof n === 'number' && Number.isFinite(n)
    ? `${n.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`
    : '—';
const num = (n: number | string | null, digits = 2) =>
  typeof n === 'number' && Number.isFinite(n)
    ? n.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
    : typeof n === 'string'
    ? n
    : '—';
const txt = (v: number | string | null) => (v == null ? '—' : String(v));

function res(l: Simulacao): LaminaResultado | null {
  return (l.resultado ?? null) as unknown as LaminaResultado | null;
}

export const SECTIONS: Section[] = [
  'Identificação',
  'Blend',
  'Forno',
  'Escória',
  'Gusa',
  'Financeiro',
];

export const ROWS: RowDef[] = [
  // Identificação
  {
    section: 'Identificação',
    label: 'Nome',
    direcao: 'neutral',
    extract: (l) => l.nome,
    format: txt,
  },
  {
    section: 'Identificação',
    label: 'Tipo',
    direcao: 'neutral',
    extract: (l) => (l.tipo === 'corrida_real' ? 'Corrida real' : 'Simulação'),
    format: txt,
  },
  {
    section: 'Identificação',
    label: 'Cliente',
    direcao: 'neutral',
    extract: (l, ctx) => {
      if (!l.cliente_id) return '—';
      const c = ctx.clientesById.get(l.cliente_id);
      if (!c) return '—';
      return c.valid_to ? `${c.nome} (arquivado)` : c.nome;
    },
    format: txt,
  },
  {
    section: 'Identificação',
    label: 'Classificação',
    direcao: 'neutral',
    extract: (l) =>
      l.classificacao === 'viavel'
        ? 'Viável'
        : l.classificacao === 'alerta'
        ? 'Alerta'
        : 'Inviável',
    format: txt,
  },
  {
    section: 'Identificação',
    label: 'Criada em',
    direcao: 'neutral',
    extract: (l) => new Date(l.created_at).toLocaleString('pt-BR'),
    format: txt,
  },

  // Blend (composição)
  {
    section: 'Blend',
    label: 'Fe blend (%)',
    direcao: 'higher_better',
    extract: (l) => res(l)?.blend.fe ?? null,
    format: (v) => pct(v, 2),
  },
  {
    section: 'Blend',
    label: 'SiO₂ blend (%)',
    direcao: 'neutral',
    extract: (l) => res(l)?.blend.sio2 ?? null,
    format: (v) => pct(v, 2),
  },
  {
    section: 'Blend',
    label: 'Al₂O₃ blend (%)',
    direcao: 'lower_better',
    extract: (l) => res(l)?.blend.al2o3 ?? null,
    format: (v) => pct(v, 2),
  },
  {
    section: 'Blend',
    label: 'P blend (%)',
    direcao: 'lower_better',
    extract: (l) => res(l)?.blend.p ?? null,
    format: (v) => pct(v, 4),
  },
  {
    section: 'Blend',
    label: 'Mn blend (%)',
    direcao: 'neutral',
    extract: (l) => res(l)?.blend.mn ?? null,
    format: (v) => pct(v, 4),
  },
  {
    section: 'Blend',
    label: 'Preço médio (R$/ton)',
    direcao: 'lower_better',
    extract: (l) => res(l)?.blend.precoMedio ?? null,
    format: brl,
  },

  // Forno / produção
  {
    section: 'Forno',
    label: 'Rendimento efetivo',
    direcao: 'higher_better',
    extract: (l) => {
      const r = res(l);
      return r ? r.producao.rendimentoEfetivo * 100 : null;
    },
    format: (v) => pct(v, 2),
  },
  {
    section: 'Forno',
    label: 'Fator estabilidade',
    direcao: 'higher_better',
    extract: (l) => res(l)?.producao.fatorEstabilidade ?? null,
    format: (v) => num(v, 2),
  },
  {
    section: 'Forno',
    label: 'Gusa vazado (ton/corrida)',
    direcao: 'higher_better',
    extract: (l) => res(l)?.producao.gusaVazado ?? null,
    format: (v) => num(v, 2),
  },
  {
    section: 'Forno',
    label: 'Sucata gerada (ton)',
    direcao: 'neutral',
    extract: (l) => res(l)?.producao.sucataGerada ?? null,
    format: (v) => num(v, 2),
  },
  {
    section: 'Forno',
    label: 'Bauxita (kg)',
    direcao: 'neutral',
    extract: (l) => Number(l.bauxita_kg),
    format: (v) => num(v, 2),
  },
  {
    section: 'Forno',
    label: 'Dolomita (kg)',
    direcao: 'neutral',
    extract: (l) => Number(l.dolomita_kg),
    format: (v) => num(v, 2),
  },
  {
    section: 'Forno',
    label: 'Coque (kg)',
    direcao: 'neutral',
    extract: (l) => Number(l.coque_kg),
    format: (v) => num(v, 2),
  },
  {
    section: 'Forno',
    label: 'Carvão (MDC)',
    direcao: 'neutral',
    extract: (l) => Number(l.carvao_mdc),
    format: (v) => num(v, 2),
  },

  // Escória
  {
    section: 'Escória',
    label: 'Volume (kg/ton gusa)',
    direcao: 'lower_better',
    extract: (l) => res(l)?.escoria.volumePorTonGusa ?? null,
    format: (v) => num(v, 1),
  },
  {
    section: 'Escória',
    label: 'B2 (CaO/SiO₂)',
    direcao: 'neutral',
    extract: (l) => res(l)?.escoria.b2 ?? null,
    format: (v) => num(v, 3),
  },
  {
    section: 'Escória',
    label: 'B4',
    direcao: 'neutral',
    extract: (l) => res(l)?.escoria.b4 ?? null,
    format: (v) => num(v, 3),
  },
  {
    section: 'Escória',
    label: 'Al₂O₃ escória (%)',
    direcao: 'lower_better',
    extract: (l) => res(l)?.escoria.al2o3Pct ?? null,
    format: (v) => pct(v, 2),
  },
  {
    section: 'Escória',
    label: 'MgO/Al₂O₃',
    direcao: 'higher_better',
    extract: (l) => res(l)?.escoria.mgoAl2o3 ?? null,
    format: (v) => num(v, 3),
  },
  {
    section: 'Escória',
    label: 'Calcário (ton/corrida)',
    direcao: 'lower_better',
    extract: (l) => res(l)?.escoria.calcarioNecessario ?? null,
    format: (v) => num(v, 3),
  },

  // Gusa
  {
    section: 'Gusa',
    label: 'P (%)',
    direcao: 'lower_better',
    extract: (l) => res(l)?.gusa.p ?? null,
    format: (v) => pct(v, 3),
  },
  {
    section: 'Gusa',
    label: 'Si (%)',
    direcao: 'lower_better',
    extract: (l) => res(l)?.gusa.si ?? null,
    format: (v) => pct(v, 3),
  },
  {
    section: 'Gusa',
    label: 'Mn (%)',
    direcao: 'lower_better',
    extract: (l) => res(l)?.gusa.mn ?? null,
    format: (v) => pct(v, 3),
  },
  {
    section: 'Gusa',
    label: 'S (%)',
    direcao: 'lower_better',
    extract: (l) => res(l)?.gusa.s ?? null,
    format: (v) => pct(v, 3),
  },
  {
    section: 'Gusa',
    label: 'C (%)',
    direcao: 'neutral',
    extract: (l) => res(l)?.gusa.c ?? null,
    format: (v) => pct(v, 2),
  },

  // Financeiro
  {
    section: 'Financeiro',
    label: 'Custo/ton gusa',
    direcao: 'lower_better',
    extract: (l) => res(l)?.financeiro.custoPorTonGusa ?? null,
    format: brl,
  },
  {
    section: 'Financeiro',
    label: 'Margem/ton',
    direcao: 'higher_better',
    extract: (l) => res(l)?.financeiro.margemPorTon ?? null,
    format: brl,
  },
  {
    section: 'Financeiro',
    label: 'Tributos líquidos',
    direcao: 'lower_better',
    extract: (l) => res(l)?.financeiro.tributosLiquidos ?? null,
    format: brl,
  },
  {
    section: 'Financeiro',
    label: 'Resultado/corrida',
    direcao: 'higher_better',
    extract: (l) => res(l)?.financeiro.resultadoCorrida ?? null,
    format: brl,
  },
  {
    section: 'Financeiro',
    label: 'Resultado/mês projetado',
    direcao: 'higher_better',
    extract: (l) => res(l)?.financeiro.resultadoProjetadoMes ?? null,
    format: brl,
  },
];
