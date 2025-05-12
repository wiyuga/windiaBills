"use client";
import type { Client, Service } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FilePenLine, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ClientFormDialog from "./client-form-dialog";
import { format } from 'date-fns';

interface ClientListTableProps {
  clients: Client[];
  services: Service[]; // To pass to dialog for service selection
  onSaveClient: (data: any, clientId?: string) => void; // Placeholder for save
}

export default function ClientListTable({ clients, services, onSaveClient }: ClientListTableProps) {
  
  const getServiceName = (serviceId: string) => services.find(s => s.id === serviceId)?.name || 'N/A';

  return (
    <div className="rounded-lg border shadow-sm bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client Name</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Mobile</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Hourly Rate</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Services</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined On</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium">{client.name}</TableCell>
              <TableCell>{client.owner}</TableCell>
              <TableCell>{client.email}</TableCell>
              <TableCell>{client.mobile || '-'}</TableCell>
              <TableCell>{client.country}</TableCell>
              <TableCell>{client.hourlyRate.toFixed(2)}</TableCell>
              <TableCell>{client.currency}</TableCell>
              <TableCell>{client.projectName}</TableCell>
              <TableCell>{client.serviceIds.map(id => getServiceName(id)).join(', ')}</TableCell>
              <TableCell>
                <Badge variant={client.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                  {client.status}
                </Badge>
              </TableCell>
              <TableCell>{format(new Date(client.createdAt), 'MMM dd, yyyy')}</TableCell>
              <TableCell className="text-right">
                <ClientFormDialog
                  client={client}
                  services={services}
                  trigger={
                    <Button variant="ghost" size="icon" className="mr-2">
                      <FilePenLine className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  }
                  onSave={onSaveClient}
                 />
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
           {clients.length === 0 && (
            <TableRow>
              <TableCell colSpan={12} className="text-center text-muted-foreground">
                No clients found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
