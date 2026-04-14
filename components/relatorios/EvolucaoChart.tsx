'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Ponto = { t: string; margem: number; nome: string; classificacao: string };

export function EvolucaoChart({ serie }: { serie: Ponto[] }) {
  const data = serie.map((p) => ({
    ...p,
    label: new Date(p.t).toLocaleDateString('pt-BR'),
  }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 24, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="label" fontSize={11} />
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
            labelFormatter={(l) => String(l)}
          />
          <Line
            type="monotone"
            dataKey="margem"
            name="Margem/ton"
            stroke="#0f172a"
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
