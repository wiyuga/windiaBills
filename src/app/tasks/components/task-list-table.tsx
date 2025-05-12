"use client";
import React, { useState, useMemo } from 'react';
import type { Task, Client, Service } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilePenLine, Trash2, FilePlus2 } from "lucide-react";
import TaskFormDialog from "./task-form-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from 'date-fns';
import TaskFilters from './task-filters'; // Import the new filter component
import { useRouter } from 'next/navigation'; // For redirecting to invoice creation

interface TaskListTableProps {
  tasks: Task[];
  clients: Client[];
  services: Service[];
  onSaveTask: (data: any, taskId?: string) => void; // Placeholder
  onCreateInvoice: (selectedTasks: Task[]) => void; // Callback for creating invoice
}

export default function TaskListTable({ tasks, clients, services, onSaveTask, onCreateInvoice }: TaskListTableProps) {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all'); // Project name from Client
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const router = useRouter();

  const getClientName = (clientId: string) => clients.find(c => c.id === clientId)?.name || 'N/A';
  const getProjectName = (clientId: string) => clients.find(c => c.id === clientId)?.projectName || 'N/A';
  const getServiceName = (serviceId: string) => services.find(s => s.id === serviceId)?.name || 'N/A';
  
  const projectsForFilter = useMemo(() => {
    if (filterClient === 'all') {
      return clients.map(c => ({ id: c.projectName, name: c.projectName })); // Use projectName as id for simplicity
    }
    const client = clients.find(c => c.id === filterClient);
    return client ? [{ id: client.projectName, name: client.projectName }] : [];
  }, [clients, filterClient]);


  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const clientMatch = filterClient === 'all' || task.clientId === filterClient;
      const clientForProjectFilter = clients.find(c => c.id === task.clientId);
      const projectMatch = filterProject === 'all' || (clientForProjectFilter && clientForProjectFilter.projectName === filterProject);
      const statusMatch = filterStatus === 'all' || (filterStatus === 'billed' && task.billed) || (filterStatus === 'unbilled' && !task.billed);
      return clientMatch && projectMatch && statusMatch;
    });
  }, [tasks, clients, filterClient, filterProject, filterStatus]);


  const handleSelectTask = (taskId: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSelectAllTasks = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedTasks(filteredTasks.filter(t => !t.billed).map(task => task.id));
    } else {
      setSelectedTasks([]);
    }
  };
  
  const isAllUnbilledSelected = useMemo(() => {
    const unbilledTasks = filteredTasks.filter(t => !t.billed);
    if (unbilledTasks.length === 0) return false;
    return unbilledTasks.every(task => selectedTasks.includes(task.id));
  }, [filteredTasks, selectedTasks]);

  const isSomeUnbilledSelected = useMemo(() => {
     const unbilledTasks = filteredTasks.filter(t => !t.billed);
    return unbilledTasks.some(task => selectedTasks.includes(task.id)) && !isAllUnbilledSelected;
  }, [filteredTasks, selectedTasks, isAllUnbilledSelected]);


  const canCreateInvoice = useMemo(() => {
    if (selectedTasks.length === 0) return false;
    const tasksToInvoice = tasks.filter(task => selectedTasks.includes(task.id) && !task.billed);
    if (tasksToInvoice.length === 0) return false;
    // Check if all selected unbilled tasks belong to the same client
    const clientIds = new Set(tasksToInvoice.map(task => task.clientId));
    return clientIds.size === 1;
  }, [selectedTasks, tasks]);

  const handleCreateInvoiceClick = () => {
    const tasksToInvoice = tasks.filter(task => selectedTasks.includes(task.id) && !task.billed);
    if (canCreateInvoice && tasksToInvoice.length > 0) {
      onCreateInvoice(tasksToInvoice);
      // In a real app, you might redirect to an invoice creation page or open a modal.
      // For now, we'll just call the callback.
      // Example of redirecting (if InvoiceFormDialog was on a separate page):
      // const clientForInvoice = clients.find(c => c.id === tasksToInvoice[0].clientId);
      // router.push(`/invoices/new?clientId=${clientForInvoice?.id}&taskIds=${tasksToInvoice.map(t => t.id).join(',')}`);
      setSelectedTasks([]); // Clear selection after initiating invoice creation
    } else if (selectedTasks.length > 0 && !canCreateInvoice) {
        alert("Please select unbilled tasks from the same client to create an invoice.");
    }
  };


  return (
    <>
      <TaskFilters
        clients={clients}
        projects={projectsForFilter}
        selectedClient={filterClient}
        onClientChange={(value) => { setFilterClient(value); setFilterProject('all'); setSelectedTasks([]); }}
        selectedProject={filterProject}
        onProjectChange={(value) => { setFilterProject(value); setSelectedTasks([]); }}
        selectedStatus={filterStatus}
        onStatusChange={(value) => { setFilterStatus(value); setSelectedTasks([]); }}
      />
      {selectedTasks.length > 0 && (
        <div className="mb-4 flex justify-end">
          <Button onClick={handleCreateInvoiceClick} disabled={!canCreateInvoice}>
            <FilePlus2 className="mr-2 h-4 w-4" /> Create Invoice ({selectedTasks.filter(taskId => !tasks.find(t=>t.id === taskId)?.billed).length} tasks)
          </Button>
        </div>
      )}
      <div className="rounded-lg border shadow-sm bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                 <Checkbox
                  checked={isAllUnbilledSelected}
                  onCheckedChange={handleSelectAllTasks}
                  aria-label="Select all unbilled tasks"
                  disabled={filteredTasks.filter(t => !t.billed).length === 0}
                />
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-center">Hours</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.map((task) => (
              <TableRow key={task.id} data-state={selectedTasks.includes(task.id) ? "selected" : ""}>
                <TableCell>
                  <Checkbox
                    checked={selectedTasks.includes(task.id)}
                    onCheckedChange={() => handleSelectTask(task.id)}
                    aria-labelledby={`task-desc-${task.id}`}
                    disabled={task.billed}
                  />
                </TableCell>
                <TableCell id={`task-desc-${task.id}`} className="font-medium max-w-xs truncate">{task.description}</TableCell>
                <TableCell>{getClientName(task.clientId)}</TableCell>
                <TableCell>{getProjectName(task.clientId)}</TableCell>
                <TableCell>{getServiceName(task.serviceId)}</TableCell>
                <TableCell>{task.platform}</TableCell>
                <TableCell>{format(new Date(task.date), 'MMM dd, yyyy')}</TableCell>
                <TableCell className="text-center">{task.hours.toFixed(1)}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={task.billed ? "default" : "secondary"}>
                    {task.billed ? "Billed" : "Unbilled"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <TaskFormDialog
                    task={task}
                    clients={clients}
                    services={services}
                    trigger={
                      <Button variant="ghost" size="icon" className="mr-2">
                        <FilePenLine className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    }
                    onSave={onSaveTask}
                  />
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredTasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground">
                  No tasks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
