import type { Client, Task, Invoice } from './types';

export const mockClients: Client[] = [
  { id: 'client-1', name: 'Innovate LLC', email: 'contact@innovate.com', hourlyRate: 75, address: '123 Tech Park, Silicon Valley, CA', createdAt: new Date().toISOString() },
  { id: 'client-2', name: 'Synergy Corp', email: 'info@synergy.io', hourlyRate: 90, phone: '555-1234', createdAt: new Date(Date.now() - 1000*60*60*24*10).toISOString() },
  { id: 'client-3', name: 'Momentum Solutions', email: 'support@momentum.dev', hourlyRate: 60, address: '456 Innovation Dr, Austin, TX', createdAt: new Date(Date.now() - 1000*60*60*24*20).toISOString() },
];

export const mockTasks: Task[] = [
  { id: 'task-1', clientId: 'client-1', clientName: 'Innovate LLC', description: 'Server setup and configuration', hours: 5, date: new Date(Date.now() - 1000*60*60*24*2).toISOString(), billed: false },
  { id: 'task-2', clientId: 'client-1', clientName: 'Innovate LLC', description: 'Database migration', hours: 8, date: new Date(Date.now() - 1000*60*60*24*1).toISOString(), billed: false },
  { id: 'task-3', clientId: 'client-2', clientName: 'Synergy Corp', description: 'CI/CD pipeline implementation', hours: 12, date: new Date(Date.now() - 1000*60*60*24*5).toISOString(), billed: true },
  { id: 'task-4', clientId: 'client-3', clientName: 'Momentum Solutions', description: 'Monthly server maintenance', hours: 3, date: new Date(Date.now() - 1000*60*60*24*3).toISOString(), billed: false },
];

export const mockInvoices: Invoice[] = [
  { 
    id: 'invoice-1', 
    invoiceNumber: 'INV-2024-001',
    clientId: 'client-2', 
    clientName: 'Synergy Corp',
    tasks: [{ id: 'task-3', description: 'CI/CD pipeline implementation', hours: 12 }],
    totalAmount: 1080, // 12 * 90
    taxAmount: 108, // 10% tax
    finalAmount: 1188,
    status: 'paid', 
    issueDate: new Date(Date.now() - 1000*60*60*24*30).toISOString(), 
    dueDate: new Date(Date.now() - 1000*60*60*24*15).toISOString(),
    razorpayLink: 'https://rzp.io/i/mockpaymentlink1'
  },
  { 
    id: 'invoice-2', 
    invoiceNumber: 'INV-2024-002',
    clientId: 'client-1', 
    clientName: 'Innovate LLC',
    tasks: [
      { id: 'task-1', description: 'Server setup and configuration', hours: 5 },
      { id: 'task-2', description: 'Database migration', hours: 8 }
    ],
    totalAmount: 975, // (5+8) * 75
    taxAmount: 97.50,
    finalAmount: 1072.50,
    status: 'sent', 
    issueDate: new Date().toISOString(), 
    dueDate: new Date(Date.now() + 1000*60*60*24*14).toISOString(),
    notes: "Please pay by the due date."
  },
];
