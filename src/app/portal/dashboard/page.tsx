import PageHeader from "@/components/shared/page-header"; // Assuming admin layout is still used
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Note: This page will inherit the admin AppLayout because it's not in a route group with its own layout.
// For a true client portal, you'd use a route group like (portal)/portal/dashboard/page.tsx
// and (portal)/layout.tsx to give it a distinct, simpler layout.

export default function ClientDashboardPage() {
  return (
    <div className="flex flex-col min-h-screen">
        {/* This header would be part of a dedicated client portal layout */}
        <header className="bg-card p-4 border-b shadow-sm">
            <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-xl font-semibold text-primary">Client Portal</h1>
                <Button variant="ghost" asChild>
                    <Link href="/portal/login">Log Out</Link>
                </Button>
            </div>
        </header>

        <main className="flex-1 p-4 md:p-8 bg-background">
             <PageHeader 
                title="Welcome, Client!" 
                description="Here's an overview of your account."
            />
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-md">
                <CardHeader>
                    <CardTitle>My Invoices</CardTitle>
                    <CardDescription>View your recent and outstanding invoices.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Invoice listing coming soon.</p>
                    <Button className="mt-4">View All Invoices</Button>
                </CardContent>
                </Card>
                <Card className="shadow-md">
                <CardHeader>
                    <CardTitle>Tracked Time</CardTitle>
                    <CardDescription>Review time logged for your projects.</CardHeader>
                </CardContent>
                <CardContent>
                    <p className="text-muted-foreground">Time tracking details coming soon.</p>
                    <Button className="mt-4">View Time Logs</Button>
                </CardContent>
                </Card>
            </div>
            <p className="mt-8 text-center text-sm text-muted-foreground">
                This is a demonstration client dashboard. Full functionality is not implemented.
            </p>
             <div className="mt-4 text-center">
                <Link href="/" className="text-sm text-primary/80 hover:text-primary underline">
                    &larr; Back to Admin App (Demo Link)
                </Link>
            </div>
        </main>
    </div>
  );
}
