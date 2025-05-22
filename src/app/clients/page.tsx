"use client";

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Client } from '@/lib/types';

// Zod schema and form data type for clients
const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  projectName: z.string().optional(),
  hourlyRate: z.number().min(0, "Hourly rate must be a positive number"),
});
export type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormDialogProps {
  services: any[]; // if needed
  trigger: React.ReactNode;
  onSave: (data: ClientFormData, clientId?: string) => void;
  client?: Partial<ClientFormData> & { id?: string };
}

export default function ClientFormDialog({ trigger, onSave, client }: ClientFormDialogProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: client ? {
      name: client.name ?? '',
      email: client.email ?? '',
      projectName: client.projectName ?? '',
      hourlyRate: client.hourlyRate ?? 0,
    } : { name: '', email: '', projectName: '', hourlyRate: 0 }
  });

  const onSubmit = (data: ClientFormData) => {
    onSave(data, client?.id);
    reset();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{client ? 'Edit Client' : 'New Client'}</DialogTitle>
            <DialogDescription>Enter client details below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="projectName">Project Name</Label>
              <Input id="projectName" {...register('projectName')} />
            </div>
            <div>
              <Label htmlFor="hourlyRate">Hourly Rate</Label>
              <Input id="hourlyRate" type="number" {...register('hourlyRate', { valueAsNumber: true })} />
              {errors.hourlyRate && <p className="text-xs text-destructive">{errors.hourlyRate.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <button type="submit" className="btn btn-primary">Save</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
