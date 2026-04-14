import { describe, it, expect } from 'vitest';

import { calcularBlendQuimica } from '@/lib/calculation/blend';
import { calcularFinanceiro } from '@/lib/calculation/financial';
import { calcularEscoria } from '@/lib/calculation/slag';
import { calcularProducao } from '@/lib/calculation/yield';
import {
  blend15_15_70,
  blend50Serra50Trindade,
  makeInput,
} from '@/tests/fixtures/inputs';

function pipeline(input: ReturnType<typeof makeInput>) {
  const bq = calcularBlendQuimica(input.blend);
  const producao = calcularProducao(input, bq.fe);
  const escoria = calcularEscoria(input, producao);
  const fin = calcularFinanceiro(input, producao, escoria, bq.precoMedio);
  return { bq, producao, escoria, fin };
}

describe('calcularFinanceiro', () => {
  it('tributos_liquidos = débitos − créditos', () => {
    const { fin } = pipeline(makeInput(blend15_15_70));
    expect(fin.tributosLiquidos).toBeCloseTo(
      fin.debitoTributos - fin.creditoTributos,
      6,
    );
  });

  it('custo_total = materias + quebras + fixo + frete + tributos', () => {
    const { fin } = pipeline(makeInput(blend15_15_70));
    expect(fin.custoTotal).toBeCloseTo(
      fin.custoMaterias +
        fin.custoQuebras +
        fin.custoFixo +
        fin.custoFrete +
        fin.tributosLiquidos,
      4,
    );
  });

  it('resultado = (receita gusa + receita sucata) − custo total', () => {
    const input = makeInput(blend50Serra50Trindade, {
      sucata: { kg: 500, precoTon: 800, destino: 'venda' },
    });
    const { fin } = pipeline(input);
    expect(fin.resultadoCorrida).toBeCloseTo(
      fin.receitaGusa + fin.receitaSucata - fin.custoTotal,
      4,
    );
  });

  it('sucata destino=venda gera receitaSucata e zero creditoFuturoReprocesso', () => {
    const input = makeInput(blend50Serra50Trindade, {
      sucata: { kg: 1000, precoTon: 500, destino: 'venda' },
    });
    const { fin } = pipeline(input);
    // 1000 kg = 1 ton × 500 R$/ton = 500
    expect(fin.receitaSucata).toBe(500);
    expect(fin.creditoFuturoReprocesso).toBe(0);
  });

  it('sucata destino=reprocesso → receitaSucata=0 e creditoFuturo informativo', () => {
    const input = makeInput(blend50Serra50Trindade, {
      sucata: { kg: 1000, precoTon: 500, destino: 'reprocesso' },
    });
    const { bq, fin } = pipeline(input);
    expect(fin.receitaSucata).toBe(0);
    // 1 ton × 0.94 × precoMedioBlend
    expect(fin.creditoFuturoReprocesso).toBeCloseTo(0.94 * bq.precoMedio, 4);
  });

  it('margem/ton = preço_gusa − custo/ton', () => {
    const input = makeInput(blend15_15_70);
    const { fin } = pipeline(input);
    expect(fin.margemPorTon).toBeCloseTo(
      input.cliente.precoGusa - fin.custoPorTonGusa,
      4,
    );
  });

  it('trata créditos undefined como 0 (carvão, coque, fundentes sem crédito)', () => {
    const input = makeInput(blend15_15_70, {
      carvao: { mdc: 23.3, densidade: 220, preco: 360 },
      coque: { kg: 1280, preco: 1408 },
      fundentes: {
        calcario: {
          kg: 600,
          dados: {
            nome: 'cal',
            preco: 94,
            sio2: 2,
            al2o3: 0.5,
            cao: 52,
            mgo: 2,
          },
        },
        bauxita: {
          kg: 200,
          dados: {
            nome: 'baux',
            preco: 508,
            sio2: 6,
            al2o3: 55,
            cao: 0.5,
            mgo: 0.3,
          },
        },
        dolomita: {
          kg: 0,
          dados: {
            nome: 'dolom',
            preco: 120,
            sio2: 1.5,
            al2o3: 0.3,
            cao: 30,
            mgo: 21,
          },
        },
      },
    });
    const { fin } = pipeline(input);
    // Crédito vem apenas dos minérios (carvão/coque/fundentes com pis/icms undefined tratados como 0)
    expect(fin.creditoTributos).toBeGreaterThan(0);
  });

  it('custo/ton = 0 quando gusaVazado = 0', () => {
    // Força produção nula: sucata gerada >= produção total
    const input = makeInput(blend15_15_70, {
      sucata: { kg: 1e9, precoTon: 0, destino: 'venda' },
    });
    const { fin, producao } = pipeline(input);
    expect(producao.gusaVazado).toBe(0);
    expect(fin.custoPorTonGusa).toBe(0);
    expect(fin.margemPorTon).toBe(0);
  });
});
