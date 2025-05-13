export interface Client {
  id: string;
  name: string;
  owner: string; // New
  country: string; // New
  mobile?: string; // Kept as optional, was phone
  email: string;
  hourlyRate: number;
  address?: string;
  createdAt: string; // Represents "Joined On"
  status: 'active' | 'inactive'; // New
  projectName: string; // New
  serviceIds: string[]; // New, for multiple services
  currency: 'USD' | 'INR'; // New
}

export interface Service {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  clientId: string;
  clientName?: string; // For display convenience
  description: string;
  hours: number;
  date: string; // ISO string format
  billed: boolean;
  serviceId: string; // New
  platform: 'Mobile' | 'Web' | 'Other'; // New
}

export interface InvoiceTaskItem { // For invoice schema, representing selected tasks
  taskId: string;
  description: string;
  hours: number;
  // Rate will be derived from client
}

export interface Invoice {
  id:string;
  invoiceNumber: string;
  clientId: string;
  clientName?: string; // For display convenience
  tasks: InvoiceTaskItem[]; // Updated to reflect selected tasks
  totalAmount: number; // Sub-total before tax
  taxAmount?: number;
  finalAmount?: number; // Total after tax
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  issueDate: string; // ISO string format
  dueDate: string; // ISO string format
  razorpayLink?: string;
  notes?: string;
}
