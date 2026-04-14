/**
 * Regressão Python → TypeScript — suíte parcial.
 *
 * Histórico (abril/2026):
 *   Tentamos regressão completa contra o blend_v4.py do projeto original para
 *   5 lâminas (atual 15/15/70, antigo 10/90/0, extremos 100% Serra / 100% Corumbá,
 *   balanceado 33/33/34). Encontramos divergências sistemáticas em campos de
 *   escória, contaminantes no gusa e financeiro. Análise conjunta com o PO
 *   identificou:
 *
 *     1. blend_v4.py calcula p_gusa SEM aplicar a partição 0.95; o CLAUDE.md e
 *        o Racional v1.1 exigem a partição. Motor TS segue o CLAUDE.md
 *        (fonte de verdade). Python está desatualizado neste ponto.
 *     2. Valores de escória do Resumo_Siderurgica foram calculados com premissas
 *        variáveis (às vezes bauxita=0, às vezes dolomita adicionada). Não são
 *        reproduzíveis a partir do blend_v4.py puro.
 *     3. Valores de rendimento para Lâminas 3 (100% Serra) e 4 (100% Corumbá)
 *        que recebemos como referência aparentam ter usado análises químicas
 *        diferentes das cadastradas (rendimento de L4 só bate se Fe_Corumbá
 *        ~62,3%, e cadastro tem 63,5%).
 *
 *   Decisão: regressão PARCIAL restrita aos campos onde há consenso independente
 *   entre matemática pura do blend (média ponderada), CLAUDE.md, Racional v1.1 e
 *   blend_v4.py. Campos de escória, contaminantes e financeiro ficam deferidos
 *   para a Fase 9 (Calibração) — ver TODO ao final deste arquivo.
 *
 * Premissas comuns às 5 lâminas (apples-to-apples com blend_v4.py):
 *   - sucata = 0, destino = 'venda'
 *   - estabilidade = 'estavel'  → fator 1.0
 *   - dolomita = 0
 *   - bauxita = 3.08 ton/dia    → 192.5 kg/corrida
 *   - B2 alvo = 0.85 fixo       → parametrosRegressao trava b2Min=b2Max=0.85
 *   - 16 corridas/dia, consumo 225.5 ton/dia → 14.09 ton/corrida
 *
 * Tolerância: ±1% relativo. Classificação: string match exato.
 * Divergência > 1% = teste vermelho. NÃO ajustar o motor para casar.
 *
 * Fonte dos valores esperados abaixo:
 *   - Fe/SiO2/Al2O3 blend: média ponderada direta dos minérios cadastrados
 *     (matemática pura; concordam Python e TS dentro de arredondamento).
 *   - Rendimento e gusa vazado (L1, L2, L5): blend_v4.py, execução abril/2026.
 *   - Classificação: todas `inviavel` porque Al2O3 escória > 17% (limite rígido
 *     do CLAUDE.md), o que o motor TS verifica com sua própria fórmula.
 */

import type {
  BlendItem,
  Classificacao,
  LaminaInput,
  ParametrosForno,
} from '@/lib/calculation/types';

import { bauxita, calcario, corumba, dolomita, serra, trindade } from './minerios';
import { clienteGusaAciaria, parametros as parametrosBase } from './parametros';

/** Parâmetros com B2 alvo travado em 0.85 para alinhar ao blend_v4.py. */
export const parametrosRegressao: ParametrosForno = {
  ...parametrosBase,
  b2Min: 0.85,
  b2Max: 0.85,
  b2Alvo: 0.85,
};

const CORRIDAS_DIA = 16;
const perCorrida = (valorDia: number) => valorDia / CORRIDAS_DIA;

function inputPython(blend: ReadonlyArray<BlendItem>): LaminaInput {
  return {
    blend,
    carvao: {
      mdc: perCorrida(373),
      densidade: 220,
      preco: 360,
      pisCredito: 0,
      icmsCredito: 0,
    },
    coque: {
      kg: perCorrida(20_500),
      preco: 1408,
      pisCredito: 143.52,
      icmsCredito: 340.58,
    },
    fundentes: {
      calcario: { kg: 0, dados: calcario }, // recalculado pelo motor para B2 alvo
      bauxita: { kg: perCorrida(3080), dados: bauxita },
      dolomita: { kg: 0, dados: dolomita },
    },
    quebras: { minerio: 0.1, carvao: 0.1, coque: 0.05, fundentes: 0.05 },
    estabilidade: 'estavel',
    sucata: { kg: 0, precoTon: 0, destino: 'venda' },
    cliente: clienteGusaAciaria,
    parametros: parametrosRegressao,
  };
}

/**
 * `rendimentoPct` / `gusaVazadoDia` são `undefined` nas lâminas L3 e L4 porque
 * os valores do Python aparentam usar análises químicas diferentes das
 * cadastradas. Não são referência confiável.
 */
export type LaminaExpected = Readonly<{
  nome: string;
  input: LaminaInput;
  blend: Readonly<{ fe: number; sio2: number; al2o3: number }>;
  rendimentoPct?: number;
  gusaVazadoDia?: number;
  classificacao: Classificacao;
}>;

/** L1 — Atual 15/15/70. Campos validados: blend + rendimento + gusa + classificação. */
export const lamina1: LaminaExpected = {
  nome: 'Atual 15/15/70',
  input: inputPython([
    { minerio: serra, pct: 15 },
    { minerio: trindade, pct: 15 },
    { minerio: corumba, pct: 70 },
  ]),
  blend: { fe: 63.35, sio2: 4.67, al2o3: 2.54 },
  rendimentoPct: 62.43,
  gusaVazadoDia: 140.78,
  classificacao: 'inviavel',
};

/** L2 — Antigo recomendado 10/90/0. Campos validados: blend + rendimento + gusa + classificação. */
export const lamina2: LaminaExpected = {
  nome: 'Antigo recomendado 10/90/0',
  input: inputPython([
    { minerio: serra, pct: 10 },
    { minerio: trindade, pct: 90 },
  ]),
  blend: { fe: 63.8, sio2: 3.43, al2o3: 2.35 },
  rendimentoPct: 64.34,
  gusaVazadoDia: 145.07,
  classificacao: 'inviavel',
};

/** L3 — 100% Serra. Campos validados: blend + classificação. */
export const lamina3: LaminaExpected = {
  nome: '100% Serra',
  input: inputPython([{ minerio: serra, pct: 100 }]),
  blend: { fe: 62.0, sio2: 5.5, al2o3: 2.8 },
  classificacao: 'inviavel',
};

/** L4 — 100% Corumbá. Campos validados: blend + classificação. */
export const lamina4: LaminaExpected = {
  nome: '100% Corumbá',
  input: inputPython([{ minerio: corumba, pct: 100 }]),
  blend: { fe: 63.5, sio2: 4.8, al2o3: 2.5 },
  classificacao: 'inviavel',
};

/** L5 — Balanceado 33/33/34. Campos validados: blend + rendimento + gusa + classificação. */
export const lamina5: LaminaExpected = {
  nome: 'Balanceado 33/33/34',
  input: inputPython([
    { minerio: serra, pct: 33 },
    { minerio: trindade, pct: 33 },
    { minerio: corumba, pct: 34 },
  ]),
  blend: { fe: 63.17, sio2: 4.5, al2o3: 2.54 },
  rendimentoPct: 61.79,
  gusaVazadoDia: 139.31,
  classificacao: 'inviavel',
};

export const laminasRegressao = [lamina1, lamina2, lamina3, lamina4, lamina5] as const;

export const CORRIDAS_POR_DIA = CORRIDAS_DIA;

/**
 * TODO Fase 9 — Calibração
 *
 * Campos deferidos por não haver referência independente reproduzível hoje.
 * Revisitar quando houver histórico de corridas reais + análise química
 * medida para calibrar os coeficientes do modelo:
 *
 *   - Al2O3 escória (%): modelo pode precisar incorporar cinzas do
 *     carvão/coque ou massa de gases liberados pela decomposição do
 *     calcário. Validar com análise química real da escória vazada.
 *   - P / Mn no gusa: confirmar partições 0.95 e 0.65 com análise
 *     química real do gusa produzido vs blend carregado.
 *   - Custo/ton gusa: validar contra fechamento contábil mensal real
 *     (preços de insumos, créditos tributários efetivos, custo fixo).
 *   - Rendimento em blends extremos (100% Serra, 100% Corumbá): a
 *     fórmula linear com 2 pontos de referência pode subestimar em Fe
 *     muito fora da faixa calibrada (62,60–63,33%); L3 e L4 são casos
 *     de extrapolação que deveriam gerar pontos de referência próprios
 *     se forem corridas reais.
 */
