"use client";

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Client } from '@/lib/types';

interface TaskFiltersProps {
  clients: Client[];
  projects: { id: string, name: string }[]; // Assuming projects have id and name
  selectedClient: string;
  onClientChange: (clientId: string) => void;
  selectedProject: string;
  onProjectChange: (projectId: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
}

export default function TaskFilters({
  clients,
  projects,
  selectedClient,
  onClientChange,
  selectedProject,
  onProjectChange,
  selectedStatus,
  onStatusChange
}: TaskFiltersProps) {
  return (
    <div className="mb-4 p-4 border rounded-lg bg-card shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
        <div>
          <Label htmlFor="clientFilter" className="text-sm font-medium">Client</Label>
          <Select value={selectedClient} onValueChange={onClientChange}>
            <SelectTrigger id="clientFilter">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="projectFilter" className="text-sm font-medium">Project</Label>
          <Select value={selectedProject} onValueChange={onProjectChange} disabled={!projects.length && selectedClient === 'all'}>
            <SelectTrigger id="projectFilter">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="statusFilter" className="text-sm font-medium">Status</Label>
          {/* Corrected prop from onStatusChange to onValueChange */}
          <Select value={selectedStatus} onValueChange={onStatusChange}>
            <SelectTrigger id="statusFilter">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="billed">Billed</SelectItem>
              <SelectItem value="unbilled">Unbilled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
