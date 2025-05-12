import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/shared/page-header";
import { IndianRupee, Users, ListChecks, FileText } from "lucide-react"; // Changed DollarSign to IndianRupee
import { mockClients, mockTasks, mockInvoices } from "@/lib/placeholder-data";

export default function DashboardPage() {
  const totalClients = mockClients.length;
  const openTasks = mockTasks.filter(task => !task.billed).length;
  const unpaidInvoices = mockInvoices.filter(invoice => invoice.status === 'sent' || invoice.status === 'overdue').length;
  
  // Calculate total revenue based on currency, then convert to INR for display if necessary.
  // For simplicity, this example assumes all invoices are either USD or INR and converts USD to INR.
  // In a real app, you would have exchange rates and potentially store amounts in a base currency.
  const INR_USD_EXCHANGE_RATE = 83; // Example fixed rate

  const totalRevenueInINR = mockInvoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((sum, inv) => {
      const client = mockClients.find(c => c.id === inv.clientId);
      const amount = inv.finalAmount || inv.totalAmount;
      if (client?.currency === 'USD') {
        return sum + (amount * INR_USD_EXCHANGE_RATE);
      }
      return sum + amount;
    }, 0);

  return (
    <>
      <PageHeader title="Dashboard" description="Welcome back! Here's an overview of your TimeBill Pro." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (Paid)</CardTitle>
            <IndianRupee className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenueInINR.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From all paid invoices (in INR)</p>
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
