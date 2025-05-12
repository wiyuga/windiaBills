import PageHeader from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { mockTasks, mockClients } from "@/lib/placeholder-data";
import TaskListTable from "./components/task-list-table";
import TaskFormDialog from "./components/task-form-dialog";

export default function TasksPage() {
  // In a real app, fetch tasks from an API
  const tasks = mockTasks;
  const clients = mockClients; // Needed for the form

  return (
    <>
      <PageHeader 
        title="Tasks" 
        description="Log and manage tasks performed for your clients."
        actions={
          <TaskFormDialog
            clients={clients}
            trigger={<Button><PlusCircle className="mr-2 h-4 w-4" /> Log New Task</Button>}
          />
        } 
      />
      <TaskListTable tasks={tasks} clients={clients} />
    </>
  );
}
