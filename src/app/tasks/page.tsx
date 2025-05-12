
"use client"; // Required for useState, useEffect, useRouter
import React, { useState, useEffect } from 'react';
import PageHeader from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { mockClients, mockServices } from "@/lib/placeholder-data";
import TaskListTable from "./components/task-list-table";
import TaskFormDialog from "./components/task-form-dialog";
import InvoiceFormDialog from "@/app/invoices/components/invoice-form-dialog";
import type { Task as TaskType, Client, Service, Invoice, InvoiceTaskItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import type { InvoiceFormData } from '@/app/invoices/components/invoice-form-dialog';
import { dataStore } from '@/lib/data-store';

export default function TasksPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<TaskType[]>(() => dataStore.getTasks() as TaskType[]);
  const clients = mockClients; 
  const services = mockServices; 

  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [invoiceDataForForm, setInvoiceDataForForm] = useState<Partial<Omit<Invoice, 'id' | 'totalAmount' | 'taxAmount' | 'finalAmount'>> & {tasks: InvoiceTaskItem[]} | undefined>(undefined);
  const [selectedClientForInvoice, setSelectedClientForInvoice] = useState<Client | undefined>(undefined);

  useEffect(() => {
    const unsubscribeTasks = dataStore.subscribeToTasks(() => {
      setTasks([...dataStore.getTasks()]);
    });
    return () => {
      unsubscribeTasks();
    };
  }, []);

  const handleSaveTask = (data: Omit<TaskType, 'id' | 'clientName' | 'date'> & { date: Date }, taskId?: string) => {
    const taskPayload = {
      ...data,
      date: data.date.toISOString(),
    };

    if (taskId) {
      dataStore.updateTask(taskId, taskPayload);
      toast({ title: "Task Updated", description: "The task has been successfully updated." });
    } else {
      const clientName = clients.find(c=>c.id === data.clientId)?.name || '';
      const newTask: TaskType = {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ...taskPayload,
        clientName, 
      };
      dataStore.addTask(newTask);
      toast({ title: "Task Added", description: "The new task has been successfully logged." });
    }
  };

  const handleCreateInvoiceFromTasks = (selectedTasksToInvoice: TaskType[]) => {
    if (selectedTasksToInvoice.length === 0) {
      toast({ variant: "destructive", title: "No Tasks Selected", description: "Please select unbilled tasks to create an invoice." });
      return;
    }
    const clientForInvoice = clients.find(c => c.id === selectedTasksToInvoice[0].clientId);
    if (!clientForInvoice) {
      toast({ variant: "destructive", title: "Client Not Found", description: "Could not find client for the selected tasks." });
      return;
    }

    setSelectedClientForInvoice(clientForInvoice);

    const invoiceTasks: InvoiceTaskItem[] = selectedTasksToInvoice.map(task => ({
        taskId: task.id,
        description: task.description,
        hours: task.hours,
    }));

    const newInvoiceNumber = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000).padStart(4, '0')}`;
    
    setInvoiceDataForForm({
      clientId: clientForInvoice.id,
      clientName: clientForInvoice.name,
      tasks: invoiceTasks, 
      issueDate: new Date().toISOString(), 
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), 
      status: 'draft',
      invoiceNumber: newInvoiceNumber,
      taxRate: clientForInvoice.currency === 'INR' ? 18 : 10, 
    });
    setIsInvoiceFormOpen(true);
  };

  const handleSaveInvoice = (invoiceFormData: InvoiceFormData) => {
    try {
      const clientForInvoice = clients.find(c => c.id === invoiceFormData.clientId);
      if (!clientForInvoice) {
          toast({ variant: "destructive", title: "Error", description: "Client not found during invoice saving." });
          console.error("TasksPage: Client not found for clientId:", invoiceFormData.clientId);
          return;
      }

      const newInvoice: Invoice = {
          id: `invoice-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
          invoiceNumber: invoiceFormData.invoiceNumber,
          clientId: invoiceFormData.clientId,
          clientName: clientForInvoice.name, 
          tasks: invoiceFormData.selectedTasks, 
          totalAmount: invoiceFormData.totalAmount,
          taxAmount: invoiceFormData.taxAmount,
          finalAmount: invoiceFormData.finalAmount,
          status: invoiceFormData.status,
          issueDate: invoiceFormData.issueDate.toISOString(),
          dueDate: invoiceFormData.dueDate.toISOString(),
          notes: invoiceFormData.notes,
          razorpayLink: invoiceFormData.razorpayLink,
      };
      
      dataStore.addInvoice(newInvoice);

      const taskUpdates = invoiceFormData.selectedTasks.map((t) => ({ 
          taskId: t.taskId,
          data: { billed: true } as Partial<TaskType> 
      }));
      dataStore.updateMultipleTasks(taskUpdates); 

      toast({ title: "Invoice Created", description: `New invoice ${newInvoice.invoiceNumber} created and tasks marked as billed.` });
      setIsInvoiceFormOpen(false);
      setInvoiceDataForForm(undefined);
      setSelectedClientForInvoice(undefined);
    } catch (error) {
      console.error("Error in handleSaveInvoice:", error);
      toast({ variant: "destructive", title: "Error Saving Invoice", description: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}` });
    }
  };
  
  let tasksForInvoiceDialog: TaskType[] = [];
  if (isInvoiceFormOpen && selectedClientForInvoice && invoiceDataForForm) { // invoiceDataForForm.tasks might be empty, that's fine.
    const currentTasksState = tasks; 
    // Pass all tasks for the client. The dialog will handle displaying billed status and pre-selecting.
    tasksForInvoiceDialog = currentTasksState.filter(t => t.clientId === selectedClientForInvoice.id);
  }

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Log and manage tasks performed for your clients."
        actions={
          <TaskFormDialog
            clients={clients}
            services={services}
            trigger={<Button><PlusCircle className="mr-2 h-4 w-4" /> Log New Task</Button>}
            onSave={handleSaveTask}
          />
        }
      />
      <TaskListTable
        tasks={tasks} 
        clients={clients}
        services={services}
        onSaveTask={handleSaveTask}
        onCreateInvoice={handleCreateInvoiceFromTasks}
      />
       {isInvoiceFormOpen && selectedClientForInvoice && invoiceDataForForm && (
        <InvoiceFormDialog
          invoice={invoiceDataForForm as Partial<Invoice>} 
          clients={clients}
          allTasksForClient={tasksForInvoiceDialog}
          trigger={<div />} 
          onSave={handleSaveInvoice}
          forceOpen={isInvoiceFormOpen}
          onOpenChange={(open) => {
            setIsInvoiceFormOpen(open);
            if (!open) {
              setInvoiceDataForForm(undefined);
              setSelectedClientForInvoice(undefined);
            }
          }}
        />
      )}
    </>
  );
}
