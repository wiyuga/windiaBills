"use client";

import React, { useState, useEffect } from 'react';
import PageHeader from "@/components/shared/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from 'date-fns';
import { auth } from '@/lib/firebaseConfig';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '@/lib/firebaseConfig';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import type { Task } from '@/lib/types';
import type { Client, Service } from '@/lib/types';

export default function ClientTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  // Subscribe to auth state to get logged-in client ID
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(getAuth(), user => {
      if (user) {
        setClientId(user.uid);
      } else {
        setClientId(null);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Subscribe to services collection once
  useEffect(() => {
    const unsubServices = onSnapshot(collection(db, 'services'), snapshot => {
      setServices(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Service[]);
    });
    return () => unsubServices();
  }, []);

  // Load client profile when clientId available
  useEffect(() => {
    if (!clientId) return;
    const loadClient = async () => {
      const docRef = doc(db, 'clients', clientId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setClient({ id: docSnap.id, ...docSnap.data() } as Client);
      }
    };
    loadClient();
  }, [clientId]);

  // Subscribe to tasks for this client
  useEffect(() => {
    if (!clientId) return;
    const q = query(collection(db, 'tasks'), where('clientId', '==', clientId));
    const unsubTasks = onSnapshot(q, snapshot => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Task[]);
    });
    return () => unsubTasks();
  }, [clientId]);

  const getServiceName = (serviceId: string) => services.find(s => s.id === serviceId)?.name || 'N/A';

  return (
    <>
      <PageHeader 
        title="My Tasks" 
        description={`Tasks logged for ${client?.projectName || 'your projects'}.`} 
      />
      <div className="rounded-lg border shadow-sm bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-center">Hours</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length > 0 ? (
              tasks.map((task: Task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium max-w-xs truncate">{task.description}</TableCell>
                  <TableCell>{getServiceName(task.serviceId)}</TableCell>
                  <TableCell>{task.platform}</TableCell>
                  <TableCell>{format(parseISO(task.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="text-center">{Number(task.hours).toFixed(1)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={task.billed ? 'default' : 'secondary'}>
                      {task.billed ? 'Billed' : 'Unbilled'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No tasks found for your projects.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}