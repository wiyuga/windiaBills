"use client";
import React, { useState, useEffect } from 'react';
import PageHeader from "@/components/shared/page-header";
import InvoiceListTable from "./components/invoice-list-table";
import InvoiceFormDialog from "./components/invoice-form-dialog";
import type { Invoice, Client, Task, Service } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
// Import FormData type (renamed) instead of InvoiceFormData
import type { FormData as InvoiceFormData } from './components/invoice-form-dialog';
import ProtectedRoute from "@/components/ProtectedRoute";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { format, parseISO } from 'date-fns';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Partial<Invoice> | undefined>(undefined);

  useEffect(() => {
    const fetchData = async () => {
      const [invSnap, taskSnap, clientSnap, serviceSnap] = await Promise.all([
        getDocs(collection(db, "invoices")),
        getDocs(collection(db, "tasks")),
        getDocs(collection(db, "clients")),
        getDocs(collection(db, "services")),
      ]);
      setInvoices(invSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Invoice[]);
      setTasks(taskSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Task[]);
      setClients(clientSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Client[]);
      setServices(serviceSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Service[]);
    };
    fetchData();
  }, []);

  const handleEditInvoice = (inv: Invoice) => {
    setEditingInvoice(inv);
    setIsFormOpen(true);
  };

  const handleSaveInvoice = async (data: InvoiceFormData, invoiceId?: string) => {
    try {
      if (invoiceId) {
        await updateDoc(doc(db, "invoices", invoiceId), {
          ...data,
          issueDate: data.issueDate.toISOString(),
          dueDate: data.dueDate.toISOString()
        });
        toast({ title: "Invoice Updated", description: `Invoice ${data.invoiceNumber} updated.` });
      }
      // refresh list
      const invSnap = await getDocs(collection(db, "invoices"));
      setInvoices(invSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Invoice[]);
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not update invoice." });
    } finally {
      setIsFormOpen(false);
      setEditingInvoice(undefined);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "client"]}>
      
      <PageHeader title="Invoices" description="Manage and track client invoices." />
      <InvoiceListTable
        invoices={invoices}
        clients={clients}
        tasks={tasks}
        services={services}
        onEditInvoice={handleEditInvoice}
      />
      {isFormOpen && editingInvoice && (
        <InvoiceFormDialog
          invoice={editingInvoice}
          clients={clients}
          allTasksForClient={tasks.filter(t => t.clientId === editingInvoice.clientId)}
          trigger={null}
          forceOpen={isFormOpen}
          onOpenChange={(open) => setIsFormOpen(open)}
          onSave={handleSaveInvoice}
        />
       
      )}
    </ProtectedRoute>
  );
}
