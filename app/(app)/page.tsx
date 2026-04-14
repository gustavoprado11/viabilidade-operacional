import Link from 'next/link';
import {
  BarChart3,
  FileText,
  FlaskConical,
  Layers,
  Sliders,
  SlidersHorizontal,
} from 'lucide-react';
import type { ComponentType } from 'react';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getCurrentUser } from '@/lib/queries/auth';

type Modulo = {
  href: string;
  titulo: string;
  descricao: string;
  icon: ComponentType<{ className?: string }>;
};

const modulos: Modulo[] = [
  {
    href: '/cadastros/minerios',
    titulo: 'Cadastros',
    descricao: 'Minérios, fundentes, clientes e parâmetros do forno.',
    icon: FileText,
  },
  {
    href: '/laminas/nova',
    titulo: 'Simulador de Lâmina',
    descricao: 'Simular blend, calcular rendimento e viabilidade.',
    icon: Layers,
  },
  {
    href: '/corridas',
    titulo: 'Corridas',
    descricao: 'Histórico de corridas reais e desvios vs simulação.',
    icon: FlaskConical,
  },
  {
    href: '/calibracao',
    titulo: 'Calibração',
    descricao: 'Ajustar coeficientes do modelo com dados reais.',
    icon: SlidersHorizontal,
  },
  {
    href: '/otimizador',
    titulo: 'Otimizador',
    descricao: 'Busca automática do blend ótimo dentro das restrições.',
    icon: Sliders,
  },
  {
    href: '/relatorios',
    titulo: 'Relatórios',
    descricao: 'Agregados por período, exportação CSV/Excel/PDF.',
    icon: BarChart3,
  },
];

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Olá, {user?.email ?? 'usuário'}</CardTitle>
          <CardDescription>
            Bem-vindo ao sistema de análise de lâminas da Siderúrgica
            Bandeirante.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modulos.map(({ href, titulo, descricao, icon: Icon }) => (
          <Link key={href} href={href} className="block">
            <Card className="h-full transition-colors hover:bg-accent/40">
              <CardHeader>
                <Icon className="mb-2 h-6 w-6 text-muted-foreground" />
                <CardTitle className="text-lg">{titulo}</CardTitle>
                <CardDescription>{descricao}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
