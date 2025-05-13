"use client";

import React, { useState, useEffect } from 'react';
import PageHeader from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
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
import { db } from '@/lib/firebaseConfig';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

export default function ServicesPage() {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  // Subscribe to services collection
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'services'), (snapshot) => {
      setServices(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
    }, (error) => {
        console.error("Error fetching services with onSnapshot:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch services." });
    });
    return () => unsub();
  }, [toast]);

  // Save or update a service
  const handleSaveService = async (data: { name: string }, serviceId?: string) => {
    try {
      if (serviceId) {
        await updateDoc(doc(db, 'services', serviceId), {
          ...data,
          updatedAt: serverTimestamp() 
        });
        toast({ title: 'Service Updated', description: `Service "${data.name}" has been updated.` });
      } else {
        await addDoc(collection(db, 'services'), { 
          ...data,
          createdAt: serverTimestamp()
        });
        toast({ title: 'Service Added', description: `Service "${data.name}" has been added.` });
      }
      // Local state updated by onSnapshot
    } catch (error) {
      console.error('Error saving service:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save service.' });
    }
  };

  // Confirm deletion of a service
  const confirmDeleteService = async () => {
    if (serviceToDelete) {
      try {
        await deleteDoc(doc(db, 'services', serviceToDelete.id));
        toast({ variant: 'destructive', title: 'Service Deleted', description: `Service "${serviceToDelete.name}" has been deleted.` });
         // Local state updated by onSnapshot
      } catch (error) {
        console.error('Error deleting service:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete service.' });
      } finally {
        setServiceToDelete(null);
      }
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
        onDelete={(service) => setServiceToDelete(service)} 
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
              <AlertDialogAction onClick={confirmDeleteService} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
