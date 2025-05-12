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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import type { Client } from '@/lib/types';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const clientSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().optional(),
  address: z.string().optional(),
  hourlyRate: z.preprocess(
    (val) => parseFloat(z.string().parse(val)), // Convert string to number
    z.number().min(0, { message: "Hourly rate must be a positive number." })
  ),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormDialogProps {
  client?: Client;
  trigger: React.ReactNode;
  onSave?: (data: ClientFormData) => void; // Callback for saving
}

export default function ClientFormDialog({ client, trigger, onSave }: ClientFormDialogProps) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: client ? {
      name: client.name,
      email: client.email,
      phone: client.phone || '',
      address: client.address || '',
      hourlyRate: client.hourlyRate,
    } : {
      hourlyRate: 0, // Default for new client
    },
  });

  useEffect(() => {
    if (client && open) {
      reset({
        name: client.name,
        email: client.email,
        phone: client.phone || '',
        address: client.address || '',
        hourlyRate: client.hourlyRate,
      });
    } else if (!client && open) {
      reset({
        name: '',
        email: '',
        phone: '',
        address: '',
        hourlyRate: 0,
      });
    }
  }, [client, open, reset]);


  const onSubmit: SubmitHandler<ClientFormData> = (data) => {
    console.log("Client data:", data); // Replace with actual save logic
    if (onSave) {
      onSave(data);
    }
    // For demonstration, we'll just log it and close.
    // In a real app, you'd call an API here.
    setOpen(false); 
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{client ? "Edit Client" : "Add New Client"}</DialogTitle>
          <DialogDescription>
            {client ? "Update the client's details below." : "Fill in the details for the new client."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <div className="col-span-3">
              <Input id="name" {...register("name")} className={errors.name ? 'border-destructive' : ''} />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <div className="col-span-3">
              <Input id="email" type="email" {...register("email")} className={errors.email ? 'border-destructive' : ''} />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">Phone</Label>
            <Input id="phone" {...register("phone")} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="hourlyRate" className="text-right">Hourly Rate ($)</Label>
            <div className="col-span-3">
              <Input id="hourlyRate" type="number" step="0.01" {...register("hourlyRate")} className={errors.hourlyRate ? 'border-destructive' : ''} />
              {errors.hourlyRate && <p className="text-xs text-destructive mt-1">{errors.hourlyRate.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="address" className="text-right pt-2">Address</Label>
            <Textarea id="address" {...register("address")} className="col-span-3" placeholder="Client's billing address" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">{client ? "Save Changes" : "Add Client"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
