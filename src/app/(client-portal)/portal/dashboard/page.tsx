import PageHeader from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { mockClients, mockInvoices, mockTasks } from "@/lib/placeholder-data"; // For demo data

// SIMULATE LOGGED IN CLIENT
const LOGGED_IN_CLIENT_ID = mockClients[0].id; // Innovate LLC

export default function ClientDashboardPage() {
  const client = mockClients.find(c => c.id === LOGGED_IN_CLIENT_ID);
  const clientInvoices = mockInvoices.filter(inv => inv.clientId === LOGGED_IN_CLIENT_ID);
  const clientTasks = mockTasks.filter(t => t.clientId === LOGGED_IN_CLIENT_ID);

  const unpaidInvoicesCount = clientInvoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue').length;
  const openTasksCount = clientTasks.filter(t => !t.billed).length;


  if (!client) {
    return <p>Error: Client data not found. Please log in again.</p>;
  }

  return (
    <>
        <PageHeader 
            title={`Welcome, ${client.name}!`}
            description="Here's an overview of your account with TimeBill Pro."
        />
        <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-md">
            <CardHeader>
                <CardTitle>My Invoices ({clientInvoices.length})</CardTitle>
                <CardDescription>
                    You have {unpaidInvoicesCount} unpaid invoice(s).
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild className="mt-2">
                    <Link href="/portal/invoices">View All Invoices</Link>
                </Button>
            </CardContent>
            </Card>
            <Card className="shadow-md">
            <CardHeader>
                <CardTitle>My Tasks ({clientTasks.length})</CardTitle>
                <CardDescription>
                    You have {openTasksCount} open (unbilled) task(s).</CardDescription>
            </CardHeader>
            <CardContent>
                 <Button asChild className="mt-2">
                    <Link href="/portal/tasks">View All Tasks</Link>
                </Button>
            </CardContent>
            </Card>
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
            This is your client dashboard. For support, please contact your account manager.
        </p>
    </>
  );
}
