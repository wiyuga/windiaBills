
"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import React, { useState, useEffect } from 'react';
import PageHeader from "@/components/shared/page-header";
import { mockClients, mockServices } from "@/lib/placeholder-data"; // Tasks will come from dataStore
import InvoiceListTable from "./components/invoice-list-table";
import InvoiceFormDialog from "./components/invoice-form-dialog";
import type { Invoice, Client, Task, Service } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import type { InvoiceFormData } from './components/invoice-form-dialog';
import { dataStore } from '@/lib/data-store';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(() => dataStore.getInvoices() as Invoice[]);
  const [tasks, setTasks] = useState<Task[]>(() => dataStore.getTasks() as Task[]); // For context in InvoiceListTable
  const clients = mockClients; // Assuming clients are static
  const services = mockServices; // Assuming services are static
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Partial<Invoice> | undefined>(undefined);

  useEffect(() => {
    const unsubscribeInvoices = dataStore.subscribeToInvoices(() => {
      setInvoices([...dataStore.getInvoices()]);
    });
    const unsubscribeTasks = dataStore.subscribeToTasks(() => {
      setTasks([...dataStore.getTasks()]);
    });
    return () => {
      unsubscribeInvoices();
      unsubscribeTasks();
    };
  }, []);

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsFormOpen(true);
  };

  const handleSaveInvoice = (data: InvoiceFormData, invoiceId?: string) => {
    if (invoiceId) {
      const clientForInvoice = clients.find(c => c.id === data.clientId);
      const updatedInvoiceData = { 
        ...data, 
        clientName: clientForInvoice?.name || data.clientName, // Ensure clientName is updated if clientId changes
        tasks: data.selectedTasks,
        issueDate: data.issueDate.toISOString(), 
        dueDate: data.dueDate.toISOString(),
        totalAmount: data.totalAmount,
        taxAmount: data.taxAmount,
        finalAmount: data.finalAmount,
       };
      dataStore.updateInvoice(invoiceId, updatedInvoiceData);
      toast({ title: "Invoice Updated", description: `Invoice ${data.invoiceNumber} has been updated.`});
    } else {
      // Invoice creation is primarily handled by TasksPage. 
      // This path should ideally not be hit if "Create New Invoice" button is removed from this page.
      console.warn("Attempted to create a new invoice from InvoicesPage. This flow is deprecated.");
      toast({ variant: "destructive", title: "Deprecated Action", description: "Please create invoices from the Tasks page."});
    }
    setIsFormOpen(false);
    setEditingInvoice(undefined);
  };


  return (
    <ProtectedRoute allowedRoles={["admin", "client"]}>
    <>
      <PageHeader 
        title="Invoices" 
        description="Manage and track client invoices."
      />
      <InvoiceListTable 
        invoices={invoices} 
        clients={clients} 
        tasks={tasks} 
        services={services} 
        onEditInvoice={handleEditInvoice} 
        onSaveInvoice={handleSaveInvoice}
      />
      {isFormOpen && editingInvoice && (
         <InvoiceFormDialog
            invoice={editingInvoice}
            clients={clients}
            allTasksForClient={editingInvoice?.clientId ? dataStore.getTasks().filter(t => t.clientId === editingInvoice.clientId) : []}
            trigger={<div />} // Empty div as trigger not used when forceOpen is true
            onSave={handleSaveInvoice}
            forceOpen={isFormOpen}
            onOpenChange={(open) => {
                setIsFormOpen(open);
                if (!open) setEditingInvoice(undefined);
            }}
        />
      )}
    </>
    </ProtectedRoute>
  );
}
