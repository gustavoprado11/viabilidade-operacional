'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  calcularDestaques,
  diferencaSignificativa,
  type Destaque,
} from '@/lib/comparativo/destaques';
import {
  ROWS,
  SECTIONS,
  type RowContext,
  type Section,
  type Simulacao,
} from '@/lib/comparativo/rows';
import type { Database } from '@/lib/supabase/types';

type Props = {
  laminas: Simulacao[];
  minerios: Database['public']['Tables']['minerios']['Row'][];
  clientes: Database['public']['Tables']['clientes']['Row'][];
};

function classeDestaque(d: Destaque) {
  if (d === 'melhor') return 'text-emerald-600 font-medium';
  if (d === 'pior') return 'text-destructive font-medium';
  return '';
}

export function ComparativoTabela({ laminas, minerios, clientes }: Props) {
  const [collapsed, setCollapsed] = useState<Record<Section, boolean>>({
    Identificação: false,
    Blend: false,
    Forno: false,
    Escória: false,
    Gusa: false,
    Financeiro: false,
  });

  const ctx: RowContext = {
    mineriosById: new Map(minerios.map((m) => [m.id, m])),
    clientesById: new Map(clientes.map((c) => [c.id, c])),
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-64">Parâmetro</TableHead>
          {laminas.map((l) => (
            <TableHead key={l.id} className="min-w-40">
              {l.nome}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {SECTIONS.map((section) => {
          const rows = ROWS.filter((r) => r.section === section);
          const colap = collapsed[section];
          return (
            <>
              <TableRow key={`h-${section}`} className="bg-muted/50">
                <TableCell colSpan={laminas.length + 1} className="py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setCollapsed((prev) => ({ ...prev, [section]: !colap }))
                    }
                    className="h-7 px-2 text-xs font-semibold"
                  >
                    {colap ? '▸' : '▾'} {section}
                  </Button>
                </TableCell>
              </TableRow>
              {!colap
                ? rows.map((row) => {
                    const raw = laminas.map((l) => row.extract(l, ctx));
                    const nums = raw.map((v) => (typeof v === 'number' ? v : null));
                    const destaques = calcularDestaques(nums, row.direcao);
                    const sig = diferencaSignificativa(nums);
                    return (
                      <TableRow key={`${section}-${row.label}`}>
                        <TableCell
                          className={`text-sm ${sig ? 'font-medium' : 'text-muted-foreground'}`}
                        >
                          {row.label}
                        </TableCell>
                        {raw.map((v, i) => (
                          <TableCell
                            key={i}
                            className={`text-sm tabular-nums ${classeDestaque(destaques[i] ?? null)}`}
                          >
                            {row.format ? row.format(v) : String(v ?? '—')}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })
                : null}
            </>
          );
        })}
      </TableBody>
    </Table>
  );
}
