import type {
  EscoriaResult,
  FundenteInput,
  LaminaInput,
  ProducaoResult,
} from './types';

/**
 * Calcário (ton) necessário para atingir B2 alvo.
 *
 * calc = (B2 × (SiO2_min + SiO2_baux + SiO2_dolom) − (CaO_min + CaO_baux + CaO_dolom))
 *      / (CaO_calc_frac − B2 × SiO2_calc_frac)
 *
 * Todos os _ton em toneladas; frações são pct/100.
 * Piso em 0: se a conta der negativa (já há CaO sobrando), retorna 0.
 */
export function calcularCalcarioParaB2(
  sio2Parcial: number,
  caoParcial: number,
  b2Alvo: number,
  calcario: FundenteInput,
): number {
  const caoFrac = calcario.cao / 100;
  const sio2Frac = calcario.sio2 / 100;
  const numerador = b2Alvo * sio2Parcial - caoParcial;
  const denominador = caoFrac - b2Alvo * sio2Frac;
  if (denominador <= 0) return 0;
  const ton = numerador / denominador;
  return Math.max(0, ton);
}

/**
 * Calcula composição da escória e basicidades.
 *
 * Contribuições em toneladas de cada óxido:
 *   minério:   (consumoMinerio × pct_óxido / 100)
 *   fundentes: (kg_fundente / 1000 × pct_óxido / 100)
 *
 * B2 = CaO / SiO2
 * B4 = (CaO + MgO) / (SiO2 + Al2O3)
 * al2o3Pct = al2o3Ton / volumeTon × 100
 * mgoAl2o3 = mgoTon / al2o3Ton
 */
export function calcularEscoria(
  input: LaminaInput,
  producao: ProducaoResult,
): EscoriaResult {
  const { fundentes, parametros, blend } = input;
  const consumo = producao.consumoMinerioCorrida;

  // Blend chemistry at weighted average for each oxide
  let sio2MinPct = 0;
  let al2o3MinPct = 0;
  let caoMinPct = 0;
  let mgoMinPct = 0;
  for (const item of blend) {
    const w = item.pct / 100;
    sio2MinPct += w * item.minerio.sio2;
    al2o3MinPct += w * item.minerio.al2o3;
    caoMinPct += w * item.minerio.cao;
    mgoMinPct += w * item.minerio.mgo;
  }

  const sio2MinTon = (consumo * sio2MinPct) / 100;
  const al2o3MinTon = (consumo * al2o3MinPct) / 100;
  const caoMinTon = (consumo * caoMinPct) / 100;
  const mgoMinTon = (consumo * mgoMinPct) / 100;

  const bauxTon = fundentes.bauxita.kg / 1000;
  const dolomTon = fundentes.dolomita.kg / 1000;

  const sio2Baux = (bauxTon * fundentes.bauxita.dados.sio2) / 100;
  const al2o3Baux = (bauxTon * fundentes.bauxita.dados.al2o3) / 100;
  const caoBaux = (bauxTon * fundentes.bauxita.dados.cao) / 100;
  const mgoBaux = (bauxTon * fundentes.bauxita.dados.mgo) / 100;

  const sio2Dolom = (dolomTon * fundentes.dolomita.dados.sio2) / 100;
  const al2o3Dolom = (dolomTon * fundentes.dolomita.dados.al2o3) / 100;
  const caoDolom = (dolomTon * fundentes.dolomita.dados.cao) / 100;
  const mgoDolom = (dolomTon * fundentes.dolomita.dados.mgo) / 100;

  const sio2Parcial = sio2MinTon + sio2Baux + sio2Dolom;
  const caoParcial = caoMinTon + caoBaux + caoDolom;

  // Calcário: se manual, usa o input direto; senão recalcula para B2 alvo.
  const calcarioTon = input.calcarioManual
    ? fundentes.calcario.kg / 1000
    : calcularCalcarioParaB2(
        sio2Parcial,
        caoParcial,
        parametros.b2Alvo,
        fundentes.calcario.dados,
      );

  const sio2Calc = (calcarioTon * fundentes.calcario.dados.sio2) / 100;
  const al2o3Calc = (calcarioTon * fundentes.calcario.dados.al2o3) / 100;
  const caoCalc = (calcarioTon * fundentes.calcario.dados.cao) / 100;
  const mgoCalc = (calcarioTon * fundentes.calcario.dados.mgo) / 100;

  const sio2Ton = sio2Parcial + sio2Calc;
  const al2o3Ton = al2o3MinTon + al2o3Baux + al2o3Dolom + al2o3Calc;
  const caoTon = caoParcial + caoCalc;
  const mgoTon = mgoMinTon + mgoBaux + mgoDolom + mgoCalc;

  const volumeTon = sio2Ton + al2o3Ton + caoTon + mgoTon;

  const b2 = sio2Ton > 0 ? caoTon / sio2Ton : 0;
  const b4 =
    sio2Ton + al2o3Ton > 0 ? (caoTon + mgoTon) / (sio2Ton + al2o3Ton) : 0;
  const al2o3Pct = volumeTon > 0 ? (al2o3Ton / volumeTon) * 100 : 0;
  const mgoAl2o3 = al2o3Ton > 0 ? mgoTon / al2o3Ton : 0;
  const volumePorTonGusa =
    producao.gusaVazado > 0 ? (volumeTon * 1000) / producao.gusaVazado : 0;

  return {
    sio2Ton,
    al2o3Ton,
    caoTon,
    mgoTon,
    volumeTon,
    volumePorTonGusa,
    b2,
    b4,
    al2o3Pct,
    mgoAl2o3,
    calcarioNecessario: calcarioTon,
    contribuicoes: {
      sio2: { minerio: sio2MinTon, bauxita: sio2Baux, calcario: sio2Calc, dolomita: sio2Dolom },
      al2o3: { minerio: al2o3MinTon, bauxita: al2o3Baux, calcario: al2o3Calc, dolomita: al2o3Dolom },
      cao: { minerio: caoMinTon, bauxita: caoBaux, calcario: caoCalc, dolomita: caoDolom },
      mgo: { minerio: mgoMinTon, bauxita: mgoBaux, calcario: mgoCalc, dolomita: mgoDolom },
    },
  };
}
