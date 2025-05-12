import PageHeader from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { mockClients } from "@/lib/placeholder-data";
import ClientListTable from "./components/client-list-table";
import ClientFormDialog from "./components/client-form-dialog";

export default function ClientsPage() {
  // In a real app, fetch clients from an API
  const clients = mockClients;

  return (
    <>
      <PageHeader 
        title="Clients" 
        description="Manage your clients and their billing information."
        actions={
          <ClientFormDialog 
            trigger={<Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Client</Button>}
          />
        } 
      />
      <ClientListTable clients={clients} />
    </>
  );
}
