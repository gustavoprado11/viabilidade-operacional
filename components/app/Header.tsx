import { UserMenu } from './UserMenu';

type Props = { email: string | null | undefined };

export function Header({ email }: Props) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <div>
        <p className="text-sm font-semibold">Siderúrgica Bandeirante</p>
        <p className="text-xs text-muted-foreground">Análise de Lâminas</p>
      </div>
      <UserMenu email={email} />
    </header>
  );
}
