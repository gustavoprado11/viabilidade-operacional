import type {
  EscoriaResult,
  FinanceiroResult,
  LaminaInput,
  ProducaoResult,
} from './types';

const FE_PCT_GUSA = 0.94;

/**
 * Financeiro da corrida.
 *
 * custos:
 *   materias     = Σ (preço × quantidade) para minério, carvão, coque, fundentes
 *   quebras      = materias × média ponderada das taxas de quebra
 *   fixo         = custoFixoDia / corridasPorDia
 *   frete        = gusaVazado × freteGusaTon
 *   tributos     = (débitos sobre gusa) − (créditos sobre insumos)
 *   total        = materias + quebras + fixo + frete + tributos
 *
 * receita:
 *   gusa         = gusaVazado × precoGusa
 *   sucata:
 *     destino=venda      → sucataTon × precoSucataTon   (entra em receita)
 *     destino=reprocesso → 0 (nesta corrida); crédito futuro informativo
 *       baseado em ~94% Fe recuperável × preço médio do minério/ton
 *
 * resultado/corrida = (receitaGusa + receitaSucata) − custoTotal
 * margem/ton        = precoGusa − (custoTotal / gusaVazado)
 */
export function calcularFinanceiro(
  input: LaminaInput,
  producao: ProducaoResult,
  escoria: EscoriaResult,
  blendPrecoMedio: number,
): FinanceiroResult {
  const { carvao, coque, fundentes, quebras, parametros, cliente, sucata } =
    input;

  const consumoMinerioTon = producao.consumoMinerioCorrida;
  const calcarioTon = escoria.calcarioNecessario;
  const bauxitaTon = fundentes.bauxita.kg / 1000;
  const dolomitaTon = fundentes.dolomita.kg / 1000;
  const coqueTon = coque.kg / 1000;

  // Custos diretos
  const custoMinerio = consumoMinerioTon * blendPrecoMedio;
  const custoCarvao = carvao.mdc * carvao.preco;
  const custoCoque = coqueTon * coque.preco;
  const custoCalcario = calcarioTon * fundentes.calcario.dados.preco;
  const custoBauxita = bauxitaTon * fundentes.bauxita.dados.preco;
  const custoDolomita = dolomitaTon * fundentes.dolomita.dados.preco;

  const custoMaterias =
    custoMinerio +
    custoCarvao +
    custoCoque +
    custoCalcario +
    custoBauxita +
    custoDolomita;

  // Custo de quebras: por categoria
  const custoQuebras =
    custoMinerio * quebras.minerio +
    custoCarvao * quebras.carvao +
    custoCoque * quebras.coque +
    (custoCalcario + custoBauxita + custoDolomita) * quebras.fundentes;

  const custoFixo = parametros.custoFixoDia / parametros.corridasPorDia;
  const custoFrete = producao.gusaVazado * parametros.freteGusaTon;

  // Tributos
  const debitoTributos =
    producao.gusaVazado *
    (parametros.debPisTon + parametros.debIcmsTon + parametros.debIpiTon);

  // Créditos por insumo: PIS + ICMS × quantidade (ton)
  const creditoMinerioTon = input.blend.reduce(
    (acc, b) =>
      acc + (b.pct / 100) * (b.minerio.pisCredito + b.minerio.icmsCredito),
    0,
  );
  const creditoMinerio = consumoMinerioTon * creditoMinerioTon;
  const creditoCarvao =
    carvao.mdc * ((carvao.pisCredito ?? 0) + (carvao.icmsCredito ?? 0));
  const creditoCoque =
    coqueTon * ((coque.pisCredito ?? 0) + (coque.icmsCredito ?? 0));
  const creditoCalcario =
    calcarioTon *
    ((fundentes.calcario.dados.pisCredito ?? 0) +
      (fundentes.calcario.dados.icmsCredito ?? 0));
  const creditoBauxita =
    bauxitaTon *
    ((fundentes.bauxita.dados.pisCredito ?? 0) +
      (fundentes.bauxita.dados.icmsCredito ?? 0));
  const creditoDolomita =
    dolomitaTon *
    ((fundentes.dolomita.dados.pisCredito ?? 0) +
      (fundentes.dolomita.dados.icmsCredito ?? 0));

  const creditoTributos =
    creditoMinerio +
    creditoCarvao +
    creditoCoque +
    creditoCalcario +
    creditoBauxita +
    creditoDolomita;

  const tributosLiquidos = debitoTributos - creditoTributos;
  const custoTotal =
    custoMaterias + custoQuebras + custoFixo + custoFrete + tributosLiquidos;

  // Receitas
  const receitaGusa = producao.gusaVazado * cliente.precoGusa;

  const sucataTon = sucata.kg / 1000;
  let receitaSucata = 0;
  let creditoFuturoReprocesso = 0;
  if (sucata.destino === 'venda') {
    receitaSucata = sucataTon * sucata.precoTon;
  } else {
    creditoFuturoReprocesso = sucataTon * FE_PCT_GUSA * blendPrecoMedio;
  }

  const faturamentoTotal = receitaGusa + receitaSucata;

  const custoPorTonGusa =
    producao.gusaVazado > 0 ? custoTotal / producao.gusaVazado : 0;
  const margemPorTon =
    producao.gusaVazado > 0 ? cliente.precoGusa - custoPorTonGusa : 0;
  const resultadoCorrida = faturamentoTotal - custoTotal;
  const resultadoProjetadoMes =
    resultadoCorrida * parametros.corridasPorDia * 30;

  return {
    custoMaterias,
    custoQuebras,
    custoFixo,
    custoFrete,
    custoTotal,
    custoPorTonGusa,
    receitaGusa,
    receitaSucata,
    creditoFuturoReprocesso,
    faturamentoTotal,
    debitoTributos,
    creditoTributos,
    tributosLiquidos,
    margemPorTon,
    resultadoCorrida,
    resultadoProjetadoMes,
  };
}
