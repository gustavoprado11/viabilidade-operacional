import { InsumoForm } from '@/components/cadastros/InsumoForm';
import { criarInsumoAction } from '@/lib/actions/insumo-actions';

export default function NovoInsumoPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Novo insumo</h1>
      </header>
      <InsumoForm
        action={criarInsumoAction}
        submitLabel="Criar insumo"
        onCancelHref="/cadastros/fundentes"
      />
    </div>
  );
}
