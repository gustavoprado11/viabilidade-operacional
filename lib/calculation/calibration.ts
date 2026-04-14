import type { AnaliseEscoriaReal, AnaliseGusaReal } from './desvios';
import type { LaminaResultado, ParametrosForno } from './types';

/**
 * Motor de calibração — puro. Dado um histórico de corridas com análise
 * química medida, calcula estatísticas de desvio e sugere ajustes
 * conservadores nos coeficientes de `parametros_forno`.
 *
 * Regras de confiança (n = amostras):
 *   - n < 10  → baixa (apenas informa)
 *   - 10 ≤ n < 30 → media (recomenda com warning)
 *   - n ≥ 30  → alta (recomenda)
 *
 * Outras guardas:
 *   - Se desvioPadraoPct > 50% da média absoluta → não recomenda (ruído).
 *   - Ajuste incremental: move metade do gap observado ("50% do caminho")
 *     em vez de substituir pelo valor observado, para evitar overfit.
 */

export type Confianca = 'baixa' | 'media' | 'alta';

export type Tendencia =
  | 'previsto_subestima' // real > previsto (média positiva)
  | 'previsto_superestima' // real < previsto
  | 'neutro';

export type DesvioHistoricoInput = Readonly<{
  corridaId: string;
  timestamp: string; // ISO
  previsto: LaminaResultado;
  gusaReal?: AnaliseGusaReal | null;
  escoriaReal?: AnaliseEscoriaReal | null;
}>;

export type EstatisticasDesvio = Readonly<{
  campo: string;
  n: number;
  mediaDesvioAbs: number;
  mediaDesvioPct: number;
  desvioPadraoPct: number;
  tendencia: Tendencia;
  confianca: Confianca;
}>;

export type RecomendacaoAjuste = Readonly<{
  parametro: keyof ParametrosForno;
  valorAtual: number;
  valorSugerido: number;
  justificativa: string;
  confianca: Confianca;
  baseadoEmNCorridas: number;
}>;

const MIN_AMOSTRAS_MEDIA = 10;
const MIN_AMOSTRAS_ALTA = 30;
const LIMITE_RUIDO = 0.5; // desvioPadraoPct / |mediaDesvioPct|
const PASSO_INCREMENTAL = 0.5; // move 50% do caminho

function confiancaDeN(n: number): Confianca {
  if (n >= MIN_AMOSTRAS_ALTA) return 'alta';
  if (n >= MIN_AMOSTRAS_MEDIA) return 'media';
  return 'baixa';
}

function tendenciaDaMedia(media: number, tol = 0.01): Tendencia {
  if (Math.abs(media) < tol) return 'neutro';
  return media > 0 ? 'previsto_subestima' : 'previsto_superestima';
}

/** Média aritmética ignorando null/NaN. */
function media(vals: ReadonlyArray<number | null>): number {
  const xs = vals.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Desvio-padrão amostral (n-1); 0 se ≤1 amostra. */
function desvioPadrao(vals: ReadonlyArray<number | null>): number {
  const xs = vals.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (xs.length <= 1) return 0;
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  const soma = xs.reduce((s, v) => s + (v - m) ** 2, 0);
  return Math.sqrt(soma / (xs.length - 1));
}

/**
 * Para um conjunto de pares (previsto, real), retorna a estatística única.
 * Ignora pares onde o real é null.
 */
function statsPar(
  campo: string,
  pares: ReadonlyArray<{ previsto: number; real: number | null | undefined }>,
): EstatisticasDesvio {
  const validos = pares.filter(
    (p): p is { previsto: number; real: number } =>
      typeof p.real === 'number' && Number.isFinite(p.real) &&
      typeof p.previsto === 'number' && Number.isFinite(p.previsto),
  );
  const n = validos.length;

  const abs = validos.map((p) => p.real - p.previsto);
  const pct = validos.map((p) =>
    p.previsto === 0 ? null : (p.real - p.previsto) / Math.abs(p.previsto),
  );

  const mAbs = media(abs);
  const mPct = media(pct);
  const sdPct = desvioPadrao(pct);

  return {
    campo,
    n,
    mediaDesvioAbs: mAbs,
    mediaDesvioPct: mPct,
    desvioPadraoPct: sdPct,
    tendencia: tendenciaDaMedia(mPct),
    confianca: confiancaDeN(n),
  };
}

const GUSA_FIELDS: Array<{
  campo: string;
  getPrevisto: (r: LaminaResultado) => number;
  getReal: (g: AnaliseGusaReal | null | undefined) => number | undefined;
}> = [
  { campo: 'gusa.p', getPrevisto: (r) => r.gusa.p, getReal: (g) => g?.p },
  { campo: 'gusa.si', getPrevisto: (r) => r.gusa.si, getReal: (g) => g?.si },
  { campo: 'gusa.mn', getPrevisto: (r) => r.gusa.mn, getReal: (g) => g?.mn },
  { campo: 'gusa.s', getPrevisto: (r) => r.gusa.s, getReal: (g) => g?.s },
  { campo: 'gusa.c', getPrevisto: (r) => r.gusa.c, getReal: (g) => g?.c },
];

const ESCORIA_FIELDS: Array<{
  campo: string;
  getPrevisto: (r: LaminaResultado) => number;
  getReal: (e: AnaliseEscoriaReal | null | undefined) => number | undefined;
}> = [
  { campo: 'escoria.b2', getPrevisto: (r) => r.escoria.b2, getReal: (e) => e?.b2 },
  { campo: 'escoria.b4', getPrevisto: (r) => r.escoria.b4, getReal: (e) => e?.b4 },
  {
    campo: 'escoria.al2o3Pct',
    getPrevisto: (r) => r.escoria.al2o3Pct,
    getReal: (e) => e?.al2o3Pct,
  },
  {
    campo: 'escoria.mgoAl2o3',
    getPrevisto: (r) => r.escoria.mgoAl2o3,
    getReal: (e) => e?.mgoAl2o3,
  },
  {
    campo: 'escoria.volumeTon',
    getPrevisto: (r) => r.escoria.volumeTon,
    getReal: (e) => e?.volumeTon,
  },
];

export function calcularEstatisticasDesvios(
  historico: ReadonlyArray<DesvioHistoricoInput>,
): EstatisticasDesvio[] {
  const out: EstatisticasDesvio[] = [];
  for (const { campo, getPrevisto, getReal } of GUSA_FIELDS) {
    const pares = historico.map((h) => ({
      previsto: getPrevisto(h.previsto),
      real: getReal(h.gusaReal),
    }));
    out.push(statsPar(campo, pares));
  }
  for (const { campo, getPrevisto, getReal } of ESCORIA_FIELDS) {
    const pares = historico.map((h) => ({
      previsto: getPrevisto(h.previsto),
      real: getReal(h.escoriaReal),
    }));
    out.push(statsPar(campo, pares));
  }
  return out;
}

/**
 * Mapeamento campo → parâmetro ajustável, quando há ajuste direto.
 * Campos sem mapeamento aqui não geram recomendação (são informativos).
 *
 * Lógica do ajuste incremental:
 *   novoValor = atual × (1 + mediaDesvioPct × PASSO_INCREMENTAL)
 *
 * Ex.: se P real está 10% acima do previsto, a partição `particao_p_gusa`
 * (0.95) sobe 5% do caminho (→ ≈0.9975, clamped em 1.0).
 */
type MapeamentoCampo = {
  campo: string;
  parametro: keyof ParametrosForno;
  min: number;
  max: number;
  descricaoAjuste: (t: Tendencia) => string;
};

const MAPEAMENTO: MapeamentoCampo[] = [
  {
    campo: 'gusa.p',
    parametro: 'particaoPGusa',
    min: 0.5,
    max: 1,
    descricaoAjuste: (t) =>
      t === 'previsto_subestima'
        ? 'P real > previsto: aumentar partição P → gusa.'
        : 'P real < previsto: reduzir partição P → gusa.',
  },
  {
    campo: 'gusa.mn',
    parametro: 'particaoMnGusa',
    min: 0.3,
    max: 1,
    descricaoAjuste: (t) =>
      t === 'previsto_subestima'
        ? 'Mn real > previsto: aumentar partição Mn → gusa.'
        : 'Mn real < previsto: reduzir partição Mn → gusa.',
  },
  {
    campo: 'gusa.s',
    parametro: 'sGusaFixo',
    min: 0,
    max: 0.1,
    descricaoAjuste: () => 'Ajustar S fixo do gusa para média observada.',
  },
  {
    campo: 'gusa.c',
    parametro: 'cGusaFixo',
    min: 3,
    max: 5,
    descricaoAjuste: () => 'Ajustar C fixo do gusa para média observada.',
  },
];

export function gerarRecomendacoes(
  stats: ReadonlyArray<EstatisticasDesvio>,
  parametrosAtuais: ParametrosForno,
): RecomendacaoAjuste[] {
  const out: RecomendacaoAjuste[] = [];
  for (const m of MAPEAMENTO) {
    const s = stats.find((x) => x.campo === m.campo);
    if (!s || s.n === 0) continue;
    if (s.confianca === 'baixa') continue;

    // Guarda de ruído: se sd > 50% da média, pular
    if (
      Math.abs(s.mediaDesvioPct) > 1e-6 &&
      s.desvioPadraoPct > LIMITE_RUIDO * Math.abs(s.mediaDesvioPct)
    ) {
      continue;
    }
    if (s.tendencia === 'neutro') continue;

    const atual = parametrosAtuais[m.parametro] as number;

    let sugerido: number;
    if (m.parametro === 'sGusaFixo' || m.parametro === 'cGusaFixo') {
      // Valor fixo: aproxima 50% do caminho entre atual e (atual + mediaAbs)
      sugerido = atual + s.mediaDesvioAbs * PASSO_INCREMENTAL;
    } else {
      // Coeficiente multiplicativo: ajusta em % incremental
      sugerido = atual * (1 + s.mediaDesvioPct * PASSO_INCREMENTAL);
    }
    sugerido = Math.min(m.max, Math.max(m.min, sugerido));
    if (Math.abs(sugerido - atual) < 1e-6) continue;

    out.push({
      parametro: m.parametro,
      valorAtual: atual,
      valorSugerido: Number(sugerido.toFixed(4)),
      justificativa: `${m.descricaoAjuste(s.tendencia)} Baseado em ${s.n} corridas (desvio médio ${(s.mediaDesvioPct * 100).toFixed(1)}%, σ=${(s.desvioPadraoPct * 100).toFixed(1)}%).`,
      confianca: s.confianca,
      baseadoEmNCorridas: s.n,
    });
  }
  return out;
}
