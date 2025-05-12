"use client";
import PageHeader from "@/components/shared/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mockTasks, mockClients, mockServices } from "@/lib/placeholder-data";
import type { Task } from "@/lib/types";
import { format } from 'date-fns';

// SIMULATE LOGGED IN CLIENT
const LOGGED_IN_CLIENT_ID = mockClients[0].id; // Innovate LLC

export default function ClientTasksPage() {
  const clientTasks = mockTasks.filter(task => task.clientId === LOGGED_IN_CLIENT_ID);
  const client = mockClients.find(c => c.id === LOGGED_IN_CLIENT_ID);

  const getServiceName = (serviceId: string) => mockServices.find(s => s.id === serviceId)?.name || 'N/A';

  return (
    <>
      <PageHeader 
        title="My Tasks" 
        description={`Tasks logged for ${client?.projectName || 'your projects'}.`}
      />
      <div className="rounded-lg border shadow-sm bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-center">Hours</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientTasks.map((task: Task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium max-w-xs truncate">{task.description}</TableCell>
                <TableCell>{getServiceName(task.serviceId)}</TableCell>
                <TableCell>{task.platform}</TableCell>
                <TableCell>{format(new Date(task.date), 'MMM dd, yyyy')}</TableCell>
                <TableCell className="text-center">{task.hours.toFixed(1)}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={task.billed ? "default" : "secondary"}>
                    {task.billed ? "Billed" : "Unbilled"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {clientTasks.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">No tasks found for your projects.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
