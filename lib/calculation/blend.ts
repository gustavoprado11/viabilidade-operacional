import type { BlendItem, BlendQuimica } from './types';

/**
 * Média ponderada das propriedades químicas e do preço dos minérios do blend.
 * Fórmula: propBlend = Σ (pct[i]/100 × propMinerio[i]).
 * Assume Σ pct = 100 (validado pelo schema do input no orquestrador).
 */
export function calcularBlendQuimica(
  blend: ReadonlyArray<BlendItem>,
): BlendQuimica {
  let fe = 0;
  let sio2 = 0;
  let al2o3 = 0;
  let p = 0;
  let mn = 0;
  let cao = 0;
  let mgo = 0;
  let ppc = 0;
  let precoMedio = 0;

  for (const item of blend) {
    const w = item.pct / 100;
    fe += w * item.minerio.fe;
    sio2 += w * item.minerio.sio2;
    al2o3 += w * item.minerio.al2o3;
    p += w * item.minerio.p;
    mn += w * item.minerio.mn;
    cao += w * item.minerio.cao;
    mgo += w * item.minerio.mgo;
    ppc += w * item.minerio.ppc;
    precoMedio += w * item.minerio.preco;
  }

  return { fe, sio2, al2o3, p, mn, cao, mgo, ppc, precoMedio };
}
