import { notFound } from 'next/navigation';

import { MinerioForm } from '@/components/cadastros/MinerioForm';
import { atualizarMinerioAction } from '@/lib/actions/minerio-actions';
import { getMinerioAtivo } from '@/lib/queries/minerios';

type Props = { params: Promise<{ id: string }> };

export default async function EditarMinerioPage({ params }: Props) {
  const { id } = await params;
  const minerio = await getMinerioAtivo(id);
  if (!minerio) notFound();

  const action = atualizarMinerioAction.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Editar minério</h1>
        <p className="text-sm text-muted-foreground">
          Alterar cria nova versão; a atual é arquivada.
        </p>
      </header>
      <MinerioForm
        action={action}
        initial={minerio}
        submitLabel="Salvar"
        onCancelHref="/cadastros/minerios"
      />
    </div>
  );
}
