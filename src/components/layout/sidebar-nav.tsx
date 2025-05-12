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
  Settings as SettingsIcon, // Renamed to avoid conflict if Settings is a component
  LogIn,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, tooltip: "Dashboard" },
  { href: '/clients', label: 'Clients', icon: Users, tooltip: "Clients" },
  { href: '/tasks', label: 'Tasks', icon: ListChecks, tooltip: "Tasks" },
  { href: '/invoices', label: 'Invoices', icon: FileText, tooltip: "Invoices" },
  { href: '/payments', label: 'Payments', icon: CreditCard, tooltip: "Payments" },
  { href: '/settings', label: 'Settings', icon: SettingsIcon, tooltip: "Settings" },
  { href: '/portal/login', label: 'Client Portal', icon: LogIn, tooltip: "Client Portal" },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} passHref legacyBehavior>
            <SidebarMenuButton
              className={cn(
                "w-full justify-start",
                pathname === item.href ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
              )}
              isActive={pathname === item.href}
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
