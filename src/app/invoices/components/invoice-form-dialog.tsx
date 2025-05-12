
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarIcon, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import type { Invoice, Client, Task, InvoiceTaskItem, Service } from '@/lib/types';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { mockServices, mockTasks as FallbackMockTasks } from '@/lib/placeholder-data'; // For service name lookup and fallback tasks
import { dataStore } from '@/lib/data-store'; // Import dataStore to get fresh task list

const invoiceTaskItemSchema = z.object({
  taskId: z.string(),
  description: z.string(),
  hours: z.number(),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required."),
  clientId: z.string().min(1, "Client is required."),
  issueDate: z.date({ required_error: "Issue date is required." }),
  dueDate: z.date({ required_error: "Due date is required." }),
  selectedTasks: z.array(invoiceTaskItemSchema).min(1, "At least one task must be selected for the invoice."),
  status: z.enum(['draft', 'sent', 'paid', 'overdue']).default('draft'),
  notes: z.string().optional(),
  razorpayLink: z.string().url().optional().or(z.literal('')),
  taxRate: z.preprocess(
    (val) => parseFloat(z.string().parse(String(val)) || "0"), // Ensure val is string for parse
    z.number().min(0).max(100).optional()
  ),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema> & {
    totalAmount: number;
    taxAmount: number;
    finalAmount: number;
    clientName?: string; // Added for consistency
};


interface InvoiceFormDialogProps {
  invoice?: Partial<Invoice>; // Can be partial for new, full for edit
  clients: Client[];
  allTasksForClient?: Task[]; // Tasks relevant to the selected/editing client
  trigger: React.ReactNode;
  onSave?: (data: InvoiceFormData, invoiceId?: string) => void;
  forceOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function InvoiceFormDialog({
    invoice,
    clients,
    allTasksForClient, // These are pre-filtered tasks for the client
    trigger,
    onSave,
    forceOpen,
    onOpenChange
}: InvoiceFormDialogProps) {
  const [open, setOpen] = useState(false);
  // unpaidTasksForSelectedClient will be derived from allTasksForClient or fetched if needed
  const [unpaidTasksForSelectedClient, setUnpaidTasksForSelectedClient] = useState<Task[]>([]);


  const { control, register, handleSubmit, reset, watch, setValue, getValues, formState: { errors } } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    // Default values are set in useEffect based on `invoice` prop
  });

  const watchedClientId = watch("clientId");
  const watchedSelectedTasks = watch("selectedTasks", []); // Default to empty array
  const watchedTaxRate = watch("taxRate");

  const dialogOpen = forceOpen !== undefined ? forceOpen : open;
  const setDialogOpen = forceOpen !== undefined && onOpenChange ? onOpenChange : setOpen;

  useEffect(() => {
    if (dialogOpen) {
      const defaultNewInvoiceValues = {
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000).padStart(4, '0')}`,
        clientId: '',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        selectedTasks: [] as InvoiceTaskItem[],
        status: 'draft' as 'draft',
        notes: '',
        razorpayLink: '',
        taxRate: 10, // Default tax rate
      };

      if (invoice && Object.keys(invoice).length > 0) { // Editing or pre-filled new invoice
        let taxRateInitial = 10; // Default
        // Calculate taxRate from amounts if available and amounts are valid
        if (invoice.taxAmount !== undefined && invoice.totalAmount !== undefined && invoice.totalAmount > 0) {
          const preTaxSubtotal = invoice.finalAmount !== undefined ? (invoice.finalAmount - invoice.taxAmount) : invoice.totalAmount;
           if (preTaxSubtotal > 0) {
              taxRateInitial = parseFloat(((invoice.taxAmount / preTaxSubtotal) * 100).toFixed(2));
           }
        }
        
        const formValues = {
          invoiceNumber: invoice.invoiceNumber || defaultNewInvoiceValues.invoiceNumber,
          clientId: invoice.clientId || defaultNewInvoiceValues.clientId,
          issueDate: invoice.issueDate ? (typeof invoice.issueDate === 'string' ? parseISO(invoice.issueDate) : invoice.issueDate) : defaultNewInvoiceValues.issueDate,
          dueDate: invoice.dueDate ? (typeof invoice.dueDate === 'string' ? parseISO(invoice.dueDate) : invoice.dueDate) : defaultNewInvoiceValues.dueDate,
          selectedTasks: invoice.tasks || defaultNewInvoiceValues.selectedTasks,
          status: invoice.status || defaultNewInvoiceValues.status,
          notes: invoice.notes || defaultNewInvoiceValues.notes,
          razorpayLink: invoice.razorpayLink || defaultNewInvoiceValues.razorpayLink,
          taxRate: taxRateInitial,
        };
        reset(formValues);

        // If allTasksForClient is provided (e.g., from TasksPage for new invoice based on selection, or InvoicesPage for edit)
        if (allTasksForClient) {
            setUnpaidTasksForSelectedClient(allTasksForClient);
        } else if (formValues.clientId) { // Fallback: if editing, and allTasksForClient not passed, fetch from store
            const clientTasks = dataStore.getTasks().filter(t => t.clientId === formValues.clientId && (!t.billed || (formValues.selectedTasks || []).some(it => it.taskId === t.id)));
            setUnpaidTasksForSelectedClient(clientTasks);
        } else {
            setUnpaidTasksForSelectedClient([]);
        }

      } else { // New invoice, not pre-filled
        reset(defaultNewInvoiceValues);
        setUnpaidTasksForSelectedClient([]); // No client selected yet
      }
    }
  }, [invoice, dialogOpen, reset, allTasksForClient, clients]);


  useEffect(() => {
    // This effect updates the available tasks when the client ID changes,
    // unless allTasksForClient is already provided (implying a specific set of tasks is intended).
    if (watchedClientId && !allTasksForClient) {
      const tasksFromStore = dataStore.getTasks();
      const clientTasks = tasksFromStore.filter(t => 
          t.clientId === watchedClientId && 
          (!t.billed || (watchedSelectedTasks || []).some(it => it.taskId === t.id))
      );
      setUnpaidTasksForSelectedClient(clientTasks);
      // If client changes, and it's not part of an initial load with pre-selected tasks, clear selected tasks.
      if (!invoice || invoice.clientId !== watchedClientId) {
         setValue("selectedTasks", []);
       }
    } else if (!watchedClientId) {
      setUnpaidTasksForSelectedClient([]);
      setValue("selectedTasks", []);
    }
  }, [watchedClientId, setValue, allTasksForClient, invoice, watchedSelectedTasks]);


  const selectedClientFull = clients.find(c => c.id === watchedClientId);

  const subTotal = useMemo(() => {
    if (!selectedClientFull || !watchedSelectedTasks) return 0;
    return watchedSelectedTasks.reduce((sum, taskItem) => {
      return sum + (taskItem.hours * (selectedClientFull.hourlyRate || 0));
    }, 0);
  }, [watchedSelectedTasks, selectedClientFull]);

  const taxAmount = useMemo(() => {
    return subTotal * ((watchedTaxRate || 0) / 100);
  }, [subTotal, watchedTaxRate]);

  const finalAmount = useMemo(() => {
    return subTotal + taxAmount;
  }, [subTotal, taxAmount]);

  const handleTaskSelection = (taskId: string, checked: boolean) => {
    const task = unpaidTasksForSelectedClient.find(t => t.id === taskId);
    if (!task) return;

    const currentSelectedTasks = getValues("selectedTasks") || [];
    if (checked) {
      setValue("selectedTasks", [...currentSelectedTasks, { taskId: task.id, description: task.description, hours: task.hours }]);
    } else {
      setValue("selectedTasks", currentSelectedTasks.filter(t => t.taskId !== taskId));
    }
  };

  const onSubmit: SubmitHandler<InvoiceFormData> = (data) => {
    const finalData: InvoiceFormData = {
        ...data,
        clientName: selectedClientFull?.name || '',
        totalAmount: parseFloat(subTotal.toFixed(2)),
        taxAmount: parseFloat(taxAmount.toFixed(2)),
        finalAmount: parseFloat(finalAmount.toFixed(2)),
    };
    if (onSave) {
      onSave(finalData, invoice?.id); // invoice.id will be undefined for new invoices
    }
    setDialogOpen(false);
  };

  const getServiceName = (serviceId: string) => mockServices.find(s => s.id === serviceId)?.name || 'N/A';
  
  return (
    <Dialog open={dialogOpen} onOpenChange={(isOpen) => {
        setDialogOpen(isOpen);
        if (!isOpen && onOpenChange) { // Also call external onOpenChange if dialog is closed
            onOpenChange(false);
        }
    }}>
      {(forceOpen === undefined || trigger !== null) && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{invoice?.id ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
          <DialogDescription>
            {invoice?.id ? "Update the invoice details below." : "Fill in the details for the new invoice."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
        <ScrollArea className="max-h-[calc(80vh-220px)] p-1 pr-3"> {/* Adjusted height */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                  <Select
                    onValueChange={(value) => {
                        field.onChange(value);
                        // If allTasksForClient is not set (meaning we are not in a flow where tasks are pre-determined)
                        // then update unpaidTasksForSelectedClient based on the new client.
                        if (!allTasksForClient) {
                            const tasksFromStore = dataStore.getTasks();
                            const clientTasks = tasksFromStore.filter(t => t.clientId === value && (!t.billed || (invoice?.tasks || []).some(it => it.taskId === t.id) ) );
                            setUnpaidTasksForSelectedClient(clientTasks);
                            if (!invoice?.id || invoice.clientId !== value) { // If new invoice or client changed
                                setValue("selectedTasks", []);
                            }
                        }
                    }}
                    defaultValue={field.value}
                    value={field.value}
                    disabled={!!allTasksForClient && !!invoice?.clientId} // Disable if tasks are pre-filled for a specific client (e.g. from TasksPage flow) or editing existing invoice
                    >
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

          {watchedClientId && (
            <div className="my-4">
              <h3 className="text-lg font-medium mb-2">Select Tasks to Invoice</h3>
              {unpaidTasksForSelectedClient.length > 0 ? (
                <ScrollArea className="h-64 rounded-md border p-2">
                  {unpaidTasksForSelectedClient.map((task) => (
                    <div key={task.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md">
                      <Checkbox
                        id={`task-${task.id}`}
                        checked={watchedSelectedTasks?.some(t => t.taskId === task.id)}
                        onCheckedChange={(checked) => handleTaskSelection(task.id, !!checked)}
                        // Disable checkbox if task is already billed AND not part of the currently selected tasks (for editing scenario)
                        disabled={task.billed && !watchedSelectedTasks?.some(t => t.taskId === task.id)}
                      />
                      <Label htmlFor={`task-${task.id}`} className="flex-1 cursor-pointer">
                        <div className="flex justify-between items-center">
                            <span className="font-normal">{task.description}</span>
                            <span className="text-xs text-muted-foreground">({getServiceName(task.serviceId)})</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {task.hours} hrs on {format(parseISO(task.date), "MMM dd, yyyy")} - Platform: {task.platform}
                          {task.billed && !watchedSelectedTasks?.some(t => t.taskId === task.id) && <span className="ml-2 text-destructive">(Already Billed)</span>}
                        </div>
                      </Label>
                    </div>
                  ))}
                </ScrollArea>
              ) : (
                <div className="text-sm text-muted-foreground p-4 border rounded-md flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                     No unbilled tasks found for this client, or all available tasks are already selected.
                </div>
              )}
              {errors.selectedTasks && <p className="text-xs text-destructive mt-1">{errors.selectedTasks.message}</p>}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input id="taxRate" type="number" step="0.01" {...register("taxRate")} className={errors.taxRate ? 'border-destructive' : ''} />
                 {errors.taxRate && <p className="text-xs text-destructive mt-1">{errors.taxRate.message}</p>}
            </div>
            <div>
                <Label htmlFor="status">Status</Label>
                 <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <SelectTrigger id="status" className={errors.status ? 'border-destructive' : ''}><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                        </Select>
                    )}
                    />
                {errors.status && <p className="text-xs text-destructive mt-1">{errors.status.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} placeholder="Any additional notes for the client" />
            {errors.notes && <p className="text-xs text-destructive mt-1">{errors.notes.message}</p>}
          </div>
          <div>
            <Label htmlFor="razorpayLink">Razorpay Link (Optional)</Label>
            <Input id="razorpayLink" {...register("razorpayLink")} placeholder="https://rzp.io/..." className={errors.razorpayLink ? 'border-destructive' : ''}/>
            {errors.razorpayLink && <p className="text-xs text-destructive mt-1">{errors.razorpayLink.message}</p>}
          </div>

          <div className="mt-4 p-4 bg-muted/50 rounded-md">
            <div className="flex justify-between text-sm"><span>Subtotal:</span> <span>{selectedClientFull?.currency === 'INR' ? '₹' : '$'}{subTotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span>Tax ({watchedTaxRate || 0}%):</span> <span>{selectedClientFull?.currency === 'INR' ? '₹' : '$'}{taxAmount.toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold text-lg mt-1"><span>Total:</span> <span>{selectedClientFull?.currency === 'INR' ? '₹' : '$'}{finalAmount.toFixed(2)}</span></div>
          </div>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => {
                setDialogOpen(false);
                if (onOpenChange) onOpenChange(false); // Ensure external handler is called
            }}>Cancel</Button>
            <Button type="submit" disabled={!watchedClientId || (watchedSelectedTasks || []).length === 0 || Object.keys(errors).length > 0}>
                {invoice?.id ? "Save Changes" : "Create Invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
