"use client";

import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon, DollarSign } from "lucide-react";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import type { Invoice, Client, Task } from '@/lib/types';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  useEffect(() => {
    const fetchData = async () => {
      const [invSnap, clientSnap, taskSnap] = await Promise.all([
        getDocs(collection(db, 'invoices')),
        getDocs(collection(db, 'clients')),
        getDocs(collection(db, 'tasks')),
      ]);
      setInvoices(invSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Invoice[]);
      setClients(clientSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Client[]);
      setTasks(taskSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Task[]);
    };
    fetchData();
  }, []);

  const allPaidInvoices = useMemo(
    () => invoices.filter(inv => inv.status === 'paid'),
    [invoices]
  );

  const filteredInvoices = useMemo(() => {
    let list = [...allPaidInvoices];
    if (selectedClient !== 'all') {
      list = list.filter(inv => inv.clientId === selectedClient);
    }
    if (dateRange.from && dateRange.to) {
      const startDate = dateRange.from; // Refine type
      const endDate = dateRange.to; // Refine type
 list = list.filter(inv => isWithinInterval(parseISO(inv.issueDate), { start: startDate, end: endDate }));
    } else if (dateRange.from) {
      const fromDate = dateRange.from;
      list = list.filter(inv => parseISO(inv.issueDate) >= fromDate);
    } else if (dateRange.to) {
      const toDate = dateRange.to;
      list = list.filter(inv => parseISO(inv.issueDate) <= toDate);
    }
    return list;
  }, [allPaidInvoices, selectedClient, dateRange]);

  const totalFiltered = useMemo(
    () => filteredInvoices.reduce((sum, inv) => sum + (inv.finalAmount ?? inv.totalAmount), 0),
    [filteredInvoices]
  );

  const recentMonthRevenue = useMemo(() => {
    const today = new Date();
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    return allPaidInvoices
      .filter(inv => isWithinInterval(parseISO(inv.issueDate), { start, end }))
      .reduce((sum, inv) => sum + (inv.finalAmount ?? inv.totalAmount), 0);
  }, [allPaidInvoices]);

  const displayRevenue = (selectedClient !== 'all' || dateRange.from || dateRange.to)
    ? totalFiltered
    : recentMonthRevenue;
  const displayLabel = (selectedClient !== 'all' || dateRange.from || dateRange.to)
    ? 'Filtered Revenue'
    : "This Month's Revenue";

  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    const source = (selectedClient !== 'all' || dateRange.from || dateRange.to)
      ? filteredInvoices
      : allPaidInvoices;
    source.forEach(inv => {
      const month = format(parseISO(inv.issueDate), 'MMM yyyy');
      map.set(month, (map.get(month) ?? 0) + (inv.finalAmount ?? inv.totalAmount));
    });
    return Array.from(map, ([month, revenue]) => ({ month, revenue })).slice(-6);
  }, [filteredInvoices, allPaidInvoices, selectedClient, dateRange]);

  const getClient = (id: string) => clients.find(c => c.id === id);
  const getTask = (id: string) => tasks.find(t => t.id === id);

  return (
    <>
      <PageHeader title="Payment History" description="Track revenue trends and payments." />
      <div className="grid gap-6">
        <Card className="shadow-md">
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle>{displayLabel}</CardTitle>
            <DollarSign className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{getClient('')?.currency === 'INR' ? '₹' : '$'}{displayRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {(selectedClient==='all' && !dateRange.from && !dateRange.to)
                ? 'Total revenue for the current month.'
                : 'Total revenue based on active filters.'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter payments by client & date.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label>Client</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger><SelectValue placeholder="All Clients" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left", !dateRange.from && "text-muted-foreground")}>...
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, 'PPP') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start"><Calendar mode="single" selected={dateRange.from} onSelect={(d) => setDateRange(prev=>({...prev,from:d||undefined}))} /></PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Date To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left", !dateRange.to && "text-muted-foreground")}>...
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, 'PPP') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start"><Calendar mode="single" selected={dateRange.to} onSelect={(d) => setDateRange(prev=>({...prev,to:d||undefined}))} /></PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {chartData.length>0 && <Card className="shadow-md"><CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Last 6 periods</CardDescription>
        </CardHeader><CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={chartData} margin={{ top:5,right:20,left:20,bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickFormatter={(v)=>`$${v}`} tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={v=>`$${Number(v).toFixed(2)}`} indicator="dot" />} />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent></Card>}

        <Card className="shadow-md">
          <CardHeader><CardTitle>Filtered Payments</CardTitle><CardDescription>Based on filters</CardDescription></CardHeader>
          <CardContent>
            {filteredInvoices.length>0 ? (<div className="rounded-lg border"><Table><TableHeader><TableRow>
              <TableHead>Invoice #</TableHead><TableHead>Client</TableHead><TableHead>Project</TableHead><TableHead>Service(s)</TableHead><TableHead>Payment Date</TableHead><TableHead className="text-right">Amount Paid</TableHead>
            </TableRow></TableHeader><TableBody>
              {filteredInvoices.map(inv=>{
                const cl=getClient(inv.clientId);
                const sym=cl?.currency==='INR'?'₹':'$';
                const first=inv.tasks[0]?getTask(inv.tasks[0].taskId):undefined;
                const serv=first?services.find(s=>s.id===first.serviceId)?.name||'N/A':'N/A';
                return (<TableRow key={inv.id}>
                  <TableCell>{inv.invoiceNumber}</TableCell>
                  <TableCell>{cl?.name}</TableCell>
                  <TableCell>{cl?.projectName}</TableCell>
                  <TableCell>{serv}</TableCell>
                  <TableCell>{format(parseISO(inv.issueDate),'MMM dd, yyyy')}</TableCell>
                  <TableCell className="text-right">{sym}{(inv.finalAmount??inv.totalAmount).toFixed(2)}</TableCell>
                </TableRow>);
              })}
            </TableBody></Table></div>) : <p className="text-muted-foreground text-center py-8">No paid invoices found.</p>}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
