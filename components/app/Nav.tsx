'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  FileText,
  FlaskConical,
  Home,
  Layers,
  Sliders,
  SlidersHorizontal,
} from 'lucide-react';
import type { ComponentType } from 'react';

import { cn } from '@/lib/utils';

type NavItem = { href: string; label: string; icon: ComponentType<{ className?: string }> };

const items: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/cadastros/minerios', label: 'Cadastros', icon: FileText },
  { href: '/laminas/nova', label: 'Lâminas', icon: Layers },
  { href: '/corridas', label: 'Corridas', icon: FlaskConical },
  { href: '/calibracao', label: 'Calibração', icon: SlidersHorizontal },
  { href: '/otimizador', label: 'Otimizador', icon: Sliders },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
];

export function Nav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href.split('/')[1] ? `/${href.split('/')[1]}` : href);

  return (
    <nav className="flex flex-col gap-1 p-4">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            isActive(href)
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
