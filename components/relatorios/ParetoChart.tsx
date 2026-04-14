'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Item = { categoria: string; media: number };

export function ParetoChart({ itens }: { itens: Item[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={itens} margin={{ top: 8, right: 16, left: 24, bottom: 32 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="categoria" fontSize={11} angle={-15} textAnchor="end" height={50} />
          <YAxis
            tickFormatter={(v: number) =>
              v.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              })
            }
            fontSize={11}
          />
          <Tooltip
            formatter={(v: number) =>
              v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            }
          />
          <Bar dataKey="media" name="Média por corrida" fill="#0f172a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
