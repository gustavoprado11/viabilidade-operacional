import { notFound } from 'next/navigation';

import { ClienteForm } from '@/components/cadastros/ClienteForm';
import { atualizarClienteAction } from '@/lib/actions/cliente-actions';
import { getClienteAtivo } from '@/lib/queries/clientes';

type Props = { params: Promise<{ id: string }> };

export default async function EditarClientePage({ params }: Props) {
  const { id } = await params;
  const cliente = await getClienteAtivo(id);
  if (!cliente) notFound();

  const action = atualizarClienteAction.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Editar cliente</h1>
        <p className="text-sm text-muted-foreground">
          Alterar cria nova versão; a atual é arquivada.
        </p>
      </header>
      <ClienteForm
        action={action}
        initial={cliente}
        submitLabel="Salvar"
        onCancelHref="/cadastros/clientes"
      />
    </div>
  );
}
