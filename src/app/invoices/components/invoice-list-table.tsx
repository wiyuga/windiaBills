"use client";
import type { Invoice, Client, Task } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, FilePenLine, Trash2, DollarSign } from "lucide-react";
import InvoiceFormDialog from "./invoice-form-dialog"; // For editing
import InvoiceDetailsDialog from "./invoice-details-dialog"; // For viewing
import { format } from 'date-fns';

interface InvoiceListTableProps {
  invoices: Invoice[];
  clients: Client[];
  tasks: Task[];
}

export default function InvoiceListTable({ invoices, clients, tasks }: InvoiceListTableProps) {
  const getStatusBadgeVariant = (status: Invoice['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'paid': return 'default'; // Using 'default' for a success-like state (often green or primary)
      case 'sent': return 'secondary';
      case 'draft': return 'outline';
      case 'overdue': return 'destructive';
      default: return 'outline';
    }
  };

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
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
              <TableCell>{invoice.clientName || clients.find(c => c.id === invoice.clientId)?.name || 'N/A'}</TableCell>
              <TableCell>{format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</TableCell>
              <TableCell>{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</TableCell>
              <TableCell className="text-right">${(invoice.finalAmount || invoice.totalAmount).toFixed(2)}</TableCell>
              <TableCell className="text-center">
                <Badge variant={getStatusBadgeVariant(invoice.status)} className="capitalize">
                  {invoice.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                 <InvoiceDetailsDialog 
                  invoice={invoice}
                  client={clients.find(c => c.id === invoice.clientId)}
                  trigger={
                    <Button variant="ghost" size="icon" className="mr-1">
                      <FileText className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Button>}
                />
                <InvoiceFormDialog
                  invoice={invoice}
                  clients={clients}
                  tasks={tasks}
                  trigger={
                    <Button variant="ghost" size="icon" className="mr-1">
                      <FilePenLine className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  }
                 />
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
