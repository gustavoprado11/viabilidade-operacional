import Link from 'next/link';

const tabs = [
  { href: '/cadastros/minerios', label: 'Minérios' },
  { href: '/cadastros/fundentes', label: 'Fundentes e insumos' },
  { href: '/cadastros/clientes', label: 'Clientes' },
  { href: '/cadastros/parametros', label: 'Parâmetros' },
];

export default function CadastrosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-2 border-b pb-2">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
