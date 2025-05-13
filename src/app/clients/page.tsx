tsx
"use client";
import React, { useEffect, useState } from 'react';
import PageHeader from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import ClientListTable from "./components/client-list-table";
import ClientFormDialog from "./components/client-form-dialog";
import type { Client, Service } from '@/lib/types';
import type { ClientFormData } from './components/client-form-dialog';
import { useToast } from "@/hooks/use-toast";
// import ProtectedRoute from "@/components/ProtectedRoute"; // ProtectedRoute can be added back if auth roles are fully implemented
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, updateDoc, doc, onSnapshot, serverTimestamp } from "firebase/firestore";

export default function ClientsPage() {
  const [currentClients, setCurrentClients] = useState<Client[]>([]);
  const [currentServices, setCurrentServices] = useState<Service[]>([]);
  const { toast } = useToast();

  // Fetch clients and services from Firestore using onSnapshot for real-time updates
  useEffect(() => {
    const unsubClients = onSnapshot(collection(db, "clients"), (querySnapshot) => {
      const clientsData = querySnapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      })) as Client[];
      setCurrentClients(clientsData);
    }, (error) => {
      console.error("Error fetching clients with onSnapshot:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch clients." });
    });

    const unsubServices = onSnapshot(collection(db, "services"), (querySnapshot) => {
      const servicesData = querySnapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      })) as Service[];
      setCurrentServices(servicesData);
    }, (error) => {
      console.error("Error fetching services with onSnapshot:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch services." });
    });
    
    return () => {
      unsubClients();
      unsubServices();
    };
  }, [toast]);

  const handleSaveClient = async (data: ClientFormData, clientId?: string) => {
    try {
      if (clientId) {
        // Update existing client
        const clientRef = doc(db, "clients", clientId);
        await updateDoc(clientRef, {
          ...data,
          // Ensure hourlyRate is stored as a number if not already by zod
          hourlyRate: Number(data.hourlyRate), 
        });
        toast({ title: "Client Updated", description: `Client "${data.name}" has been updated.` });
      } else {
        // Add new client
        const docRef = await addDoc(collection(db, "clients"), {
          ...data,
          hourlyRate: Number(data.hourlyRate),
          createdAt: new Date().toISOString(), // Store as ISO string
        });
        toast({ title: "Client Added", description: `Client "${data.name}" has been added.` });

        // Placeholder for sending onboarding email logic if `data.email` exists
        if (data.email) {
          console.log(`Placeholder: Trigger onboarding flow for new client ${data.email} with ID ${docRef.id}`);
          // Further implementation for auth user creation and email sending would go here.
        }
      }
      // No need to manually update local state, onSnapshot will handle it.
    } catch (error) {
      console.error("Error saving client:", error);
      toast({ variant: "destructive", title: "Save Failed", description: "Could not save client details." });
    }
  };

  return (
    //<ProtectedRoute allowedRoles={["admin", "client"]}>
      <div>
        <PageHeader 
          title="Clients" 
          description="Manage your clients and their billing information."
          actions={
            <ClientFormDialog 
              services={currentServices}
              trigger={<Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Client</Button>}
              onSave={handleSaveClient}
            />
          } 
        />
        <ClientListTable clients={currentClients} services={currentServices} onSaveClient={handleSaveClient} />
      </div>
    // </ProtectedRoute>
  );
}
