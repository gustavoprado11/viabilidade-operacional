'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { Simulacao } from '@/lib/queries/simulacoes';

type Props = {
  disponiveis: Pick<
    Simulacao,
    'id' | 'nome' | 'tipo' | 'classificacao' | 'created_at'
  >[];
  selecionadasIds: string[];
};

const classLabel: Record<string, string> = {
  viavel: 'Viável',
  alerta: 'Alerta',
  inviavel: 'Inviável',
};

export function SeletorLaminas({ disponiveis, selecionadasIds }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [pending, setPending] = useState<string[]>(selecionadasIds);

  const filtered = useMemo(() => {
    if (!query) return disponiveis;
    const q = query.toLowerCase();
    return disponiveis.filter((l) => l.nome.toLowerCase().includes(q));
  }, [disponiveis, query]);

  const toggle = (id: string) => {
    setPending((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const aplicar = () => {
    const params = new URLSearchParams();
    if (pending.length > 0) params.set('ids', pending.join(','));
    router.push(`/laminas/comparar${params.toString() ? `?${params.toString()}` : ''}`);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setPending(selecionadasIds);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="abrir-seletor">
          Selecionar lâminas ({selecionadasIds.length}/4)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-auto">
        <DialogHeader>
          <DialogTitle>Selecionar lâminas</DialogTitle>
          <DialogDescription>
            Escolha até 4 lâminas para comparar. Ordem da seleção é preservada.
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder="Buscar por nome…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="space-y-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma lâmina encontrada.</p>
          ) : (
            filtered.map((l) => {
              const checked = pending.includes(l.id);
              const atLimit = !checked && pending.length >= 4;
              return (
                <label
                  key={l.id}
                  className={`flex cursor-pointer items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm ${checked ? 'border-primary bg-accent/40' : ''} ${atLimit ? 'opacity-50' : ''}`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={atLimit}
                      onChange={() => toggle(l.id)}
                      data-testid={`check-${l.nome}`}
                    />
                    <span>
                      <span className="font-medium">{l.nome}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {l.tipo === 'corrida_real' ? 'Corrida real' : 'Simulação'} ·{' '}
                        {classLabel[l.classificacao] ?? l.classificacao}
                      </span>
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(l.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </label>
              );
            })
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={aplicar} disabled={pending.length === 0} data-testid="aplicar-selecao">
            Comparar ({pending.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
