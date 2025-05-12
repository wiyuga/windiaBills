import PageHeader from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { mockClients, mockServices } from "@/lib/placeholder-data";
import ClientListTable from "./components/client-list-table";
import ClientFormDialog from "./components/client-form-dialog";

export default function ClientsPage() {
  const clients = mockClients;
  const services = mockServices;

  // Placeholder save function
  const handleSaveClient = (data: any, clientId?: string) => {
    if (clientId) {
      console.log("Updating client:", clientId, data);
      // Find and update client in mockClients
    } else {
      console.log("Adding new client:", data);
      // Add to mockClients
    }
    // In real app, re-fetch or update state.
  };

  return (
    <>
      <PageHeader 
        title="Clients" 
        description="Manage your clients and their billing information."
        actions={
          <ClientFormDialog 
            services={services}
            trigger={<Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Client</Button>}
            onSave={handleSaveClient}
          />
        } 
      />
      <ClientListTable clients={clients} services={services} onSaveClient={handleSaveClient} />
    </>
  );
}
