'use client';

import {
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { LaminaResultado } from '@/lib/calculation/types';
import type { Simulacao } from '@/lib/comparativo/rows';

export function SensibilidadeChart({ laminas }: { laminas: Simulacao[] }) {
  const data = laminas
    .map((l) => {
      const r = l.resultado as unknown as LaminaResultado | null;
      if (!r) return null;
      return {
        nome: l.nome,
        fe: r.blend.fe,
        resultadoMes: r.financeiro.resultadoProjetadoMes,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 16, left: 24, bottom: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="fe"
            type="number"
            domain={['auto', 'auto']}
            tickFormatter={(v: number) => `${v.toFixed(2)}%`}
            fontSize={12}
            name="Fe blend"
          />
          <YAxis
            dataKey="resultadoMes"
            type="number"
            tickFormatter={(v: number) =>
              v.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              })
            }
            fontSize={12}
            name="Resultado/mês"
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            formatter={(v: number, name: string) => {
              if (name === 'fe') return `${v.toFixed(2)}%`;
              if (name === 'resultadoMes')
                return v.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                });
              return v;
            }}
          />
          <Scatter data={data} fill="#0f172a">
            <LabelList dataKey="nome" position="top" fontSize={11} />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
