import PageHeader from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { mockInvoices, mockClients, mockTasks } from "@/lib/placeholder-data";
import InvoiceListTable from "./components/invoice-list-table";
import InvoiceFormDialog from "./components/invoice-form-dialog";

export default function InvoicesPage() {
  const invoices = mockInvoices;
  const clients = mockClients;
  const tasks = mockTasks;

  return (
    <>
      <PageHeader 
        title="Invoices" 
        description="Manage and track client invoices."
        actions={
          <InvoiceFormDialog 
            clients={clients}
            tasks={tasks}
            trigger={<Button><PlusCircle className="mr-2 h-4 w-4" /> Create New Invoice</Button>}
          />
        } 
      />
      <InvoiceListTable invoices={invoices} clients={clients} tasks={tasks} />
    </>
  );
}
