"use client";
import PageHeader from "@/components/shared/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { mockInvoices, mockClients } from "@/lib/placeholder-data";
import type { Invoice } from "@/lib/types";
import InvoiceDetailsDialog from "@/app/invoices/components/invoice-details-dialog"; // Re-use admin dialog
import { format } from 'date-fns';

// SIMULATE LOGGED IN CLIENT
const LOGGED_IN_CLIENT_ID = mockClients[0].id; // Innovate LLC

export default function ClientInvoicesPage() {
  const clientInvoices = mockInvoices.filter(invoice => invoice.clientId === LOGGED_IN_CLIENT_ID);
  const client = mockClients.find(c => c.id === LOGGED_IN_CLIENT_ID);

  const getStatusBadgeVariant = (status: Invoice['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'paid': return 'default';
      case 'sent': return 'secondary';
      case 'draft': return 'outline'; // Should not be visible to client ideally
      case 'overdue': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <>
      <PageHeader 
        title="My Invoices" 
        description={`Invoices for ${client?.name || 'your account'}.`}
      />
      <div className="rounded-lg border shadow-sm bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientInvoices.filter(inv => inv.status !== 'draft').map((invoice: Invoice) => { // Filter out drafts
              const currencySymbol = client?.currency === 'INR' ? '₹' : '$';
              return (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                <TableCell>{format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</TableCell>
                <TableCell>{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</TableCell>
                <TableCell className="text-right">{currencySymbol}{(invoice.finalAmount || invoice.totalAmount).toFixed(2)}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={getStatusBadgeVariant(invoice.status)} className="capitalize">
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <InvoiceDetailsDialog 
                    invoice={invoice}
                    client={client} // Pass the logged-in client's details
                    trigger={
                      <Button variant="ghost" size="icon">
                        <FileText className="h-4 w-4" />
                        <span className="sr-only">View Details & Pay</span>
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            )})}
             {clientInvoices.filter(inv => inv.status !== 'draft').length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">No invoices found.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
