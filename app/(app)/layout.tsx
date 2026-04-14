import { redirect } from 'next/navigation';

import { Header } from '@/components/app/Header';
import { Nav } from '@/components/app/Nav';
import { getCurrentUser } from '@/lib/queries/auth';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="flex min-h-screen flex-col">
      <Header email={user.email} />
      <div className="flex flex-1">
        <aside className="w-60 shrink-0 border-r bg-muted/20">
          <Nav />
        </aside>
        <main className="flex-1 overflow-x-auto p-6">{children}</main>
      </div>
    </div>
  );
}
