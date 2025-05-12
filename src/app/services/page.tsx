import PageHeader from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { mockServices } from "@/lib/placeholder-data";
import ServiceListTable from "./components/service-list-table";
import ServiceFormDialog from "./components/service-form-dialog";

export default function ServicesPage() {
  // In a real app, fetch services from an API
  const services = mockServices;

  // Placeholder for onSave - in real app this would interact with backend
  const handleSaveService = (data: { name: string }) => {
    console.log("Saving service:", data);
    // Example: mockServices.push({ id: `service-${Date.now()}`, ...data });
    // Re-fetch or update state to reflect changes
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
      <ServiceListTable services={services} onEdit={handleSaveService} />
    </>
  );
}
