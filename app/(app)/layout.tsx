import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { getSession } from '@/lib/auth/session';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role={session.role} organizationName={session.organizationName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar fullName={session.fullName} email={session.email} role={session.role} />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
