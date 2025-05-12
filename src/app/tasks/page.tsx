"use client"; // Required for useState, useEffect, useRouter
import React, { useState } from 'react'; // Required for useState
import PageHeader from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { mockTasks, mockClients, mockServices, mockInvoices as initialMockInvoices } from "@/lib/placeholder-data"; // Added mockInvoices
import TaskListTable from "./components/task-list-table";
import TaskFormDialog from "./components/task-form-dialog";
import InvoiceFormDialog from "@/app/invoices/components/invoice-form-dialog"; // For opening invoice dialog
import type { Task as TaskType, Client, Service, Invoice, InvoiceTaskItem } from "@/lib/types"; // Renamed Task to TaskType to avoid conflict
import { useToast } from "@/hooks/use-toast";
import type { InvoiceFormData } from '@/app/invoices/components/invoice-form-dialog';


export default function TasksPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<TaskType[]>(mockTasks); 
  const [globalInvoices, setGlobalInvoices] = useState<Invoice[]>(initialMockInvoices); // Manage global invoices
  const clients = mockClients; 
  const services = mockServices;

  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [invoiceDataForForm, setInvoiceDataForForm] = useState<Partial<Omit<Invoice, 'id' | 'totalAmount' | 'taxAmount' | 'finalAmount'> & {tasks: InvoiceTaskItem[]}> | undefined>(undefined);
  const [selectedClientForInvoice, setSelectedClientForInvoice] = useState<Client | undefined>(undefined);


  const handleSaveTask = (data: any, taskId?: string) => {
    if (taskId) {
      console.log("Updating task:", taskId, data);
      setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? {...t, ...data, date: data.date.toISOString() } : t));
       toast({ title: "Task Updated", description: "The task has been successfully updated." });
    } else {
      const newTask: TaskType = { 
        id: `task-${Date.now()}`, 
        ...data, 
        date: data.date.toISOString(),
        clientName: clients.find(c=>c.id === data.clientId)?.name || '',
      };
      console.log("Adding new task:", newTask);
      setTasks(prevTasks => [newTask, ...prevTasks]);
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

    setInvoiceDataForForm({
      clientId: clientForInvoice.id,
      clientName: clientForInvoice.name,
      tasks: invoiceTasks, // This maps to `selectedTasks` in the form dialog's default values
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), 
      status: 'draft',
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000).padStart(4, '0')}`,
    });
    setIsInvoiceFormOpen(true);
  };

  const handleSaveInvoice = (invoiceFormData: InvoiceFormData) => {
    console.log("Saving invoice from Tasks page:", invoiceFormData);
    
    const newInvoice: Invoice = {
        id: `invoice-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
        invoiceNumber: invoiceFormData.invoiceNumber,
        clientId: invoiceFormData.clientId,
        clientName: clients.find(c => c.id === invoiceFormData.clientId)?.name || '',
        tasks: invoiceFormData.selectedTasks, // Use selectedTasks from form data
        totalAmount: invoiceFormData.totalAmount,
        taxAmount: invoiceFormData.taxAmount,
        finalAmount: invoiceFormData.finalAmount,
        status: invoiceFormData.status,
        issueDate: invoiceFormData.issueDate.toISOString(),
        dueDate: invoiceFormData.dueDate.toISOString(),
        notes: invoiceFormData.notes,
        razorpayLink: invoiceFormData.razorpayLink,
    };

    setGlobalInvoices(prev => [newInvoice, ...prev]); // Add to a global/mock invoice list

    // Mark tasks as billed
    const billedTaskIds = invoiceFormData.selectedTasks.map((t) => t.taskId);
    setTasks(prevTasks => 
        prevTasks.map(task => 
            billedTaskIds.includes(task.id) ? { ...task, billed: true } : task
        )
    );
    
    toast({ title: "Invoice Created", description: `New invoice ${newInvoice.invoiceNumber} created and tasks marked as billed.` });
    setIsInvoiceFormOpen(false);
    setInvoiceDataForForm(undefined);
    setSelectedClientForInvoice(undefined);
  };


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
          // Pass the pre-filled invoice data. `invoiceDataForForm.tasks` will be used for `selectedTasks` in the dialog.
          invoice={invoiceDataForForm as Partial<Invoice>} 
          clients={clients}
          // Pass all unbilled tasks for the selected client so the dialog can display them if needed,
          // though primary task selection happens here. The dialog will use `invoiceDataForForm.tasks` to pre-check.
          allTasksForClient={tasks.filter(t => t.clientId === selectedClientForInvoice.id && (!t.billed || (invoiceDataForForm.tasks || []).some(it => it.taskId === t.id)))}
          trigger={<></>} 
          onSave={handleSaveInvoice}
          forceOpen={isInvoiceFormOpen} 
          onOpenChange={(open) => {
            setIsInvoiceFormOpen(open); // This will set it to false when dialog closes
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
