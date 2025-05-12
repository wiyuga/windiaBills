"use client";
import PageHeader from "@/components/shared/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockInvoices, mockClients, mockServices, mockTasks } from "@/lib/placeholder-data";
import type { Invoice } from "@/lib/types";
import { format } from 'date-fns';

// SIMULATE LOGGED IN CLIENT
const LOGGED_IN_CLIENT_ID = mockClients[0].id; // Innovate LLC

export default function ClientPaymentsPage() {
  const clientPaidInvoices = mockInvoices.filter(invoice => invoice.clientId === LOGGED_IN_CLIENT_ID && invoice.status === 'paid');
  const client = mockClients.find(c => c.id === LOGGED_IN_CLIENT_ID);
  
  const getTaskDetails = (taskId: string) => mockTasks.find(t => t.id === taskId);
  const getServiceDetails = (serviceId: string) => mockServices.find(s => s.id === serviceId);


  return (
    <>
      <PageHeader 
        title="My Payment History" 
        description={`Record of payments made by ${client?.name || 'you'}.`}
      />
      <div className="rounded-lg border shadow-sm bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Service(s)</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead className="text-right">Amount Paid</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientPaidInvoices.map((invoice: Invoice) => {
                const currencySymbol = client?.currency === 'INR' ? '₹' : '$';
                 // For simplicity, taking first task's service.
                const firstTaskDetails = invoice.tasks[0] ? getTaskDetails(invoice.tasks[0].taskId) : undefined;
                const serviceName = firstTaskDetails ? getServiceDetails(firstTaskDetails.serviceId)?.name : 'N/A';
              return (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                <TableCell>{client?.projectName || 'N/A'}</TableCell>
                <TableCell>{serviceName}</TableCell>
                <TableCell>{format(new Date(invoice.issueDate), 'MMM dd, yyyy')} (Assumed paid on issue for mock)</TableCell>
                <TableCell className="text-right">{currencySymbol}{(invoice.finalAmount || invoice.totalAmount).toFixed(2)}</TableCell>
              </TableRow>
            )})}
            {clientPaidInvoices.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No payment history found.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
