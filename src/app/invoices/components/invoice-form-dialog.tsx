"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Invoice, Client, Task } from '@/lib/types';
import { useForm, Controller, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  hours: z.preprocess(
    (val) => parseFloat(z.string().parse(val) || "0"),
    z.number().min(0.1, "Hours must be positive")
  ),
  // In a real app, you might link to task ID. Here, it's manual.
});

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required."),
  clientId: z.string().min(1, "Client is required."),
  issueDate: z.date({ required_error: "Issue date is required." }),
  dueDate: z.date({ required_error: "Due date is required." }),
  tasks: z.array(lineItemSchema).min(1, "At least one line item is required."),
  status: z.enum(['draft', 'sent', 'paid', 'overdue']).default('draft'),
  notes: z.string().optional(),
  razorpayLink: z.string().url().optional().or(z.literal('')),
  taxRate: z.preprocess( // Optional tax rate as percentage
    (val) => parseFloat(z.string().parse(val) || "0"),
    z.number().min(0).max(100).optional()
  ),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormDialogProps {
  invoice?: Invoice;
  clients: Client[];
  tasks: Task[]; // All tasks, for potential selection (not fully implemented for auto-add)
  trigger: React.ReactNode;
  onSave?: (data: InvoiceFormData) => void;
}

export default function InvoiceFormDialog({ invoice, clients, tasks, trigger, onSave }: InvoiceFormDialogProps) {
  const [open, setOpen] = useState(false);
  const { control, register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: invoice ? {
      ...invoice,
      issueDate: new Date(invoice.issueDate),
      dueDate: new Date(invoice.dueDate),
      tasks: invoice.tasks.map(t => ({ description: t.description, hours: t.hours })), // Simplified
      taxRate: invoice.taxAmount && invoice.totalAmount ? (invoice.taxAmount / invoice.totalAmount) * 100 : 0,
    } : {
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000).padStart(4, '0')}`,
      clientId: '',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Due in 14 days
      tasks: [{ description: '', hours: 1 }],
      status: 'draft',
      notes: '',
      razorpayLink: '',
      taxRate: 10, // Default 10% tax
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "tasks"
  });

  useEffect(() => {
    if (invoice && open) {
      reset({
        ...invoice,
        issueDate: new Date(invoice.issueDate),
        dueDate: new Date(invoice.dueDate),
        tasks: invoice.tasks.map(t => ({ description: t.description, hours: t.hours })),
        taxRate: invoice.taxAmount && invoice.totalAmount ? (invoice.taxAmount / invoice.totalAmount) * 100 : 0,
      });
    } else if (!invoice && open) {
      reset({
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000).padStart(4, '0')}`,
        clientId: '',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        tasks: [{ description: '', hours: 1 }],
        status: 'draft',
        notes: '',
        razorpayLink: '',
        taxRate: 10,
      });
    }
  }, [invoice, open, reset]);
  
  const watchedClientId = watch("clientId");
  const watchedTasks = watch("tasks");
  const watchedTaxRate = watch("taxRate");

  const selectedClient = clients.find(c => c.id === watchedClientId);
  const subTotal = watchedTasks.reduce((sum, task) => {
    const rate = selectedClient?.hourlyRate || 0;
    return sum + (task.hours * rate);
  }, 0);
  const taxAmount = subTotal * ((watchedTaxRate || 0) / 100);
  const totalAmount = subTotal + taxAmount;


  const onSubmit: SubmitHandler<InvoiceFormData> = (data) => {
    console.log("Invoice data:", data, { subTotal, taxAmount, totalAmount });
    // Add subTotal, taxAmount, totalAmount to the data before saving if needed by backend
    if (onSave) {
      onSave(data);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoice ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
          <DialogDescription>
            {invoice ? "Update the invoice details below." : "Fill in the details for the new invoice."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">Invoice #</Label>
              <Input id="invoiceNumber" {...register("invoiceNumber")} className={errors.invoiceNumber ? 'border-destructive' : ''}/>
              {errors.invoiceNumber && <p className="text-xs text-destructive mt-1">{errors.invoiceNumber.message}</p>}
            </div>
            <div>
              <Label htmlFor="clientId">Client</Label>
              <Controller
                name="clientId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <SelectTrigger id="clientId" className={errors.clientId ? 'border-destructive' : ''}><SelectValue placeholder="Select a client" /></SelectTrigger>
                    <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              />
              {errors.clientId && <p className="text-xs text-destructive mt-1">{errors.clientId.message}</p>}
            </div>
            <div>
              <Label htmlFor="issueDate">Issue Date</Label>
              <Controller name="issueDate" control={control} render={({ field }) => (
                <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground", errors.issueDate && "border-destructive")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick issue date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>
              )}/>
              {errors.issueDate && <p className="text-xs text-destructive mt-1">{errors.issueDate.message}</p>}
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Controller name="dueDate" control={control} render={({ field }) => (
                <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground", errors.dueDate && "border-destructive")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick due date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>
              )}/>
              {errors.dueDate && <p className="text-xs text-destructive mt-1">{errors.dueDate.message}</p>}
            </div>
          </div>

          <div className="my-4">
            <h3 className="text-lg font-medium mb-2">Line Items</h3>
            {fields.map((item, index) => (
              <div key={item.id} className="grid grid-cols-[1fr_100px_auto] gap-2 mb-2 items-start">
                <div>
                  <Label htmlFor={`tasks.${index}.description`} className="sr-only">Description</Label>
                  <Input {...register(`tasks.${index}.description`)} placeholder="Task description" className={errors.tasks?.[index]?.description ? 'border-destructive' : ''} />
                  {errors.tasks?.[index]?.description && <p className="text-xs text-destructive mt-1">{errors.tasks?.[index]?.description?.message}</p>}
                </div>
                <div>
                  <Label htmlFor={`tasks.${index}.hours`} className="sr-only">Hours</Label>
                  <Input type="number" step="0.1" {...register(`tasks.${index}.hours`)} placeholder="Hours" className={errors.tasks?.[index]?.hours ? 'border-destructive' : ''} />
                   {errors.tasks?.[index]?.hours && <p className="text-xs text-destructive mt-1">{errors.tasks?.[index]?.hours?.message}</p>}
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:text-destructive-foreground hover:bg-destructive mt-1">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {errors.tasks && typeof errors.tasks.message === 'string' && <p className="text-xs text-destructive mt-1">{errors.tasks.message}</p>}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', hours: 1 })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Line Item
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input id="taxRate" type="number" step="0.01" {...register("taxRate")} />
            </div>
            <div>
                <Label htmlFor="status">Status</Label>
                 <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                        </Select>
                    )}
                    />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} placeholder="Any additional notes for the client" />
          </div>
          <div>
            <Label htmlFor="razorpayLink">Razorpay Link (Optional)</Label>
            <Input id="razorpayLink" {...register("razorpayLink")} placeholder="https://rzp.io/..." />
            {errors.razorpayLink && <p className="text-xs text-destructive mt-1">{errors.razorpayLink.message}</p>}
          </div>

          <div className="mt-4 p-4 bg-muted/50 rounded-md">
            <div className="flex justify-between text-sm"><span>Subtotal:</span> <span>${subTotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span>Tax ({watchedTaxRate || 0}%):</span> <span>${taxAmount.toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold text-lg mt-1"><span>Total:</span> <span>${totalAmount.toFixed(2)}</span></div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">{invoice ? "Save Changes" : "Create Invoice"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
