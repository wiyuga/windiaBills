
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, isValid } from "date-fns";
import type { Invoice, Client, Task, Service, InvoiceTaskItem } from '@/lib/types';
import { useForm, Controller, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebaseConfig'; 
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';


const invoiceTaskItemSchema = z.object({
  taskId: z.string(),
  description: z.string(),
  hours: z.number(),
  selected: z.boolean().default(true), 
});

export const invoiceFormSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required."),
  clientId: z.string().min(1, "Client is required."),
  clientName: z.string().optional(),
  issueDate: z.date({ required_error: "Issue date is required." }),
  dueDate: z.date({ required_error: "Due date is required." }),
  tasks: z.array(invoiceTaskItemSchema).min(1, "At least one task must be selected for the invoice."),
  notes: z.string().optional(),
  taxRate: z.preprocess(
    (val) => parseFloat(z.string().parse(val || "0")),
    z.number().min(0).max(100).optional()
  ),
  razorpayLink: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  totalAmount: z.number().optional(), 
  taxAmount: z.number().optional(), 
  finalAmount: z.number().optional(), 
  status: z.enum(['draft', 'sent', 'paid', 'overdue']).default('draft'),
});

export type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormDialogProps {
  invoice?: Partial<Invoice> & { tasks: InvoiceTaskItem[] };
  clients: Client[];
  allTasksForClient: Task[]; 
  trigger?: React.ReactNode;
  onSave: (data: InvoiceFormData, invoiceId?: string) => Promise<void>;
  forceOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function InvoiceFormDialog({
  invoice,
  clients,
  allTasksForClient = [],
  trigger,
  onSave,
  forceOpen,
  onOpenChange,
}: InvoiceFormDialogProps) {
  const [open, setOpen] = useState(forceOpen || false);
  const { toast } = useToast();

  const defaultTaxRate = useMemo(() => {
    const client = clients.find(c => c.id === invoice?.clientId);
    return client?.currency === 'INR' ? 18 : 10;
  }, [clients, invoice?.clientId]);

  const parseDateSafely = (dateString?: string): Date | undefined => {
    if (!dateString) return undefined;
    const parsed = parseISO(dateString);
    return isValid(parsed) ? parsed : undefined;
  }

  const { control, register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: invoice?.invoiceNumber || `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      clientId: invoice?.clientId || '',
      clientName: invoice?.clientName || '',
      issueDate: parseDateSafely(invoice?.issueDate) || new Date(),
      dueDate: parseDateSafely(invoice?.dueDate) || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      tasks: invoice?.tasks?.map(t => ({ ...t, selected: true })) || [],
      notes: invoice?.notes || '',
      taxRate: invoice?.taxRate ?? defaultTaxRate,
      razorpayLink: invoice?.razorpayLink || '',
      status: invoice?.status || 'draft',
    },
  });

  const { fields, append, remove, update, replace } = useFieldArray({
    control,
    name: "tasks",
  });

  const watchedClientId = watch('clientId');
  const watchedTasks = watch('tasks');
  const watchedTaxRate = watch('taxRate');

  useEffect(() => {
    if (watchedClientId) {
      const client = clients.find(c => c.id === watchedClientId);
      setValue('clientName', client?.name || '');

      // If we are editing an invoice, populate with its tasks
      if (invoice?.id && invoice?.tasks && invoice.tasks.length > 0) {
         const existingInvoiceTasks = invoice.tasks.map(task => ({
          taskId: task.taskId,
          description: task.description,
          hours: task.hours,
          selected: true // All tasks part of an existing invoice are considered selected
        }));
        replace(existingInvoiceTasks);
      } 
      // If creating new or client changed for a new invoice, populate with unbilled tasks
      else if (!invoice?.id || (invoice?.id && invoice?.tasks?.length === 0)) {
        const unbilledClientTasks = allTasksForClient.filter(
          task => task.clientId === watchedClientId && !task.billed
        );
        const newTasksForForm = unbilledClientTasks.map(task => ({
          taskId: task.id,
          description: task.description,
          hours: task.hours,
          selected: invoice?.tasks?.some(it => it.taskId === task.id) || false, 
        }));
        replace(newTasksForForm);
      }
    } else {
      replace([]);
    }
  }, [watchedClientId, clients, setValue, allTasksForClient, invoice, replace]);


  useEffect(() => {
    const client = clients.find(c => c.id === watchedClientId);
    const hourlyRate = client?.hourlyRate || 0;
    
    const selectedTasks = watchedTasks.filter(task => task.selected);

    const subTotal = selectedTasks.reduce((sum, task) => sum + (task.hours * hourlyRate), 0);
    const tax = subTotal * ((watchedTaxRate || 0) / 100);
    const grandTotal = subTotal + tax;

    setValue('totalAmount', subTotal);
    setValue('taxAmount', tax);
    setValue('finalAmount', grandTotal);
  }, [watchedTasks, watchedTaxRate, watchedClientId, clients, setValue]);


  useEffect(() => {
    if (forceOpen !== undefined) {
      setOpen(forceOpen);
    }
    if (forceOpen && invoice) {
       const clientForInvoice = clients.find(c => c.id === invoice.clientId);
        reset({
            invoiceNumber: invoice.invoiceNumber || `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
            clientId: invoice.clientId || '',
            clientName: clientForInvoice?.name || invoice.clientName || '',
            issueDate: parseDateSafely(invoice.issueDate) || new Date(),
            dueDate: parseDateSafely(invoice.dueDate) || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            tasks: invoice.tasks?.map(t => ({...t, selected: true})) || [], 
            notes: invoice.notes || '',
            taxRate: invoice.taxRate ?? (clientForInvoice?.currency === 'INR' ? 18 : 10),
            razorpayLink: invoice.razorpayLink || '',
            status: invoice.status || 'draft',
        });
    } else if (forceOpen && !invoice) {
        reset({ 
            invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
            clientId: '',
            clientName: '',
            issueDate: new Date(),
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            tasks: [],
            notes: '',
            taxRate: defaultTaxRate,
            razorpayLink: '',
            status: 'draft',
        });
    }
  }, [forceOpen, invoice, reset, clients, defaultTaxRate]);


  const onSubmitHandler: SubmitHandler<InvoiceFormData> = async (data) => {
    const finalTasksToSave = data.tasks.filter(t => t.selected);
    if (finalTasksToSave.length === 0) {
        toast({
            title: "No Tasks Selected",
            description: "Please select at least one task to include in the invoice.",
            variant: "destructive",
        });
        return;
    }
    
    const dataToSave: InvoiceFormData = {
        ...data,
        tasks: finalTasksToSave, 
        issueDate: data.issueDate, // Keep as Date object for Firestore saving logic in parent
        dueDate: data.dueDate,   // Keep as Date object
    };

    await onSave(dataToSave, invoice?.id);
    if (onOpenChange) onOpenChange(false); else setOpen(false);
  };
  
  const currentClient = clients.find(c => c.id === watchedClientId);
  const currencySymbol = currentClient?.currency === 'INR' ? '₹' : '$';

  const availableTasksForSelection = useMemo(() => {
    if (!watchedClientId) return [];
    // Show tasks that are unbilled for this client, OR tasks that are already part of THIS invoice if editing
    return allTasksForClient.filter(task => 
      task.clientId === watchedClientId && 
      (!task.billed || (invoice?.tasks || []).some(it => it.taskId === task.id))
    );
  }, [allTasksForClient, watchedClientId, invoice?.tasks]);


  return (
    <Dialog open={open} onOpenChange={(o) => { if (onOpenChange) onOpenChange(o); else setOpen(o); }}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{invoice?.id ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
          <DialogDescription>
            {invoice?.id ? "Update the invoice details below." : "Fill in the details for the new invoice."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmitHandler)}>
          <ScrollArea className="max-h-[calc(80vh-200px)] p-1 pr-4">
            <div className="grid gap-4 py-4 ">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input id="invoiceNumber" {...register("invoiceNumber")} className={errors.invoiceNumber ? 'border-destructive' : ''} />
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
                          // When client changes, re-evaluate available tasks for the form
                          const clientData = clients.find(c => c.id === value);
                          setValue('clientName', clientData?.name || '');
                           const newClientTasks = allTasksForClient
                            .filter(t => t.clientId === value && !t.billed)
                            .map(task => ({
                              taskId: task.id,
                              description: task.description,
                              hours: task.hours,
                              selected: false, // Default to not selected on client change
                            }));
                          replace(newClientTasks);

                        }} 
                        value={field.value} 
                        defaultValue={field.value}
                        disabled={!!invoice?.id} // Disable if editing an existing invoice
                      >
                        <SelectTrigger id="clientId" className={errors.clientId ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.clientId && <p className="text-xs text-destructive mt-1">{errors.clientId.message}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Controller
                    name="issueDate"
                    control={control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground", errors.issueDate ? 'border-destructive' : '')}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value && isValid(field.value) ? format(field.value, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {errors.issueDate && <p className="text-xs text-destructive mt-1">{errors.issueDate.message}</p>}
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Controller
                    name="dueDate"
                    control={control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground", errors.dueDate ? 'border-destructive' : '')}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value && isValid(field.value) ? format(field.value, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {errors.dueDate && <p className="text-xs text-destructive mt-1">{errors.dueDate.message}</p>}
                </div>
              </div>
              
              <div>
                <Label>Select Tasks to Invoice</Label>
                <ScrollArea className="h-48 mt-1 rounded-md border p-2">
                  {fields.length > 0 ? ( // Iterate over `fields` from useFieldArray
                    fields.map((fieldItem, index) => (
                      <div key={fieldItem.id} className="flex items-center space-x-2 py-1">
                        <Controller
                          name={`tasks.${index}.selected`}
                          control={control}
                          render={({ field: checkboxField }) => (
                            <Checkbox
                              id={`task-select-${fieldItem.id}`}
                              checked={checkboxField.value}
                              onCheckedChange={checkboxField.onChange}
                              // Disable if task is already billed and not part of the original invoice tasks (if editing)
                              disabled={
                                allTasksForClient.find(t=>t.id === fieldItem.taskId)?.billed && 
                                !(invoice?.tasks || []).some(it => it.taskId === fieldItem.taskId)
                              }
                            />
                          )}
                        />
                        <Label htmlFor={`task-select-${fieldItem.id}`} className="font-normal flex-1 cursor-pointer">
                          {fieldItem.description} ({fieldItem.hours.toFixed(1)} hrs) - {
                            format(parseISO(allTasksForClient.find(t=>t.id === fieldItem.taskId)?.date || new Date().toISOString()), "MMM dd")
                          }
                          {allTasksForClient.find(t=>t.id === fieldItem.taskId)?.billed && 
                           !(invoice?.tasks || []).some(it => it.taskId === fieldItem.taskId) && 
                           <span className="text-xs text-muted-foreground ml-2">(Billed)</span>}
                        </Label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground p-2 text-center">
                      {watchedClientId ? "No unbilled tasks found for this client, or all available tasks are already selected for this form." : "Please select a client to see available tasks."}
                    </p>
                  )}
                </ScrollArea>
                {errors.tasks && <p className="text-xs text-destructive mt-1">{errors.tasks.message || (errors.tasks as any)?.root?.message}</p>}
              </div>


              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" {...register("notes")} placeholder="Any additional notes for the client" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
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
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <SelectTrigger id="status" className={errors.status ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
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
                <Label htmlFor="razorpayLink">Razorpay Payment Link (Optional)</Label>
                <Input id="razorpayLink" {...register("razorpayLink")} placeholder="https://rzp.io/i/..." className={errors.razorpayLink ? 'border-destructive' : ''} />
                {errors.razorpayLink && <p className="text-xs text-destructive mt-1">{errors.razorpayLink.message}</p>}
              </div>

              <div className="mt-4 p-4 bg-muted/50 rounded-md space-y-1">
                <h4 className="text-sm font-semibold mb-2">Invoice Summary</h4>
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{currencySymbol}{(watch('totalAmount') || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax ({watch('taxRate') || 0}%):</span>
                  <span>{currencySymbol}{(watch('taxAmount') || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold pt-1 border-t mt-1">
                  <span>Total:</span>
                  <span>{currencySymbol}{(watch('finalAmount') || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="mt-2 pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => { if (onOpenChange) onOpenChange(false); else setOpen(false); reset();}}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (invoice?.id ? "Save Changes" : "Create Invoice")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
