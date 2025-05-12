"use client";
import type { Client } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, FilePenLine, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ClientFormDialog from "./client-form-dialog";
import { format } from 'date-fns';

interface ClientListTableProps {
  clients: Client[];
}

export default function ClientListTable({ clients }: ClientListTableProps) {
  return (
    <div className="rounded-lg border shadow-sm bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Hourly Rate</TableHead>
            <TableHead>Joined On</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium">{client.name}</TableCell>
              <TableCell>{client.email}</TableCell>
              <TableCell>${client.hourlyRate.toFixed(2)}</TableCell>
              <TableCell>{format(new Date(client.createdAt), 'MMM dd, yyyy')}</TableCell>
              <TableCell className="text-right">
                <ClientFormDialog
                  client={client}
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
