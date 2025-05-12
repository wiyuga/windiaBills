
import type { Invoice, Task } from './types';
import { 
    mockInvoices as initialMockInvoicesData, 
    mockTasks as initialMockTasksData 
} from './placeholder-data';

// Make copies to avoid direct mutation of original mock arrays if they are needed pristine elsewhere
let invoices: Invoice[] = [...initialMockInvoicesData];
let tasks: Task[] = [...initialMockTasksData];

// Listeners for changes
type Listener = () => void;
const invoiceListeners: Set<Listener> = new Set();
const taskListeners: Set<Listener> = new Set();

const notifyInvoiceListeners = () => {
  invoiceListeners.forEach(l => {
    try {
      l();
    } catch (e) {
      console.error("Error in invoice listener", e);
    }
  });
};
const notifyTaskListeners = () => {
  taskListeners.forEach(l => {
    try {
      l();
    } catch (e) {
      console.error("Error in task listener", e);
    }
  });
};

export const dataStore = {
    getInvoices: (): ReadonlyArray<Invoice> => invoices,
    addInvoice: (invoice: Invoice) => {
        invoices = [invoice, ...invoices];
        notifyInvoiceListeners();
    },
    updateInvoice: (invoiceId: string, updatedInvoiceData: Partial<Invoice>) => {
        invoices = invoices.map(inv => inv.id === invoiceId ? { ...inv, ...updatedInvoiceData } as Invoice : inv);
        notifyInvoiceListeners();
    },
    subscribeToInvoices: (listener: Listener): (() => void) => {
        invoiceListeners.add(listener);
        return () => invoiceListeners.delete(listener);
    },

    getTasks: (): ReadonlyArray<Task> => tasks,
    addTask: (task: Task) => {
        tasks = [task, ...tasks];
        notifyTaskListeners();
    },
    updateTask: (taskId: string, updatedTaskData: Partial<Task>) => {
        tasks = tasks.map(t => t.id === taskId ? { ...t, ...updatedTaskData } as Task : t);
        notifyTaskListeners();
    },
    deleteTask: (taskId: string) => { // Added for completeness, though not explicitly used by current fix
        tasks = tasks.filter(t => t.id !== taskId);
        notifyTaskListeners();
    },
    updateMultipleTasks: (taskUpdates: {taskId: string, data: Partial<Task>}[]) => {
        const updatesMap = new Map(taskUpdates.map(u => [u.taskId, u.data]));
        tasks = tasks.map(t => {
            if (updatesMap.has(t.id)) {
                return { ...t, ...updatesMap.get(t.id) } as Task;
            }
            return t;
        });
        notifyTaskListeners();
    },
    subscribeToTasks: (listener: Listener): (() => void) => {
        taskListeners.add(listener);
        return () => taskListeners.delete(listener);
    },
};
