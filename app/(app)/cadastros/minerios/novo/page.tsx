import { MinerioForm } from '@/components/cadastros/MinerioForm';
import { criarMinerioAction } from '@/lib/actions/minerio-actions';

export default function NovoMinerioPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Novo minério</h1>
      </header>
      <MinerioForm
        action={criarMinerioAction}
        submitLabel="Criar minério"
        onCancelHref="/cadastros/minerios"
      />
    </div>
  );
}
