"use client"; // Required for useState and other hooks
import React, { useState } from 'react';
import PageHeader from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { mockInvoices, mockClients, mockTasks, mockServices } from "@/lib/placeholder-data";
import InvoiceListTable from "./components/invoice-list-table";
import InvoiceFormDialog from "./components/invoice-form-dialog";
import type { Invoice, Client, Task, Service } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [tasks, setTasks] = useState<Task[]>(mockTasks); // Manage tasks state to update 'billed' status
  const clients = mockClients;
  const services = mockServices;
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Partial<Invoice> | undefined>(undefined);

  const handleOpenNewInvoiceDialog = () => {
    setEditingInvoice(undefined); // Clear any editing invoice
    setIsFormOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsFormOpen(true);
  };

  const handleSaveInvoice = (data: any, invoiceId?: string) => {
    if (invoiceId) {
      console.log("Updating invoice:", invoiceId, data);
      setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, ...data, issueDate: data.issueDate.toISOString(), dueDate: data.dueDate.toISOString() } : inv));
      toast({ title: "Invoice Updated", description: `Invoice ${data.invoiceNumber} has been updated.`});
    } else {
      const newInvoice = {
        id: `invoice-${Date.now()}`,
        ...data,
        issueDate: data.issueDate.toISOString(),
        dueDate: data.dueDate.toISOString(),
        clientName: clients.find(c => c.id === data.clientId)?.name || '',
      };
      console.log("Adding new invoice:", newInvoice);
      setInvoices(prev => [newInvoice, ...prev]);
      toast({ title: "Invoice Created", description: `New invoice ${newInvoice.invoiceNumber} has been created.`});
      
      // Mark tasks as billed
      const billedTaskIds = data.tasks.map((t: any) => t.taskId);
       setTasks(prevTasks => 
        prevTasks.map(task => 
            billedTaskIds.includes(task.id) ? { ...task, billed: true } : task
        )
    );
    }
    setIsFormOpen(false);
    setEditingInvoice(undefined);
  };


  return (
    <>
      <PageHeader 
        title="Invoices" 
        description="Manage and track client invoices."
        actions={
          <Button onClick={handleOpenNewInvoiceDialog}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Invoice
          </Button>
        } 
      />
      <InvoiceListTable 
        invoices={invoices} 
        clients={clients} 
        tasks={tasks} // tasks is needed for context in InvoiceDetailsDialog potentially
        services={services} 
        onEditInvoice={handleEditInvoice} 
        onSaveInvoice={handleSaveInvoice}
      />
      {isFormOpen && (
         <InvoiceFormDialog
            invoice={editingInvoice}
            clients={clients}
            // allTasksForClient will be fetched/filtered within the dialog if not editing
            // or if creating from scratch. If editingInvoice has tasks, they are used.
            trigger={<></>} // Dialog controlled by isFormOpen
            onSave={handleSaveInvoice}
            forceOpen={isFormOpen}
            onOpenChange={(open) => {
                setIsFormOpen(open);
                if (!open) setEditingInvoice(undefined);
            }}
        />
      )}
    </>
  );
}
