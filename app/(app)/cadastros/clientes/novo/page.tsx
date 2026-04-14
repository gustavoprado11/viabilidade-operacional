import { ClienteForm } from '@/components/cadastros/ClienteForm';
import { criarClienteAction } from '@/lib/actions/cliente-actions';

export default function NovoClientePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Novo cliente</h1>
        <p className="text-sm text-muted-foreground">
          Especificação química do gusa e preço negociado.
        </p>
      </header>
      <ClienteForm
        action={criarClienteAction}
        submitLabel="Criar cliente"
        onCancelHref="/cadastros/clientes"
      />
    </div>
  );
}
