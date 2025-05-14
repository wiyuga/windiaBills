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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Client, Service } from '@/lib/types';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Checkbox } from '@/components/ui/checkbox'; // For multi-select services

const clientSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  owner: z.string().min(2, { message: "Owner name must be at least 2 characters." }),
  country: z.string().min(2, { message: "Country must be at least 2 characters." }),
  mobile: z.string().optional(),
  email: z.string().email({ message: "Invalid email address." }),
  hourlyRate: z.preprocess(
    (val) => parseFloat(z.string().parse(val)),
    z.number().min(0, { message: "Hourly rate must be a positive number." })
  ),
  status: z.enum(['active', 'inactive']),
  projectName: z.string().min(1, { message: "Project name is required." }),
  serviceIds: z.array(z.string()).min(1, { message: "At least one service must be selected." }),
  currency: z.enum(['USD', 'INR']),
  address: z.string().optional(), // Kept from original
});

export type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormDialogProps {
  client?: Client;
  services: Service[]; // For service selection
  trigger: React.ReactNode;
  onSave?: (data: ClientFormData, clientId?: string) => void; // Callback for saving
}

export default function ClientFormDialog({ client, services, trigger, onSave }: ClientFormDialogProps) {
  const [open, setOpen] = useState(false);
  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: client ? {
      ...client,
      mobile: client.mobile || '',
      address: client.address || '',
    } : {
      name: '',
      owner: '',
      country: '',
      mobile: '',
      email: '',
      hourlyRate: 0,
      status: 'active',
      projectName: '',
      serviceIds: [],
      currency: 'USD',
      address: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (client) {
        reset({
          ...client,
          mobile: client.mobile || '',
          address: client.address || '',
        });
      } else {
        reset({
          name: '',
          owner: '',
          country: '',
          mobile: '',
          email: '',
          hourlyRate: 0,
          status: 'active',
          projectName: '',
          serviceIds: [],
          currency: 'USD',
          address: '',
        });
      }
    }
  }, [client, open, reset]);

  const onSubmit: SubmitHandler<ClientFormData> = (data) => {
    console.log("Client data:", data); 
    // In a real app, send email for onboarding if it's a new client
    if (!client && data.email) {
      console.log(`Placeholder: Send onboarding email to ${data.email}`);
      // sendOnboardingEmail(data.email);
    }
    if (onSave) {
      onSave(data, client?.id);
    }
    setOpen(false); 
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? "Edit Client" : "Add New Client"}</DialogTitle>
          <DialogDescription>
            {client ? "Update the client's details below." : "Fill in the details for the new client."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Client Name</Label>
              <Input id="name" {...register("name")} className={errors.name ? 'border-destructive' : ''} />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="owner">Owner</Label>
              <Input id="owner" {...register("owner")} className={errors.owner ? 'border-destructive' : ''} />
              {errors.owner && <p className="text-xs text-destructive mt-1">{errors.owner.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} className={errors.email ? 'border-destructive' : ''} />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="mobile">Mobile</Label>
              <Input id="mobile" {...register("mobile")} />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input id="country" {...register("country")} className={errors.country ? 'border-destructive' : ''} />
              {errors.country && <p className="text-xs text-destructive mt-1">{errors.country.message}</p>}
            </div>
             <div>
              <Label htmlFor="hourlyRate">Hourly Rate</Label>
              <Input id="hourlyRate" type="number" step="0.01" {...register("hourlyRate")} className={errors.hourlyRate ? 'border-destructive' : ''} />
              {errors.hourlyRate && <p className="text-xs text-destructive mt-1">{errors.hourlyRate.message}</p>}
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <SelectTrigger id="currency" className={errors.currency ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="INR">INR</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.currency && <p className="text-xs text-destructive mt-1">{errors.currency.message}</p>}
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <SelectTrigger id="status" className={errors.status ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && <p className="text-xs text-destructive mt-1">{errors.status.message}</p>}
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input id="projectName" {...register("projectName")} className={errors.projectName ? 'border-destructive' : ''} />
              {errors.projectName && <p className="text-xs text-destructive mt-1">{errors.projectName.message}</p>}
            </div>
            <div className="md:col-span-2">
                <Label>Services</Label>
                <Controller
                    name="serviceIds"
                    control={control}
                    render={({ field }) => (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2 border rounded-md mt-1 max-h-40 overflow-y-auto">
                            {services.map((serviceItem) => (
                                <div key={serviceItem.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`service-${serviceItem.id}`}
                                        checked={field.value?.includes(serviceItem.id)}
                                        onCheckedChange={(checked) => {
                                            const newValue = checked
                                                ? [...(field.value || []), serviceItem.id]
                                                : (field.value || []).filter((id) => id !== serviceItem.id);
                                            field.onChange(newValue);
                                        }}
                                    />
                                    <Label htmlFor={`service-${serviceItem.id}`} className="font-normal cursor-pointer">{serviceItem.name}</Label>
                                </div>
                            ))}
                        </div>
                    )}
                />
                {errors.serviceIds && <p className="text-xs text-destructive mt-1">{errors.serviceIds.message}</p>}
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" {...register("address")} placeholder="Client's billing address" />
            </div>
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
