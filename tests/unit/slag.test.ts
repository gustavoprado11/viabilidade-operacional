import { describe, it, expect } from 'vitest';

import { calcularBlendQuimica } from '@/lib/calculation/blend';
import {
  calcularCalcarioParaB2,
  calcularEscoria,
} from '@/lib/calculation/slag';
import { calcularProducao } from '@/lib/calculation/yield';
import { bauxita, calcario, dolomita } from '@/tests/fixtures/minerios';
import {
  blend100Trindade,
  blend50Serra50Trindade,
  makeInput,
} from '@/tests/fixtures/inputs';

describe('calcularCalcarioParaB2', () => {
  it('retorna 0 quando o cálculo daria negativo (CaO já excede alvo)', () => {
    const ton = calcularCalcarioParaB2(1, 10, 0.825, calcario);
    expect(ton).toBe(0);
  });

  it('resultado positivo quando SiO2 domina', () => {
    const ton = calcularCalcarioParaB2(10, 0.5, 0.825, calcario);
    expect(ton).toBeGreaterThan(0);
  });

  it('retorna 0 quando denominador é não-positivo (calcário inviável)', () => {
    // calcário com CaO baixo e SiO2 alto: denom = 0.01 - 0.825 * 0.6 < 0
    const calcarioInviavel = { ...calcario, cao: 1, sio2: 60 };
    const ton = calcularCalcarioParaB2(10, 0.5, 0.825, calcarioInviavel);
    expect(ton).toBe(0);
  });
});

describe('calcularEscoria', () => {
  it('atinge B2 alvo quando calcário é dosado pela fórmula', () => {
    const input = makeInput(blend100Trindade);
    const blendQ = calcularBlendQuimica(input.blend);
    const producao = calcularProducao(input, blendQ.fe);
    const e = calcularEscoria(input, producao);
    expect(e.b2).toBeCloseTo(input.parametros.b2Alvo, 4);
  });

  it('100% Trindade gera Al2O3 escória bem acima de 17%', () => {
    const input = makeInput(blend100Trindade);
    const blendQ = calcularBlendQuimica(input.blend);
    const producao = calcularProducao(input, blendQ.fe);
    const e = calcularEscoria(input, producao);
    expect(e.al2o3Pct).toBeGreaterThan(17);
  });

  it('volumeTon = SiO2 + Al2O3 + CaO + MgO totais', () => {
    const input = makeInput(blend50Serra50Trindade);
    const blendQ = calcularBlendQuimica(input.blend);
    const producao = calcularProducao(input, blendQ.fe);
    const e = calcularEscoria(input, producao);
    expect(e.volumeTon).toBeCloseTo(
      e.sio2Ton + e.al2o3Ton + e.caoTon + e.mgoTon,
      6,
    );
  });

  it('dolomita aumenta relação MgO/Al2O3', () => {
    const semDolom = makeInput(blend50Serra50Trindade);
    const comDolom = makeInput(blend50Serra50Trindade, {
      fundentes: {
        calcario: semDolom.fundentes.calcario,
        bauxita: semDolom.fundentes.bauxita,
        dolomita: { kg: 5000, dados: semDolom.fundentes.dolomita.dados },
      },
    });
    const bq1 = calcularBlendQuimica(semDolom.blend);
    const bq2 = calcularBlendQuimica(comDolom.blend);
    const p1 = calcularProducao(semDolom, bq1.fe);
    const p2 = calcularProducao(comDolom, bq2.fe);
    const e1 = calcularEscoria(semDolom, p1);
    const e2 = calcularEscoria(comDolom, p2);
    expect(e2.mgoAl2o3).toBeGreaterThan(e1.mgoAl2o3);
  });

  it('volumePorTonGusa = 0 quando gusaVazado = 0', () => {
    const input = makeInput(blend50Serra50Trindade, {
      sucata: { kg: 1e9, precoTon: 0, destino: 'venda' },
    });
    const bq = calcularBlendQuimica(input.blend);
    const p = calcularProducao(input, bq.fe);
    const e = calcularEscoria(input, p);
    expect(p.gusaVazado).toBe(0);
    expect(e.volumePorTonGusa).toBe(0);
  });

  it('B2 / B4 / al2o3Pct / mgoAl2o3 retornam 0 quando escória vazia', () => {
    // Monta input com blend sem óxidos na fixture minerios "vazio"
    // Usa minério com todos óxidos zerados e sem fundentes para volumeTon=0
    const zeroMinerio = {
      id: 'zero',
      nome: 'zero',
      preco: 0,
      fe: 60,
      sio2: 0,
      al2o3: 0,
      p: 0,
      mn: 0,
      cao: 0,
      mgo: 0,
      ppc: 0,
      pisCredito: 0,
      icmsCredito: 0,
    };
    const input = makeInput([{ minerio: zeroMinerio, pct: 100 }], {
      fundentes: {
        calcario: { kg: 0, dados: { ...calcario, cao: 0, sio2: 0, al2o3: 0, mgo: 0 } },
        bauxita: {
          kg: 0,
          dados: {
            nome: 'x',
            preco: 0,
            sio2: 0,
            al2o3: 0,
            cao: 0,
            mgo: 0,
          },
        },
        dolomita: {
          kg: 0,
          dados: {
            nome: 'x',
            preco: 0,
            sio2: 0,
            al2o3: 0,
            cao: 0,
            mgo: 0,
          },
        },
      },
    });
    const bq = calcularBlendQuimica(input.blend);
    const p = calcularProducao(input, bq.fe);
    const e = calcularEscoria(input, p);
    expect(e.volumeTon).toBe(0);
    expect(e.b2).toBe(0);
    expect(e.b4).toBe(0);
    expect(e.al2o3Pct).toBe(0);
    expect(e.mgoAl2o3).toBe(0);
  });

  it('B4 = (CaO + MgO) / (SiO2 + Al2O3)', () => {
    const input = makeInput(blend50Serra50Trindade);
    const bq = calcularBlendQuimica(input.blend);
    const p = calcularProducao(input, bq.fe);
    const e = calcularEscoria(input, p);
    expect(e.b4).toBeCloseTo((e.caoTon + e.mgoTon) / (e.sio2Ton + e.al2o3Ton), 6);
  });

  it('calcarioManual=true usa valor do input (em kg/1000) — ignora B2 alvo', () => {
    const input = makeInput(blend50Serra50Trindade, {
      fundentes: {
        calcario: { kg: 1234, dados: calcario },
        bauxita: { kg: 192.5, dados: bauxita },
        dolomita: { kg: 0, dados: dolomita },
      },
      calcarioManual: true,
    });
    const bq = calcularBlendQuimica(input.blend);
    const p = calcularProducao(input, bq.fe);
    const e = calcularEscoria(input, p);
    expect(e.calcarioNecessario).toBeCloseTo(1234 / 1000, 6);
    // B2 alvo muito provavelmente não bate com 1234kg de calcário
    expect(Math.abs(e.b2 - input.parametros.b2Alvo)).toBeGreaterThan(0.001);
  });

  it('calcarioManual=false (default) recalcula para B2 alvo, ignorando input', () => {
    const input = makeInput(blend50Serra50Trindade, {
      fundentes: {
        calcario: { kg: 99999, dados: calcario }, // valor absurdo, deve ser ignorado
        bauxita: { kg: 192.5, dados: bauxita },
        dolomita: { kg: 0, dados: dolomita },
      },
    });
    const bq = calcularBlendQuimica(input.blend);
    const p = calcularProducao(input, bq.fe);
    const e = calcularEscoria(input, p);
    expect(e.b2).toBeCloseTo(input.parametros.b2Alvo, 4);
  });

  it('contribuicoes: cada óxido soma minerio+bauxita+calcario+dolomita = Ton total', () => {
    const input = makeInput(blend50Serra50Trindade);
    const bq = calcularBlendQuimica(input.blend);
    const p = calcularProducao(input, bq.fe);
    const e = calcularEscoria(input, p);
    for (const [ox, total] of [
      ['sio2', e.sio2Ton],
      ['al2o3', e.al2o3Ton],
      ['cao', e.caoTon],
      ['mgo', e.mgoTon],
    ] as const) {
      const c = e.contribuicoes[ox];
      expect(c.minerio + c.bauxita + c.calcario + c.dolomita).toBeCloseTo(total, 6);
    }
  });

  it('contribuicoes zeradas quando input de fundentes é 0 e minério sem óxido', () => {
    const zero = {
      id: 'z', nome: 'z', preco: 0, fe: 60,
      sio2: 0, al2o3: 0, p: 0, mn: 0, cao: 0, mgo: 0, ppc: 0,
      pisCredito: 0, icmsCredito: 0,
    };
    const input = makeInput([{ minerio: zero, pct: 100 }], {
      fundentes: {
        calcario: { kg: 0, dados: calcario },
        bauxita: { kg: 0, dados: bauxita },
        dolomita: { kg: 0, dados: dolomita },
      },
    });
    const bq = calcularBlendQuimica(input.blend);
    const p = calcularProducao(input, bq.fe);
    const e = calcularEscoria(input, p);
    for (const ox of ['sio2', 'al2o3', 'cao', 'mgo'] as const) {
      const c = e.contribuicoes[ox];
      expect(c.minerio).toBe(0);
      expect(c.bauxita).toBe(0);
      expect(c.calcario).toBe(0);
      expect(c.dolomita).toBe(0);
    }
  });
});
