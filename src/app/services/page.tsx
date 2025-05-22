"use client";

import React, { useState, useEffect } from "react";
import PageHeader from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import ServiceListTable from "./components/service-list-table";
import ServiceFormDialog from "./components/service-form-dialog";
import type { Service } from "@/lib/types";
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
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function ServicesPage() {
  // debug: ensure correct Firebase project and Next.js mode
  useEffect(() => {
    console.log("Firebase project:", db.app.options.projectId);
    console.log("Running in:", process.env.NODE_ENV);
  }, []);

  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  // 1️⃣ Subscribe to 'services' in Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "services"),
      (snap) => {
        setServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
      },
      (err) => {
        console.error("❌ Error fetching services:", err);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch services." });
      }
    );
    return () => unsub();
  }, [toast]);

  // 2️⃣ Add or update a service
  async function handleSaveService(data: { name: string }, serviceId?: string) {
    try {
      if (serviceId) {
        await updateDoc(doc(db, "services", serviceId), {
          name: data.name,
          updatedAt: serverTimestamp(),
        });
        toast({ title: "Service Updated", description: `“${data.name}” updated.` });
      } else {
        await addDoc(collection(db, "services"), {
          name: data.name,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Service Added", description: `“${data.name}” added.` });
      }
    } catch (err) {
      console.error("❌ Error saving service:", err);
      toast({ variant: "destructive", title: "Save Failed", description: "Could not save service." });
    }
  }

  // 3️⃣ Delete a service
  async function confirmDeleteService() {
    if (!serviceToDelete) return;
    try {
      await deleteDoc(doc(db, "services", serviceToDelete.id));
      toast({ variant: "destructive", title: "Deleted", description: `“${serviceToDelete.name}” removed.` });
    } catch (err) {
      console.error("❌ Error deleting service:", err);
      toast({ variant: "destructive", title: "Delete Failed", description: "Could not delete service." });
    } finally {
      setServiceToDelete(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Services"
        description="Manage your service offerings."
        actions={
          <ServiceFormDialog
            trigger={
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Service
              </Button>
            }
            onSave={handleSaveService}
          />
        }
      />

      <ServiceListTable
        services={services}
        onEdit={handleSaveService}
        onDelete={(svc) => setServiceToDelete(svc)}
      />

      {serviceToDelete && (
        <AlertDialog
          open={!!serviceToDelete}
          onOpenChange={(open) => !open && setServiceToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete "{serviceToDelete.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setServiceToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={confirmDeleteService}
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
