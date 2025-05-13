"use client";
import React, { useEffect, useState } from 'react';
import PageHeader from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import ClientListTable from "./components/client-list-table";
import ClientFormDialog from "./components/client-form-dialog";
import type { Client, Service } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export default function ClientsPage() {
  const [currentClients, setCurrentClients] = useState<Client[]>([]);
  const [currentServices, setCurrentServices] = useState<Service[]>([]);
  const { toast } = useToast();

  // Fetch clients from Firestore
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "clients"));
        const clientsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Client[];
        setCurrentClients(clientsData);
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };

    const fetchServices = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "services"));
        const servicesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Service[];
        setCurrentServices(servicesData);
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };

    fetchClients();
    fetchServices();
  }, []);

  const handleSaveClient = (data: Omit<Client, 'id' | 'createdAt'>, clientId?: string) => {
    if (clientId) {
      setCurrentClients(prevClients =>
        prevClients.map(client =>
          client.id === clientId ? { ...client, ...data, id: clientId, createdAt: client.createdAt } : client
        )
      );
      toast({ title: "Client Updated", description: `Client "${data.name}" has been updated.` });
    } else {
      const newClient: Client = {
        id: `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ...data,
        createdAt: new Date().toISOString(),
      };
      setCurrentClients(prevClients => [newClient, ...prevClients]);
      toast({ title: "Client Added", description: `Client "${data.name}" has been added.` });
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "client"]}>
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
    </ProtectedRoute>
  );
}
