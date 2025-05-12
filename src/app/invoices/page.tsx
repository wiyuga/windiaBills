"use client";
// Required for useState and other hooks
import React, { useState } from 'react';
import PageHeader from "@/components/shared/page-header";
// Button removed as "Create New Invoice" is removed
// import { Button } from "@/components/ui/button";
// PlusCircle removed as "Create New Invoice" is removed
// import { PlusCircle } from "lucide-react";
import { mockInvoices, mockClients, mockTasks, mockServices } from "@/lib/placeholder-data";
import InvoiceListTable from "./components/invoice-list-table";
import InvoiceFormDialog from "./components/invoice-form-dialog";
import type { Invoice, Client, Task, Service } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import type { InvoiceFormData } from './components/invoice-form-dialog'; // Import the form data type

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [tasks, setTasks] = useState<Task[]>(mockTasks); // Manage tasks state to update 'billed' status
  const clients = mockClients;
  const services = mockServices;
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Partial<Invoice> | undefined>(undefined);

  // This function might still be needed if there are other ways to open the form for a new invoice,
  // but the primary button in the header is removed.
  // const handleOpenNewInvoiceDialog = () => {
  //   setEditingInvoice(undefined); // Clear any editing invoice
  //   setIsFormOpen(true);
  // };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsFormOpen(true);
  };

  const handleSaveInvoice = (data: InvoiceFormData, invoiceId?: string) => {
    if (invoiceId) {
      console.log("Updating invoice:", invoiceId, data);
      setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { 
        ...inv, 
        ...data, 
        tasks: data.selectedTasks, // Map from selectedTasks
        issueDate: data.issueDate.toISOString(), 
        dueDate: data.dueDate.toISOString(),
        totalAmount: data.totalAmount,
        taxAmount: data.taxAmount,
        finalAmount: data.finalAmount,
       } : inv));
      toast({ title: "Invoice Updated", description: `Invoice ${data.invoiceNumber} has been updated.`});
    } else {
      const newInvoice: Invoice = {
        id: `invoice-${Date.now()}`,
        ...data,
        tasks: data.selectedTasks, // Map from selectedTasks
        issueDate: data.issueDate.toISOString(),
        dueDate: data.dueDate.toISOString(),
        clientName: clients.find(c => c.id === data.clientId)?.name || '',
        totalAmount: data.totalAmount,
        taxAmount: data.taxAmount,
        finalAmount: data.finalAmount,
      };
      console.log("Adding new invoice:", newInvoice);
      setInvoices(prev => [newInvoice, ...prev]);
      toast({ title: "Invoice Created", description: `New invoice ${newInvoice.invoiceNumber} has been created.`});
      
      // Mark tasks as billed
      const billedTaskIds = data.selectedTasks.map((t: any) => t.taskId);
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
        // Actions prop removed to hide the "Create New Invoice" button
        // actions={
        //   <Button onClick={handleOpenNewInvoiceDialog}>
        //     <PlusCircle className="mr-2 h-4 w-4" /> Create New Invoice
        //   </Button>
        // } 
      />
      <InvoiceListTable 
        invoices={invoices} 
        clients={clients} 
        tasks={tasks} 
        services={services} 
        onEditInvoice={handleEditInvoice} 
        onSaveInvoice={handleSaveInvoice} // This prop might be redundant if all saves go through the dialog on this page
      />
      {isFormOpen && (
         <InvoiceFormDialog
            invoice={editingInvoice}
            clients={clients}
            // For editing, pass all tasks of the client to re-populate selection options.
            // For new invoices, this won't be used as task selection is driven by the TasksPage flow.
            allTasksForClient={editingInvoice?.clientId ? tasks.filter(t => t.clientId === editingInvoice.clientId) : []}
            trigger={<></>} 
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
