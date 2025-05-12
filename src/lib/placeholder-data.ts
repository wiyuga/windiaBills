import type { Client, Task, Invoice, Service } from './types';

export const mockServices: Service[] = [
  { id: 'service-1', name: 'Payroll' },
  { id: 'service-2', name: 'Consulting' },
  { id: 'service-3', name: 'DevOps' },
  { id: 'service-4', name: 'Development' },
  { id: 'service-5', name: 'Testing' },
];

export const mockClients: Client[] = [
  { 
    id: 'client-1', 
    name: 'Innovate LLC', 
    owner: 'Alice Wonderland',
    country: 'USA',
    mobile: '555-0001',
    email: 'contact@innovate.com', 
    hourlyRate: 75, 
    createdAt: new Date().toISOString(),
    status: 'active',
    projectName: 'Alpha Project',
    serviceIds: [mockServices[1].id, mockServices[3].id], // Consulting, Development
    currency: 'USD',
  },
  { 
    id: 'client-2', 
    name: 'Synergy Corp', 
    owner: 'Bob The Builder',
    country: 'Canada',
    mobile: '555-1234',
    email: 'info@synergy.io', 
    hourlyRate: 90, 
    createdAt: new Date(Date.now() - 1000*60*60*24*10).toISOString(),
    status: 'active',
    projectName: 'Beta Platform',
    serviceIds: [mockServices[2].id], // DevOps
    currency: 'USD',
  },
  { 
    id: 'client-3', 
    name: 'Momentum Solutions', 
    owner: 'Charlie Brown',
    country: 'India',
    mobile: '555-5678',
    email: 'support@momentum.dev', 
    hourlyRate: 6000, 
    createdAt: new Date(Date.now() - 1000*60*60*24*20).toISOString(),
    status: 'inactive',
    projectName: 'Gamma Initiative',
    serviceIds: [mockServices[0].id], // Payroll
    currency: 'INR',
  },
];

export const mockTasks: Task[] = [
  { 
    id: 'task-1', 
    clientId: 'client-1', 
    clientName: 'Innovate LLC', 
    description: 'Server setup and configuration', 
    hours: 5, 
    date: new Date(Date.now() - 1000*60*60*24*2).toISOString(), 
    billed: false,
    serviceId: mockServices[3].id, // Development
    platform: 'Web',
  },
  { 
    id: 'task-2', 
    clientId: 'client-1', 
    clientName: 'Innovate LLC', 
    description: 'Database migration', 
    hours: 8, 
    date: new Date(Date.now() - 1000*60*60*24*1).toISOString(), 
    billed: false,
    serviceId: mockServices[3].id, // Development
    platform: 'Web',
  },
  { 
    id: 'task-3', 
    clientId: 'client-2', 
    clientName: 'Synergy Corp', 
    description: 'CI/CD pipeline implementation', 
    hours: 12, 
    date: new Date(Date.now() - 1000*60*60*24*5).toISOString(), 
    billed: true,
    serviceId: mockServices[2].id, // DevOps
    platform: 'Other',
  },
  { 
    id: 'task-4', 
    clientId: 'client-3', 
    clientName: 'Momentum Solutions', 
    description: 'Monthly server maintenance', 
    hours: 3, 
    date: new Date(Date.now() - 1000*60*60*24*3).toISOString(), 
    billed: false,
    serviceId: mockServices[0].id, // Payroll
    platform: 'Web',
  },
   { 
    id: 'task-5', 
    clientId: 'client-1', 
    clientName: 'Innovate LLC', 
    description: 'Frontend component library setup', 
    hours: 10, 
    date: new Date(Date.now() - 1000*60*60*24*4).toISOString(), 
    billed: false,
    serviceId: mockServices[1].id, // Consulting
    platform: 'Mobile',
  },
];

export const mockInvoices: Invoice[] = [
  { 
    id: 'invoice-1', 
    invoiceNumber: 'INV-2024-001',
    clientId: 'client-2', 
    clientName: 'Synergy Corp',
    tasks: [{ taskId: 'task-3', description: 'CI/CD pipeline implementation', hours: 12 }],
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
      { taskId: 'task-1', description: 'Server setup and configuration', hours: 5 },
    ],
    totalAmount: 375, // 5 * 75 (assuming only task-1 was part of this old invoice)
    taxAmount: 37.50,
    finalAmount: 412.50,
    status: 'sent', 
    issueDate: new Date(Date.now() - 1000*60*60*24*8).toISOString(), // Older issue date
    dueDate: new Date(Date.now() + 1000*60*60*24*6).toISOString(), // Due in 6 days
    notes: "Please pay by the due date."
  },
];
