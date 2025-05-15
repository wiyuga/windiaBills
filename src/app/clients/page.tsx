"use client";
// tsx - This comment indicates the file type for specific tooling or conventions.
import React, { useEffect, useState } from 'react';
import PageHeader from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import ClientListTable from "./components/client-list-table";
import ClientFormDialog from "./components/client-form-dialog";
import type { Client, Service } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, updateDoc, doc, onSnapshot, deleteDoc } from "firebase/firestore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ClientsPage() {
  const [currentClients, setCurrentClients] = useState<Client[]>([]);
  const [currentServices, setCurrentServices] = useState<Service[]>([]);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
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
      const clientData = {
        ...data,
        hourlyRate: Number(data.hourlyRate), // Ensure hourlyRate is a number
        createdAt: clientId ? currentClients.find(c => c.id === clientId)?.createdAt : new Date().toISOString(), // Preserve or set createdAt
      };

      if (clientId) {
        // Update existing client
        const clientRef = doc(db, "clients", clientId);
        await updateDoc(clientRef, clientData);
        toast({ title: "Client Updated", description: `Client "${data.name}" has been updated.` });
      } else {
        // Add new client
        const docRef = await addDoc(collection(db, "clients"), clientData);
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

  const handleDeleteClient = async () => {
    if (clientToDelete) {
      try {
        await deleteDoc(doc(db, "clients", clientToDelete.id));
        toast({ variant: "destructive", title: "Client Deleted", description: `Client "${clientToDelete.name}" has been deleted.` });
      } catch (error) {
        console.error("Error deleting client:", error);
        toast({ variant: "destructive", title: "Delete Failed", description: "Could not delete client." });
      } finally {
        setClientToDelete(null);
      }
    }
  };


  return (
      <>
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
        <ClientListTable 
          clients={currentClients} 
          services={currentServices} 
          onSaveClient={handleSaveClient} 
          onDeleteClient={(client) => setClientToDelete(client)}
        />
        {clientToDelete && (
          <AlertDialog open={!!clientToDelete} onOpenChange={(open: boolean) => !open && setClientToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete "{clientToDelete.name}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the client and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setClientToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteClient} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </>
  );
}
