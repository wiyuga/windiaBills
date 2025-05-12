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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Task, Client } from '@/lib/types';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const taskSchema = z.object({
  clientId: z.string().min(1, { message: "Client is required." }),
  description: z.string().min(5, { message: "Description must be at least 5 characters." }),
  hours: z.preprocess(
    (val) => parseFloat(z.string().parse(val)),
    z.number().min(0.1, { message: "Hours must be at least 0.1." })
  ),
  date: z.date({ required_error: "Date is required." }),
  billed: z.boolean().default(false),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormDialogProps {
  task?: Task;
  clients: Client[];
  trigger: React.ReactNode;
  onSave?: (data: TaskFormData) => void;
}

export default function TaskFormDialog({ task, clients, trigger, onSave }: TaskFormDialogProps) {
  const [open, setOpen] = useState(false);
  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: task ? {
      ...task,
      date: new Date(task.date), // Convert string date to Date object
      hours: task.hours,
    } : {
      clientId: '',
      description: '',
      hours: 0.0,
      date: new Date(),
      billed: false,
    },
  });

  useEffect(() => {
    if (task && open) {
      reset({
        ...task,
        date: new Date(task.date),
        hours: task.hours,
      });
    } else if (!task && open) {
      reset({
        clientId: '',
        description: '',
        hours: 0.0,
        date: new Date(),
        billed: false,
      });
    }
  }, [task, open, reset]);

  const onSubmit: SubmitHandler<TaskFormData> = (data) => {
    console.log("Task data:", data);
    if (onSave) {
      onSave(data);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Log New Task"}</DialogTitle>
          <DialogDescription>
            {task ? "Update the task details below." : "Fill in the details for the new task."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="clientId" className="text-right">Client</Label>
            <Controller
              name="clientId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <SelectTrigger id="clientId" className={`col-span-3 ${errors.clientId ? 'border-destructive' : ''}`}>
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
            {errors.clientId && <p className="col-start-2 col-span-3 text-xs text-destructive mt-1">{errors.clientId.message}</p>}
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">Description</Label>
            <div className="col-span-3">
              <Textarea id="description" {...register("description")} className={errors.description ? 'border-destructive' : ''} placeholder="Detailed description of the task performed" />
              {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="hours" className="text-right">Hours</Label>
             <div className="col-span-3">
              <Input id="hours" type="number" step="0.1" {...register("hours")} className={errors.hours ? 'border-destructive' : ''} />
              {errors.hours && <p className="text-xs text-destructive mt-1">{errors.hours.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">Date</Label>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        `col-span-3 justify-start text-left font-normal ${errors.date ? 'border-destructive' : ''}`,
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.date && <p className="col-start-2 col-span-3 text-xs text-destructive mt-1">{errors.date.message}</p>}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">{task ? "Save Changes" : "Log Task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
