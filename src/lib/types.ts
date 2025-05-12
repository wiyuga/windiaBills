export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  hourlyRate: number;
  createdAt: string;
}

export interface Task {
  id: string;
  clientId: string;
  clientName?: string; // For display convenience
  description: string;
  hours: number;
  date: string; // ISO string format
  billed: boolean;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName?: string; // For display convenience
  tasks: Pick<Task, 'id' | 'description' | 'hours'>[];
  totalAmount: number;
  taxAmount?: number;
  finalAmount?: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  issueDate: string; // ISO string format
  dueDate: string; // ISO string format
  razorpayLink?: string;
  notes?: string;
}
