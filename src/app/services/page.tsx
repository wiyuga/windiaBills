"use client";

import React, { useState } from 'react';
import PageHeader from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import { mockServices as initialMockServices } from "@/lib/placeholder-data";
import ServiceListTable from "./components/service-list-table";
import ServiceFormDialog from "./components/service-form-dialog";
import type { Service } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>(initialMockServices);
  const { toast } = useToast();
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  const handleSaveService = (data: { name: string }, serviceId?: string) => {
    if (serviceId) {
      setServices(prevServices =>
        prevServices.map(s => (s.id === serviceId ? { ...s, ...data } : s))
      );
      toast({ title: "Service Updated", description: `Service "${data.name}" has been updated.` });
    } else {
      const newService: Service = { id: `service-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, ...data };
      setServices(prevServices => [newService, ...prevServices]);
      toast({ title: "Service Added", description: `Service "${data.name}" has been added.` });
    }
  };

  const openDeleteDialog = (service: Service) => {
    setServiceToDelete(service);
  };

  const confirmDeleteService = () => {
    if (serviceToDelete) {
      setServices(prevServices => prevServices.filter(s => s.id !== serviceToDelete.id));
      toast({ title: "Service Deleted", description: `Service "${serviceToDelete.name}" has been deleted.`, variant: "destructive" });
      setServiceToDelete(null);
    }
  };

  return (
    <>
      <PageHeader 
        title="Services" 
        description="Manage the services you offer to clients."
        actions={
          <ServiceFormDialog 
            trigger={<Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Service</Button>}
            onSave={handleSaveService}
          />
        } 
      />
      <ServiceListTable 
        services={services} 
        onEdit={handleSaveService}
        onDelete={openDeleteDialog} 
      />

      {serviceToDelete && (
        <AlertDialog open={!!serviceToDelete} onOpenChange={(open) => !open && setServiceToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete "{serviceToDelete.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the service.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setServiceToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteService}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
