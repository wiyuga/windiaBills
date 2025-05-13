"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';

const schema = z.object({
  invoiceNumber: z.string().min(1, "Required"),
  clientId: z.string().min(1, "Required"),
  issueDate: z.date(),
  dueDate: z.date(),
  notes: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  razorpayLink: z.string().optional(),
  hours: z.array(z.object({ description: z.string(), hours: z.number() })).optional()
});

type FormData = z.infer<typeof schema>;

interface Props {
  invoice?: any;
  clients: { id: string; name: string; }[];
  trigger: React.ReactNode;
  onSave?: (data: any) => void;
}

export default function InvoiceFormDialog({ invoice, clients, trigger, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      invoiceNumber: '',
      clientId: '',
      issueDate: new Date(),
      dueDate: new Date(),
      notes: '',
      taxRate: 10,
      razorpayLink: '',
      hours: []
    }
  });

  const clientId = watch('clientId');
  const hours = watch('hours') || [];
  const taxRate = watch('taxRate') || 0;

  useEffect(() => {
    if (invoice) {
      reset({
        invoiceNumber: invoice.invoiceNumber,
        clientId: invoice.clientId,
        issueDate: new Date(invoice.issueDate),
        dueDate: new Date(invoice.dueDate),
        notes: invoice.notes,
        taxRate: invoice.taxRate || 10,
        razorpayLink: invoice.razorpayLink || '',
        hours: invoice.hours || []
      });
    }
  }, [invoice, reset]);

  const submit = async (data: FormData) => {
    try {
      if (invoice?.id) {
        await updateDoc(doc(db, "invoices", invoice.id), data);
      } else {
        await addDoc(collection(db, "invoices"), data);
      }
      setOpen(false);
      onSave?.(data);
    } catch (e) {
      console.error(e);
    }
  };

  const subtotal = hours.reduce((sum, h) => sum + (h.hours || 0), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(submit)}>
          <DialogHeader>
            <DialogTitle>{invoice ? 'Edit Invoice' : 'New Invoice'}</DialogTitle>
            <DialogDescription>Enter invoice details</DialogDescription>
          </DialogHeader>

          <Label>Invoice Number</Label>
          <Input {...register('invoiceNumber')} />
          {errors.invoiceNumber && <span>{errors.invoiceNumber.message}</span>}

          <Label>Client</Label>
          <select {...register('clientId')}>
            <option value="">Select</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.clientId && <span>{errors.clientId.message}</span>}

          <Label>Issue Date</Label>
          <Controller control={control} name="issueDate" render={({ field }) => (
            <Calendar selected={field.value} onSelect={field.onChange} />
          )} />
          {errors.issueDate && <span>{errors.issueDate.message}</span>}

          <Label>Due Date</Label>
          <Controller control={control} name="dueDate" render={({ field }) => (
            <Calendar selected={field.value} onSelect={field.onChange} />
          )} />
          {errors.dueDate && <span>{errors.dueDate.message}</span>}

          <Label>Notes</Label>
          <Textarea {...register('notes')} />

          <Label>Tax Rate (%)</Label>
          <Input type="number" step="0.01" {...register('taxRate')} />

          {clientId && (
            <>
              <Label>Razorpay Link</Label>
              <Input {...register('razorpayLink')} />
            </>
          )}

          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h4 className="text-sm font-semibold mb-2">Preview</h4>
            <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
            <p>Tax ({taxRate}%): ₹{taxAmount.toFixed(2)}</p>
            <p><strong>Total: ₹{total.toFixed(2)}</strong></p>
          </div>

          <DialogFooter>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
