import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900 flex flex-col">
      <Navbar user={user} />
      <div className="flex flex-1">
        <Suspense fallback={<div className="w-[240px] bg-[#0e2a18] min-h-screen" />}>
          <Sidebar userRole={user.role} />
        </Suspense>
        <main className="flex-1 p-6 overflow-y-auto max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
