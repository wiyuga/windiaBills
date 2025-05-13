"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import React, { useState } from 'react';
import PageHeader from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { mockClients, mockServices } from "@/lib/placeholder-data";
import ClientListTable from "./components/client-list-table";
import ClientFormDialog from "./components/client-form-dialog";
import type { Client, Service } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

export default function ClientsPage() {
  const [currentClients, setCurrentClients] = useState<Client[]>(mockClients);
  const currentServices = mockServices; // Services are static for now
  const { toast } = useToast();

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
      <ClientListTable clients={currentClients} services={currentServices} onSaveClient={handleSaveClient} />
    </>
    </ProtectedRoute>

  );
}
