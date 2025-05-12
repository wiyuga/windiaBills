import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, ListChecks, FileText, CreditCard } from 'lucide-react';
import ClientPortalSidebarNav from './components/client-portal-sidebar-nav'; // New component

export const metadata: Metadata = {
  title: 'Client Portal - TimeBill Pro',
  description: 'Manage your projects, tasks, and invoices.',
};

export default function ClientPortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <div className="flex min-h-screen">
          <aside className="w-64 bg-card border-r p-4 flex flex-col">
            <div className="mb-6">
                <Link href="/portal/dashboard" className="flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-primary"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                    <h1 className="text-xl font-semibold">Client Portal</h1>
                </Link>
            </div>
            <ClientPortalSidebarNav />
            <div className="mt-auto">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/portal/login">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Link>
              </Button>
            </div>
          </aside>
          <main className="flex-1 p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
