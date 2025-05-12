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
import { format } from "date-fns";
import type { Invoice, Client, Task, InvoiceTaskItem, Service } from '@/lib/types';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { mockServices, mockTasks as FallbackMockTasks } from '@/lib/placeholder-data'; // For service name lookup and fallback tasks

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
    (val) => parseFloat(z.string().parse(val) || "0"),
    z.number().min(0).max(100).optional()
  ),
});

// Use Zod schema type directly for form data
export type InvoiceFormData = z.infer<typeof invoiceSchema> & {
    // Add calculated fields that are not part of the schema but needed for submission
    totalAmount: number;
    taxAmount: number;
    finalAmount: number;
};


interface InvoiceFormDialogProps {
  invoice?: Partial<Invoice>;
  clients: Client[];
  allTasksForClient?: Task[];
  trigger: React.ReactNode;
  onSave?: (data: InvoiceFormData, invoiceId?: string) => void;
  forceOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function InvoiceFormDialog({
    invoice,
    clients,
    allTasksForClient,
    trigger,
    onSave,
    forceOpen,
    onOpenChange
}: InvoiceFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [unpaidTasksForSelectedClient, setUnpaidTasksForSelectedClient] = useState<Task[]>([]);

  const { control, register, handleSubmit, reset, watch, setValue, getValues, formState: { errors } } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000).padStart(4, '0')}`,
      clientId: invoice?.clientId || '',
      issueDate: invoice?.issueDate ? new Date(invoice.issueDate) : new Date(),
      dueDate: invoice?.dueDate ? new Date(invoice.dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      selectedTasks: invoice?.tasks || [], // Use selectedTasks to match schema, maps from invoice.tasks
      status: invoice?.status || 'draft',
      notes: invoice?.notes || '',
      razorpayLink: invoice?.razorpayLink || '',
      taxRate: invoice?.taxAmount && invoice?.totalAmount && invoice.totalAmount > 0
                 ? parseFloat(((invoice.taxAmount / (invoice.totalAmount - invoice.taxAmount)) * 100).toFixed(2)) // tax based on pre-tax total
                 : 10,
      // Calculated fields will be added on submit, not part of form state initially
      totalAmount: 0,
      taxAmount: 0,
      finalAmount: 0,
    },
  });

  const watchedClientId = watch("clientId");
  const watchedSelectedTasks = watch("selectedTasks");
  const watchedTaxRate = watch("taxRate");

  const dialogOpen = forceOpen !== undefined ? forceOpen : open;
  const setDialogOpen = forceOpen !== undefined && onOpenChange ? onOpenChange : setOpen;

  useEffect(() => {
    if (dialogOpen) {
      const defaultValues = {
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000).padStart(4, '0')}`,
        clientId: '',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        selectedTasks: [] as InvoiceTaskItem[],
        status: 'draft' as 'draft',
        notes: '',
        razorpayLink: '',
        taxRate: 10,
        totalAmount:0, taxAmount:0, finalAmount:0, // Initialize calculated fields
      };

      if (invoice) {
        // const subTotalInitial = (invoice.tasks || []).reduce((sum, taskItem) => {
        //     const clientRate = clients.find(c => c.id === invoice.clientId)?.hourlyRate || 0;
        //     return sum + (taskItem.hours * clientRate);
        // }, 0);

        let taxRateInitial = 10;
        if (invoice.taxAmount !== undefined && invoice.totalAmount !== undefined && invoice.totalAmount !== 0 && invoice.taxAmount !==0) {
             // Calculate tax rate based on (totalAmount - taxAmount) which is pre-tax subtotal
             const preTaxSubtotal = invoice.totalAmount - invoice.taxAmount;
             if (preTaxSubtotal > 0) {
                taxRateInitial = parseFloat(((invoice.taxAmount / preTaxSubtotal) * 100).toFixed(2));
             } else if (invoice.totalAmount > 0) { // If preTaxSubtotal is 0 but total is not, it implies tax might be based on total itself (e.g. flat tax) or an error in data
                taxRateInitial = parseFloat(((invoice.taxAmount / invoice.totalAmount) * 100).toFixed(2));
             }
        }


        reset({
          ...defaultValues,
          invoiceNumber: invoice.invoiceNumber || defaultValues.invoiceNumber,
          clientId: invoice.clientId || defaultValues.clientId,
          issueDate: invoice.issueDate ? new Date(invoice.issueDate) : defaultValues.issueDate,
          dueDate: invoice.dueDate ? new Date(invoice.dueDate) : defaultValues.dueDate,
          selectedTasks: invoice.tasks || [],
          status: invoice.status || defaultValues.status,
          notes: invoice.notes || defaultValues.notes,
          razorpayLink: invoice.razorpayLink || defaultValues.razorpayLink,
          taxRate: taxRateInitial,
        });

        if (invoice.clientId) {
            const tasksForClient = allTasksForClient || FallbackMockTasks.filter(t => t.clientId === invoice.clientId && (!t.billed || (invoice.tasks || []).some(it => it.taskId === t.id)));
            setUnpaidTasksForSelectedClient(tasksForClient);
        } else {
            setUnpaidTasksForSelectedClient([]);
        }
      } else {
        reset(defaultValues);
        setUnpaidTasksForSelectedClient([]);
      }
    }
  }, [invoice, dialogOpen, reset, allTasksForClient, clients]);


  useEffect(() => {
    if (watchedClientId) {
      const tasks = allTasksForClient || FallbackMockTasks.filter(t => t.clientId === watchedClientId && (!t.billed || (watchedSelectedTasks || []).some(it => it.taskId === t.id)));
      setUnpaidTasksForSelectedClient(tasks);
       if (!invoice || invoice.clientId !== watchedClientId) { // Only reset tasks if client changed or new invoice
         setValue("selectedTasks", []);
       }
    } else {
      setUnpaidTasksForSelectedClient([]);
      setValue("selectedTasks", []);
    }
  }, [watchedClientId, setValue, allTasksForClient, invoice, watchedSelectedTasks]);

  const selectedClientFull = clients.find(c => c.id === watchedClientId);

  const subTotal = useMemo(() => {
    if (!selectedClientFull || !watchedSelectedTasks) return 0;
    return watchedSelectedTasks.reduce((sum, taskItem) => {
      return sum + (taskItem.hours * selectedClientFull.hourlyRate);
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
        ...data, // data already matches InvoiceFormData structure (selectedTasks, etc.)
        totalAmount: parseFloat(subTotal.toFixed(2)),
        taxAmount: parseFloat(taxAmount.toFixed(2)),
        finalAmount: parseFloat(finalAmount.toFixed(2)),
    };
    console.log("Invoice data for submission:", finalData);
    if (onSave) {
      onSave(finalData, invoice?.id);
    }
    setDialogOpen(false);
  };

  const getServiceName = (serviceId: string) => mockServices.find(s => s.id === serviceId)?.name || 'N/A';


  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {forceOpen === undefined && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{invoice?.id ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
          <DialogDescription>
            {invoice?.id ? "Update the invoice details below." : "Fill in the details for the new invoice."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
        <ScrollArea className="max-h-[calc(80vh-200px)] p-1 pr-3">
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
                        if (!allTasksForClient) { // If allTasksForClient is not provided (e.g. creating from Tasks page), fetch tasks dynamically
                            const tasks = FallbackMockTasks.filter(t => t.clientId === value && (!t.billed || (invoice?.tasks || []).some(it => it.taskId === t.id) ) );
                            setUnpaidTasksForSelectedClient(tasks);
                            // If it's a new invoice or client changed, reset selected tasks
                            if (!invoice?.id || invoice.clientId !== value) {
                                setValue("selectedTasks", []);
                            }
                        }
                    }}
                    defaultValue={field.value}
                    value={field.value}
                    disabled={!!allTasksForClient || !!invoice?.clientId } // Disable if tasks are pre-loaded or editing existing invoice client
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
                        // Disable checkbox if task is already billed AND not part of the currently selected tasks for this invoice (allows editing existing invoice with billed tasks)
                        disabled={task.billed && !watchedSelectedTasks?.some(t => t.taskId === task.id)}
                      />
                      <Label htmlFor={`task-${task.id}`} className="flex-1 cursor-pointer">
                        <div className="flex justify-between items-center">
                            <span className="font-normal">{task.description}</span>
                            <span className="text-xs text-muted-foreground">({getServiceName(task.serviceId)})</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {task.hours} hrs on {format(new Date(task.date), "MMM dd, yyyy")} - Platform: {task.platform}
                          {task.billed && !watchedSelectedTasks?.some(t => t.taskId === task.id) && <span className="ml-2 text-destructive">(Billed)</span>}
                        </div>
                      </Label>
                    </div>
                  ))}
                </ScrollArea>
              ) : (
                <div className="text-sm text-muted-foreground p-4 border rounded-md flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    No unbilled tasks found for this client, or all tasks are already selected.
                </div>
              )}
              {/* Display error for 'selectedTasks' field from Zod schema */}
              {errors.selectedTasks && <p className="text-xs text-destructive mt-1">{errors.selectedTasks.message}</p>}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input id="taxRate" type="number" step="0.01" {...register("taxRate")} />
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
            <Input id="razorpayLink" {...register("razorpayLink")} placeholder="https://rzp.io/..." />
            {errors.razorpayLink && <p className="text-xs text-destructive mt-1">{errors.razorpayLink.message}</p>}
          </div>

          <div className="mt-4 p-4 bg-muted/50 rounded-md">
            <div className="flex justify-between text-sm"><span>Subtotal:</span> <span>{selectedClientFull?.currency === 'INR' ? '₹' : '$'}{subTotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span>Tax ({watchedTaxRate || 0}%):</span> <span>{selectedClientFull?.currency === 'INR' ? '₹' : '$'}{taxAmount.toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold text-lg mt-1"><span>Total:</span> <span>{selectedClientFull?.currency === 'INR' ? '₹' : '$'}{finalAmount.toFixed(2)}</span></div>
          </div>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!watchedClientId || (watchedSelectedTasks || []).length === 0}>
                {invoice?.id ? "Save Changes" : "Create Invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
