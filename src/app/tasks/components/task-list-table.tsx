"use client";
import type { Task, Client } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilePenLine, Trash2 } from "lucide-react";
import TaskFormDialog from "./task-form-dialog";
import { format } from 'date-fns';

interface TaskListTableProps {
  tasks: Task[];
  clients: Client[]; // For passing to edit dialog
}

export default function TaskListTable({ tasks, clients }: TaskListTableProps) {
  return (
    <div className="rounded-lg border shadow-sm bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-center">Hours</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium max-w-xs truncate">{task.description}</TableCell>
              <TableCell>{task.clientName || clients.find(c => c.id === task.clientId)?.name || 'N/A'}</TableCell>
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
                  trigger={
                    <Button variant="ghost" size="icon" className="mr-2">
                      <FilePenLine className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  }
                 />
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                   <span className="sr-only">Delete</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
