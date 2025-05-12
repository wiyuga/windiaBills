"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button"; // Use Button for nav items
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ListChecks,
  FileText,
  CreditCard,
} from 'lucide-react';

const navItems = [
  { href: '/portal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/portal/tasks', label: 'My Tasks', icon: ListChecks },
  { href: '/portal/invoices', label: 'My Invoices', icon: FileText },
  { href: '/portal/payments', label: 'Payment History', icon: CreditCard },
];

export default function ClientPortalSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href} passHref legacyBehavior>
          <Button
            variant={pathname.startsWith(item.href) ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
               pathname.startsWith(item.href) ? "bg-primary/10 text-primary" : ""
            )}
            aria-label={item.label}
          >
            <item.icon className="h-5 w-5 mr-3" />
            <span>{item.label}</span>
          </Button>
        </Link>
      ))}
    </nav>
  );
}
