"use client";

import React, { useState, useEffect } from 'react';
import PageHeader from "@/components/shared/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Invoice, Task, Service, Client } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '@/lib/firebaseConfig';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export default function ClientPaymentsPage() {
  const [clientId, setClientId] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // 1. Listen for auth and set clientId
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(getAuth(), user => {
      if (user) setClientId(user.uid);
      else setClientId(null);
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Load client profile when clientId available
  useEffect(() => {
    if (!clientId) return;
    const loadClient = async () => {
      const snap = await getDoc(doc(db, 'clients', clientId));
      if (snap.exists()) setClient({ id: snap.id, ...snap.data() } as Client);
    };
    loadClient();
  }, [clientId]);

  // 3. Subscribe to paid invoices for this client
  useEffect(() => {
    if (!clientId) return;
    const q = query(
      collection(db, 'invoices'),
      where('clientId', '==', clientId),
      where('status', '==', 'paid')
    );
    const unsubscribe = onSnapshot(q, snapshot => {
      setInvoices(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Invoice[]);
    });
    return () => unsubscribe();
  }, [clientId]);

  // 4. Subscribe to tasks (for service lookup via task.serviceId)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'tasks'), snapshot => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Task[]);
    });
    return () => unsubscribe();
  }, []);

  // 5. Subscribe to services
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'services'), snapshot => {
      setServices(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Service[]);
    });
    return () => unsubscribe();
  }, []);

  const getTask = (taskId: string) => tasks.find(t => t.id === taskId);
  const getService = (serviceId: string) => services.find(s => s.id === serviceId)?.name || 'N/A';

  return (
    <>
      <PageHeader
        title="My Payment History"
        description={`Record of payments for ${client?.name || 'you'}.`}
      />
      <div className="rounded-lg border shadow-sm bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Service(s)</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead className="text-right">Amount Paid</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length > 0 ? (
              invoices.map(inv => {
                const currencySymbol = client?.currency === 'INR' ? '₹' : '$';
                const firstTask = inv.tasks[0] ? getTask(inv.tasks[0].taskId) : undefined;
                const serviceName = firstTask ? getService(firstTask.serviceId) : 'N/A';
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                    <TableCell>{client?.projectName || 'N/A'}</TableCell>
                    <TableCell>{serviceName}</TableCell>
                    <TableCell>{format(parseISO(inv.issueDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="text-right">{currencySymbol}{(inv.finalAmount ?? inv.totalAmount).toFixed(2)}</TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No payment history found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
