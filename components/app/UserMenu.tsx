import { LogOut } from 'lucide-react';

import { logoutAction } from '@/app/login/actions';
import { Button } from '@/components/ui/button';

type Props = { email: string | null | undefined };

export function UserMenu({ email }: Props) {
  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-muted-foreground sm:inline">
        {email}
      </span>
      <form action={logoutAction}>
        <Button type="submit" variant="outline" size="sm">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </form>
    </div>
  );
}
