"use client"
import React, { useState, useMemo, useEffect } from 'react';
import PageHeader from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // For date range potentially, or use Calendar
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, DollarSign } from "lucide-react";
import { mockInvoices, mockClients, mockServices, mockTasks } from "@/lib/placeholder-data";
import type { Invoice, Client, Service, Task } from "@/lib/types";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function PaymentsPage() {
  const allPaidInvoices = mockInvoices.filter(inv => inv.status === 'paid');
  const clients = mockClients;
  const services = mockServices;
  const tasks = mockTasks; // For service/project lookup

  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>(allPaidInvoices);
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const getClientDetails = (clientId: string) => clients.find(c => c.id === clientId);
  const getTaskDetails = (taskId: string) => tasks.find(t => t.id === taskId);
  const getServiceDetails = (serviceId: string) => services.find(s => s.id === serviceId);

  useEffect(() => {
    let currentInvoices = allPaidInvoices;

    if (selectedClient !== 'all') {
      currentInvoices = currentInvoices.filter(inv => inv.clientId === selectedClient);
    }

    if (dateRange.from && dateRange.to) {
      currentInvoices = currentInvoices.filter(inv => 
        isWithinInterval(parseISO(inv.issueDate), { start: dateRange.from!, end: dateRange.to! })
      );
    } else if (dateRange.from) {
       currentInvoices = currentInvoices.filter(inv => parseISO(inv.issueDate) >= dateRange.from!);
    } else if (dateRange.to) {
       currentInvoices = currentInvoices.filter(inv => parseISO(inv.issueDate) <= dateRange.to!);
    }


    setFilteredInvoices(currentInvoices);
  }, [selectedClient, dateRange, allPaidInvoices]);

  const totalRevenueFiltered = useMemo(() => {
    return filteredInvoices.reduce((sum, inv) => sum + (inv.finalAmount || inv.totalAmount), 0);
  }, [filteredInvoices]);

  const currentMonthRevenue = useMemo(() => {
    if (selectedClient !== 'all' || dateRange.from || dateRange.to) return 0; // Only if no filters are active
    
    const today = new Date();
    const startOfCurrentMonth = startOfMonth(today);
    const endOfCurrentMonth = endOfMonth(today);
    
    return allPaidInvoices
      .filter(inv => isWithinInterval(parseISO(inv.issueDate), { start: startOfCurrentMonth, end: endOfCurrentMonth }))
      .reduce((sum, inv) => sum + (inv.finalAmount || inv.totalAmount), 0);
  }, [allPaidInvoices, selectedClient, dateRange]);

  const displayRevenue = (selectedClient !== 'all' || dateRange.from || dateRange.to) ? totalRevenueFiltered : currentMonthRevenue;
  const displayRevenueLabel = (selectedClient !== 'all' || dateRange.from || dateRange.to) ? "Filtered Revenue" : "Current Month Revenue";


  return (
    <>
      <PageHeader 
        title="Payment History" 
        description="Track received payments and revenue trends."
      />
      <div className="grid gap-6">
        <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">{displayRevenueLabel}</CardTitle>
                <DollarSign className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">${displayRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                    { (selectedClient === 'all' && !dateRange.from && !dateRange.to) 
                        ? "Total revenue for the current month."
                        : "Total revenue based on applied filters."
                    }
                </p>
            </CardContent>
        </Card>

        <Card className="shadow-md">
            <CardHeader>
                <CardTitle>Filters</CardTitle>
                <CardDescription>Filter payment history by client and date range.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                    <Label htmlFor="clientFilterPayments" className="text-sm font-medium">Client</Label>
                    <Select value={selectedClient} onValueChange={setSelectedClient}>
                        <SelectTrigger id="clientFilterPayments"><SelectValue placeholder="All Clients" /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="all">All Clients</SelectItem>
                        {clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="dateFromPayments" className="text-sm font-medium">Date From</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="dateFromPayments"
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.from ? format(dateRange.from, "PPP") : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={dateRange.from}
                            onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                </div>
                <div>
                    <Label htmlFor="dateToPayments" className="text-sm font-medium">Date To</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="dateToPayments"
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal", !dateRange.to && "text-muted-foreground")}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.to ? format(dateRange.to, "PPP") : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={dateRange.to}
                            onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                </div>
            </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Filtered Payments</CardTitle>
            <CardDescription>List of paid invoices based on active filters.</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredInvoices.length > 0 ? (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Service(s)</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead className="text-right">Amount Paid</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice: Invoice) => {
                      const client = getClientDetails(invoice.clientId);
                      const currencySymbol = client?.currency === 'INR' ? '₹' : '$';
                      // For simplicity, taking first task's service. In reality, an invoice can cover multiple services.
                      const firstTaskDetails = invoice.tasks[0] ? getTaskDetails(invoice.tasks[0].taskId) : undefined;
                      const serviceName = firstTaskDetails ? getServiceDetails(firstTaskDetails.serviceId)?.name : 'N/A';
                      
                      return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.clientName || client?.name || 'N/A'}</TableCell>
                        <TableCell>{client?.projectName || 'N/A'}</TableCell>
                        <TableCell>{serviceName}</TableCell> {/* Simplified: shows first task's service */}
                        <TableCell>{format(parseISO(invoice.issueDate), 'MMM dd, yyyy')} (Assumed paid)</TableCell>
                        <TableCell className="text-right">{currencySymbol}{(invoice.finalAmount || invoice.totalAmount).toFixed(2)}</TableCell>
                      </TableRow>
                    )})}
                  </TableBody>
                </Table>
              </div>
            ) : (
               <p className="text-muted-foreground text-center py-8">No paid invoices found for the selected filters.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
