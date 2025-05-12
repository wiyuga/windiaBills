import React from 'react';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarInset } from "@/components/ui/sidebar";
import Header from "./header";
import SidebarNav from "./sidebar-nav";
import { Separator } from '../ui/separator';
import Link from 'next/link';
import { Button } from '../ui/button';
import { LogOut } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon" variant="sidebar" className="border-r">
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            <h1 className="text-xl font-semibold group-data-[collapsible=icon]:hidden">TimeBill Pro</h1>
          </Link>
        </SidebarHeader>
        <Separator className="group-data-[collapsible=icon]:hidden" />
        <SidebarContent className="p-2">
          <SidebarNav />
        </SidebarContent>
        <Separator className="group-data-[collapsible=icon]:hidden" />
        <SidebarFooter className="p-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
          <Button variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:justify-center">
            <LogOut className="mr-2 group-data-[collapsible=icon]:mr-0 h-4 w-4" />
            <span className="group-data-[collapsible=icon]:hidden">Logout</span>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-background overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
