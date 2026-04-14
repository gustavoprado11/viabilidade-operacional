import { notFound } from 'next/navigation';

import { InsumoForm } from '@/components/cadastros/InsumoForm';
import { atualizarInsumoAction } from '@/lib/actions/insumo-actions';
import { getInsumoAtivo } from '@/lib/queries/insumos';

type Props = { params: Promise<{ id: string }> };

export default async function EditarInsumoPage({ params }: Props) {
  const { id } = await params;
  const insumo = await getInsumoAtivo(id);
  if (!insumo) notFound();

  const action = atualizarInsumoAction.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Editar insumo</h1>
        <p className="text-sm text-muted-foreground">
          Alterar cria nova versão; a atual é arquivada.
        </p>
      </header>
      <InsumoForm
        action={action}
        initial={insumo}
        submitLabel="Salvar"
        onCancelHref="/cadastros/fundentes"
      />
    </div>
  );
}
