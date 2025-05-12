"use client"; // Required for useState, useEffect, useRouter
import React, { useState } from 'react'; // Required for useState
import PageHeader from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { mockTasks, mockClients, mockServices } from "@/lib/placeholder-data";
import TaskListTable from "./components/task-list-table";
import TaskFormDialog from "./components/task-form-dialog";
import InvoiceFormDialog from "@/app/invoices/components/invoice-form-dialog"; // For opening invoice dialog
import type { Task as TaskType, Client, Service, Invoice } from "@/lib/types"; // Renamed Task to TaskType to avoid conflict
import { useToast } from "@/hooks/use-toast";


export default function TasksPage() {
  const { toast } = useToast();
  // In a real app, fetch tasks from an API
  const [tasks, setTasks] = useState<TaskType[]>(mockTasks); // Make tasks stateful for updates
  const clients = mockClients; 
  const services = mockServices;

  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [invoiceDataForForm, setInvoiceDataForForm] = useState<Partial<Invoice> | undefined>(undefined);
  const [selectedClientForInvoice, setSelectedClientForInvoice] = useState<Client | undefined>(undefined);


  const handleSaveTask = (data: any, taskId?: string) => {
    if (taskId) {
      console.log("Updating task:", taskId, data);
      setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? {...t, ...data, date: data.date.toISOString() } : t));
       toast({ title: "Task Updated", description: "The task has been successfully updated." });
    } else {
      const newTask = { 
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
    
    const invoiceTasks = selectedTasksToInvoice.map(task => ({
        taskId: task.id,
        description: task.description,
        hours: task.hours,
    }));

    const subTotal = invoiceTasks.reduce((sum, taskItem) => {
        return sum + (taskItem.hours * (clientForInvoice.hourlyRate || 0));
    }, 0);
    
    // Assuming a default tax rate, e.g., 10%
    const defaultTaxRate = 10; 
    const taxAmount = subTotal * (defaultTaxRate / 100);
    const totalAmountWithTax = subTotal + taxAmount;


    setInvoiceDataForForm({
      clientId: clientForInvoice.id,
      clientName: clientForInvoice.name,
      tasks: invoiceTasks,
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // Due in 14 days
      status: 'draft',
      // totalAmount: subTotal, // This will be calculated in InvoiceFormDialog
      // taxAmount: taxAmount, // This will be calculated based on taxRate in InvoiceFormDialog
      // finalAmount: totalAmountWithTax, // This will be calculated
    });
    setIsInvoiceFormOpen(true);
  };

  const handleSaveInvoice = (invoiceFormData: any) => {
    console.log("Saving invoice from Tasks page:", invoiceFormData);
    // Mark tasks as billed
    const billedTaskIds = invoiceFormData.tasks.map((t: any) => t.taskId);
    setTasks(prevTasks => 
        prevTasks.map(task => 
            billedTaskIds.includes(task.id) ? { ...task, billed: true } : task
        )
    );
    // Add to mockInvoices (or call API)
    // mockInvoices.push({ id: `invoice-${Date.now()}`, ...invoiceFormData /* transform as needed */ });
    toast({ title: "Invoice Created", description: "New invoice created and tasks marked as billed." });
    setIsInvoiceFormOpen(false);
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
       {isInvoiceFormOpen && selectedClientForInvoice && (
        <InvoiceFormDialog
          invoice={invoiceDataForForm as any} // Cast as any if structure differs slightly, ensure it's compatible
          clients={clients}
          allTasksForClient={tasks.filter(t => t.clientId === selectedClientForInvoice.id && !t.billed)} // Pass unbilled tasks for this client
          trigger={<></>} // Dialog is controlled by isInvoiceFormOpen, no visible trigger needed here
          onSave={handleSaveInvoice}
          forceOpen={isInvoiceFormOpen} // Prop to control dialog visibility externally
          onOpenChange={(open) => {
            if (!open) {
              setIsInvoiceFormOpen(false);
              setInvoiceDataForForm(undefined);
              setSelectedClientForInvoice(undefined);
            }
          }}
        />
      )}
    </>
  );
}
