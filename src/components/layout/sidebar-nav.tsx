
// src/components/layout/sidebar-nav.tsx
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ListChecks,
  FileText,
  CreditCard,
  Settings as SettingsIcon, 
  LogIn,
  Briefcase, // Icon for Services
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, tooltip: "Dashboard" },
  { href: '/clients', label: 'Clients', icon: Users, tooltip: "Clients" },
  { href: '/tasks', label: 'Tasks', icon: ListChecks, tooltip: "Tasks" },
  { href: '/invoices', label: 'Invoices', icon: FileText, tooltip: "Invoices" },
  { href: '/payments', label: 'Payments', icon: CreditCard, tooltip: "Payments" },
  { href: '/services', label: 'Services', icon: Briefcase, tooltip: "Services"}, // New
  { href: '/settings', label: 'Settings', icon: SettingsIcon, tooltip: "Settings" },
  { href: '/portal/login', label: 'Client Portal', icon: LogIn, tooltip: "Client Portal" },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href}>
            <SidebarMenuButton
              asChild={false} // Ensure SidebarMenuButton is not trying to render its own anchor
              className={cn(
                "w-full justify-start",
                pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)) ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
              )}
              isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
              tooltip={{ children: item.tooltip, side: "right", align: "center" }}
              aria-label={item.label}
            >
              <item.icon className="h-5 w-5 mr-3" />
              <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
