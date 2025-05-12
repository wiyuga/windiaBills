"use client";
import type { Invoice, Client, Task, Service } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, FilePenLine, Trash2 } from "lucide-react";
// InvoiceFormDialog is now opened from the page level to manage its state
import InvoiceDetailsDialog from "./invoice-details-dialog"; 
import { format } from 'date-fns';

interface InvoiceListTableProps {
  invoices: Invoice[];
  clients: Client[];
  tasks: Task[]; // For context in details dialog and possibly other actions
  services: Service[]; // For context if needed
  onEditInvoice: (invoice: Invoice) => void; // Callback to open edit dialog on page
  onSaveInvoice: (data: any, invoiceId?: string) => void; // Placeholder for direct save if needed
}

export default function InvoiceListTable({ invoices, clients, tasks, services, onEditInvoice, onSaveInvoice }: InvoiceListTableProps) {
  const getStatusBadgeVariant = (status: Invoice['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'paid': return 'default'; 
      case 'sent': return 'secondary';
      case 'draft': return 'outline';
      case 'overdue': return 'destructive';
      default: return 'outline';
    }
  };

  const getClientForInvoice = (invoice: Invoice) => clients.find(c => c.id === invoice.clientId);

  return (
    <div className="rounded-lg border shadow-sm bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Issue Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => {
            const client = getClientForInvoice(invoice);
            const currencySymbol = client?.currency === 'INR' ? '₹' : '$';
            return (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
              <TableCell>{invoice.clientName || client?.name || 'N/A'}</TableCell>
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
                  client={client}
                  trigger={
                    <Button variant="ghost" size="icon" className="mr-1">
                      <FileText className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Button>}
                />
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="mr-1"
                    onClick={() => onEditInvoice(invoice)}
                >
                    <FilePenLine className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </TableCell>
            </TableRow>
          )}
          )}
          {invoices.length === 0 && (
            <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">No invoices found.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
