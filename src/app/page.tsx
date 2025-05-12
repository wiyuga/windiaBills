import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/shared/page-header";
import { DollarSign, Users, ListChecks, FileText } from "lucide-react";
import { mockClients, mockTasks, mockInvoices } from "@/lib/placeholder-data";

export default function DashboardPage() {
  const totalClients = mockClients.length;
  const openTasks = mockTasks.filter(task => !task.billed).length;
  const unpaidInvoices = mockInvoices.filter(invoice => invoice.status === 'sent' || invoice.status === 'overdue').length;
  const totalRevenue = mockInvoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((sum, inv) => sum + (inv.finalAmount || inv.totalAmount), 0);

  return (
    <>
      <PageHeader title="Dashboard" description="Welcome back! Here's an overview of your TimeBill Pro." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (Paid)</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From all paid invoices</p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">Total clients managed</p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tasks</CardTitle>
            <ListChecks className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTasks}</div>
            <p className="text-xs text-muted-foreground">Tasks yet to be billed</p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Invoices</CardTitle>
            <FileText className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unpaidInvoices}</div>
            <p className="text-xs text-muted-foreground">Invoices awaiting payment</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Placeholder for recent activity or quick actions */}
      <div className="mt-8">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>A quick look at recent tasks and invoices.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Recent activity feed coming soon...</p>
            {/* Example: List recent tasks or invoices */}
            {/* <ul>
              {mockTasks.slice(0,3).map(task => <li key={task.id}>{task.description} for {task.clientName}</li>)}
            </ul> */}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
