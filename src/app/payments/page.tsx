"use client"
import PageHeader from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mockInvoices, mockClients } from "@/lib/placeholder-data";
import type { Invoice } from "@/lib/types";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { format } from 'date-fns';

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export default function PaymentsPage() {
  const paidInvoices = mockInvoices.filter(inv => inv.status === 'paid');

  // Aggregate revenue by month for chart
  const monthlyRevenue: { month: string, revenue: number }[] = paidInvoices.reduce((acc, inv) => {
    const monthYear = format(new Date(inv.issueDate), 'MMM yyyy');
    const existingEntry = acc.find(e => e.month === monthYear);
    if (existingEntry) {
      existingEntry.revenue += inv.finalAmount || inv.totalAmount;
    } else {
      acc.push({ month: monthYear, revenue: inv.finalAmount || inv.totalAmount });
    }
    return acc;
  }, [] as { month: string, revenue: number }[]).sort((a,b) => new Date(a.month).getTime() - new Date(b.month).getTime());


  return (
    <>
      <PageHeader 
        title="Payment History" 
        description="Track received payments and revenue trends."
      />
      <div className="grid gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>Total revenue from paid invoices per month.</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyRevenue.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenue} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickFormatter={(value) => `$${value}`} tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip 
                        cursor={false}
                        content={<ChartTooltipContent 
                            formatter={(value) => `$${Number(value).toFixed(2)}`} 
                            indicator="dot"
                        />} 
                    />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No payment data available to display chart.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>List of recently paid invoices.</CardDescription>
          </CardHeader>
          <CardContent>
            {paidInvoices.length > 0 ? (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead className="text-right">Amount Paid</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paidInvoices.slice(0, 10).map((invoice: Invoice) => ( // Show last 10 paid
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.clientName || mockClients.find(c => c.id === invoice.clientId)?.name || 'N/A'}</TableCell>
                        <TableCell>{format(new Date(invoice.issueDate), 'MMM dd, yyyy')} (Assuming paid on issue for mock)</TableCell>
                        <TableCell className="text-right">${(invoice.finalAmount || invoice.totalAmount).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
               <p className="text-muted-foreground text-center py-8">No paid invoices found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

