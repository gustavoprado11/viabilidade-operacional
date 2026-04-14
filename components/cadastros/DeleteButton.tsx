'use client';

import { useState, useTransition } from 'react';

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

type Props = {
  onConfirm: () => Promise<void>;
  entity: string;
};

export function DeleteButton({ onConfirm, entity }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Excluir
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir {entity}?</DialogTitle>
          <DialogDescription>
            A exclusão é reversível — o registro fica arquivado no histórico,
            não some do banco.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await onConfirm();
                setOpen(false);
              })
            }
          >
            {pending ? 'Excluindo…' : 'Excluir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
