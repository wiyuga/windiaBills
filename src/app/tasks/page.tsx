"use client";

import React, { useState, useEffect } from 'react';
import PageHeader from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import TaskListTable from "./components/task-list-table";
import TaskFormDialog from "./components/task-form-dialog";
import InvoiceFormDialog from "@/app/invoices/components/invoice-form-dialog";
import type { Task as TaskType, Client, Service, Invoice, InvoiceTaskItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import type { InvoiceFormData } from "@/app/invoices/components/invoice-form-dialog";
import type { FormData as InvoiceFormData } from "@/app/invoices/components/invoice-form-dialog";import { db } from "@/lib/firebaseConfig";
import { 
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc
} from "firebase/firestore";

export default function TasksPage() {
  const { toast } = useToast();

  // Firestore state
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // Invoice dialog state
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [invoiceDataForForm, setInvoiceDataForForm] = useState<Partial<Invoice> & { tasks: InvoiceTaskItem[] }>();
  const [selectedClientForInvoice, setSelectedClientForInvoice] = useState<Client>();

  // Subscribe to Firestore collections
  useEffect(() => {
    const unsubTasks = onSnapshot(collection(db, 'tasks'), snapshot => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as TaskType[]);
    });
    const unsubClients = onSnapshot(collection(db, 'clients'), snapshot => {
      setClients(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Client[]);
    });
    const unsubServices = onSnapshot(collection(db, 'services'), snapshot => {
      setServices(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Service[]);
    });

    return () => {
      unsubTasks();
      unsubClients();
      unsubServices();
    };
  }, []);

  // Save or update a task in Firestore
  const handleSaveTask = async (
    data: Omit<TaskType, 'id' | 'clientName' | 'date'> & { date: Date },
    taskId?: string
  ) => {
    try {
      const payload = { ...data, date: data.date.toISOString() };
      if (taskId) {
        await updateDoc(doc(db, 'tasks', taskId), payload);
        toast({ title: 'Task Updated', description: 'The task has been updated.' });
      } else {
        const clientName = clients.find(c => c.id === data.clientId)?.name || '';
        await addDoc(collection(db, 'tasks'), { ...payload, clientName });
        toast({ title: 'Task Added', description: 'A new task has been logged.' });
      }
    } catch (error) {
      console.error('Error saving task:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save task.' });
    }
  };

  // Prepare invoice data when creating invoice from selected tasks
  const handleCreateInvoiceFromTasks = (selected: TaskType[]) => {
    if (selected.length === 0) {
      toast({ variant: 'destructive', title: 'No Tasks Selected', description: 'Select tasks to invoice.' });
      return;
    }
    const client = clients.find(c => c.id === selected[0].clientId);
    if (!client) {
      toast({ variant: 'destructive', title: 'Client Not Found', description: 'Cannot find client.' });
      return;
    }
    setSelectedClientForInvoice(client);

    const items: InvoiceTaskItem[] = selected.map(t => ({ taskId: t.id, description: t.description, hours: t.hours }));
    const invNum = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`;

    setInvoiceDataForForm({
      clientId: client.id,
      clientName: client.name,
      tasks: items,
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 14*24*60*60*1000).toISOString(),
      status: 'draft',
      invoiceNumber: invNum,
      taxRate: client.currency === 'INR' ? 18 : 10,
    });
    setIsInvoiceFormOpen(true);
  };

  // Save invoice to Firestore and mark tasks billed
  const handleSaveInvoice = async (data: InvoiceFormData) => {
    try {
      // Add invoice
      await addDoc(collection(db, 'invoices'), {
        ...data,
        issueDate: data.issueDate.toISOString(),
        dueDate: data.dueDate.toISOString(),
      });
      // Update tasks as billed
      for (const item of data.selectedTasks) {
        await updateDoc(doc(db, 'tasks', item.taskId), { billed: true });
      }
      toast({ title: 'Invoice Created', description: `Invoice ${data.invoiceNumber} created.` });
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save invoice.' });
    } finally {
      setIsInvoiceFormOpen(false);
      setInvoiceDataForForm(undefined);
      setSelectedClientForInvoice(undefined);
    }
  };

  // Determine tasks for invoice dialog
  const tasksForDialog: TaskType[] = isInvoiceFormOpen && selectedClientForInvoice
    ? tasks.filter(t => t.clientId === selectedClientForInvoice.id)
    : [];

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Log and manage tasks for clients."
        actions={
          <TaskFormDialog
            clients={clients}
            services={services}
            trigger={<Button><PlusCircle className="mr-2 h-4 w-4" /> Log Task</Button>}
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
          invoice={invoiceDataForForm}
          clients={clients}
          allTasksForClient={tasksForDialog}
          trigger={null}
          forceOpen={isInvoiceFormOpen}
          onOpenChange={setIsInvoiceFormOpen}
          onSave={handleSaveInvoice}
        />
      )}
    </>
  );
}
