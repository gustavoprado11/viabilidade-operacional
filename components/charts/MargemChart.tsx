'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { LaminaResultado } from '@/lib/calculation/types';
import type { Simulacao } from '@/lib/comparativo/rows';

const COLOR: Record<string, string> = {
  viavel: '#16a34a',
  alerta: '#d97706',
  inviavel: '#dc2626',
};

export function MargemChart({ laminas }: { laminas: Simulacao[] }) {
  const data = laminas.map((l) => {
    const r = l.resultado as unknown as LaminaResultado | null;
    return {
      nome: l.nome,
      resultadoMes: r?.financeiro.resultadoProjetadoMes ?? 0,
      classificacao: l.classificacao,
    };
  });

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 24, bottom: 32 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="nome" angle={-15} textAnchor="end" height={50} fontSize={12} />
          <YAxis
            tickFormatter={(v: number) =>
              v.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              })
            }
            fontSize={12}
          />
          <Tooltip
            formatter={(v: number) =>
              v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            }
          />
          <Bar dataKey="resultadoMes" name="Resultado/mês">
            {data.map((d, i) => (
              <Cell key={i} fill={COLOR[d.classificacao] ?? '#64748b'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
