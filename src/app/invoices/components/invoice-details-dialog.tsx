"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { Invoice, Client } from '@/lib/types';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

interface InvoiceDetailsDialogProps {
  invoice: Invoice;
  client?: Client; // Optional client details
  trigger: React.ReactNode;
}

export default function InvoiceDetailsDialog({ invoice, client, trigger }: InvoiceDetailsDialogProps) {
  const [open, setOpen] = React.useState(false);

  const subTotal = invoice.totalAmount; // Assuming totalAmount is pre-tax
  const taxAmount = invoice.taxAmount || 0;
  const finalAmount = invoice.finalAmount || (subTotal + taxAmount);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Invoice #{invoice.invoiceNumber}</DialogTitle>
          <DialogDescription>
            Details for invoice issued to {invoice.clientName || client?.name || 'N/A'}.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(80vh-150px)] p-1 pr-3">
        <div className="py-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-1 text-foreground">Billed To:</h3>
              <p className="text-sm text-muted-foreground">{invoice.clientName || client?.name}</p>
              {client?.email && <p className="text-sm text-muted-foreground">{client.email}</p>}
              {client?.address && <p className="text-sm text-muted-foreground whitespace-pre-line">{client.address}</p>}
            </div>
            <div className="text-left md:text-right">
              <h3 className="font-semibold mb-1 text-foreground">Invoice Details:</h3>
              <p className="text-sm text-muted-foreground">Status: <span className="font-medium capitalize text-primary">{invoice.status}</span></p>
              <p className="text-sm text-muted-foreground">Issue Date: {format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</p>
              <p className="text-sm text-muted-foreground">Due Date: {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2 text-foreground">Line Items:</h3>
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-2 text-left font-medium">Description</th>
                    <th className="p-2 text-right font-medium">Hours</th>
                    <th className="p-2 text-right font-medium">Rate</th>
                    <th className="p-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.tasks.map((taskItem, index) => {
                    const rate = client?.hourlyRate || 0; // Fallback rate
                    const amount = taskItem.hours * rate;
                    return (
                    <tr key={taskItem.id || index} className="border-b last:border-b-0">
                      <td className="p-2">{taskItem.description}</td>
                      <td className="p-2 text-right">{taskItem.hours.toFixed(1)}</td>
                      <td className="p-2 text-right">${rate.toFixed(2)}</td>
                      <td className="p-2 text-right">${amount.toFixed(2)}</td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>

          <Separator />
          
          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="space-y-1">
                {invoice.notes && (
                    <>
                        <h3 className="font-semibold text-foreground">Notes:</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{invoice.notes}</p>
                    </>
                )}
            </div>
            <div className="space-y-1 text-right">
                <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Subtotal:</span>
                <span className="text-sm text-foreground">${subTotal.toFixed(2)}</span>
                </div>
                {invoice.taxAmount !== undefined && (
                <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tax:</span>
                    <span className="text-sm text-foreground">${taxAmount.toFixed(2)}</span>
                </div>
                )}
                <div className="flex justify-between font-semibold text-lg">
                <span className="text-foreground">Total:</span>
                <span className="text-primary">${finalAmount.toFixed(2)}</span>
                </div>
            </div>
          </div>

          {invoice.razorpayLink && invoice.status !== 'paid' && (
            <>
              <Separator />
              <div className="text-center mt-4">
                <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <a href={invoice.razorpayLink} target="_blank" rel="noopener noreferrer">
                    Pay with Razorpay
                  </a>
                </Button>
                <p className="text-xs text-muted-foreground mt-2">You will be redirected to Razorpay's secure payment gateway.</p>
              </div>
            </>
          )}
        </div>
        </ScrollArea>
        <DialogFooter className="mt-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
