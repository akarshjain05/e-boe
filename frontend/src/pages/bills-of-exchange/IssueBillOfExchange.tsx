import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Eye, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

import { customerService } from '@/api/services/customers';
import { billService } from '@/api/services/bills';
import { boeService } from '@/api/services/billsOfExchange';
import { companiesService } from '@/api/services/companies.service';
import { formatCurrency } from '@/lib/utils';
import { BillOfExchangePreview } from '@/components/shared/BillOfExchangePreview';

const issueFormSchema = z.object({
  customer_id: z.string().min(1, "Please select a customer"),
  issue_date: z.string().min(1, "Issue date is required"),
  due_date: z.string().min(1, "Due date is required"),
  place_of_issue: z.string().min(1, "Place of issue is required"),
  description: z.string().optional(),
});

export default function IssueBillOfExchange() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [createdBoeId, setCreatedBoeId] = useState<string | null>(null);

  const [openCustomerCombobox, setOpenCustomerCombobox] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");

  // Queries
  const { data: myCompany } = useQuery({
    queryKey: ['company-me'],
    queryFn: () => companiesService.getMe()
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers()
  });

  const { data: billsOfExchange = [] } = useQuery({
    queryKey: ['bills-of-exchange'],
    queryFn: () => boeService.getBillsOfExchange()
  });

  const recentBoeCustomerIds = useMemo(() => {
    const customerIds = billsOfExchange
      .filter(boe => boe.company_id === myCompany?.id)
      .map(boe => boe.customer_id);
    return Array.from(new Set(customerIds)).slice(0, 5);
  }, [billsOfExchange, myCompany]);

  const form = useForm<z.infer<typeof issueFormSchema>>({
    resolver: zodResolver(issueFormSchema),
    defaultValues: {
      customer_id: "",
      issue_date: new Date().toISOString().split('T')[0],
      due_date: "",
      place_of_issue: myCompany?.address?.split(',')[0] || "",
      description: "For value received",
    }
  });

  const selectedCustomerId = form.watch("customer_id");
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Fetch bills for selected customer
  const { data: customerBills = [], isLoading: isLoadingBills } = useQuery({
    queryKey: ['bills', { customer_id: selectedCustomerId }],
    queryFn: () => billService.getBills({ customer_id: selectedCustomerId }),
    enabled: !!selectedCustomerId
  });

  // Filter bills for the specific customer that are accepted/overdue and unpaid
  const availableBills = useMemo(() => {
    return customerBills.filter(b => 
      b.customer_id === selectedCustomerId && 
      ['accepted', 'overdue'].includes(b.status) &&
      Number(b.outstanding_amount) > 0
    );
  }, [customerBills, selectedCustomerId]);

  // Calculate total amount
  const totalAmount = useMemo(() => {
    return availableBills
      .filter(b => selectedInvoices.includes(b.id))
      .reduce((sum, b) => sum + Number(b.total_amount), 0);
  }, [availableBills, selectedInvoices]);

  const toggleInvoice = (id: string) => {
    setSelectedInvoices(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const createMutation = useMutation({
    mutationFn: boeService.createBillOfExchange,
    onSuccess: (data) => {
      setCreatedBoeId(data.id);
      setShowPreview(true);
      queryClient.invalidateQueries({ queryKey: ['bills-of-exchange'] });
      toast.success("Bill of Exchange issued successfully!");
    },
    onError: () => {
      toast.error("Failed to issue Bill of Exchange.");
    }
  });

  const onSubmit = (values: z.infer<typeof issueFormSchema>) => {
    if (selectedInvoices.length === 0) {
      toast.error("Please select at least one bill/invoice.");
      return;
    }
    if (!myCompany) {
      toast.error("Company profile not found. Please complete your company profile.");
      return;
    }
    if (!selectedCustomer) {
      toast.error("Customer not found.");
      return;
    }

    createMutation.mutate({
      customer_id: values.customer_id,
      drawer_name: myCompany.name,
      drawer_address: myCompany.address_line1 || undefined,
      drawer_phone: myCompany.phone || undefined,
      drawer_email: myCompany.email || undefined,
      drawee_name: selectedCustomer.name,
      drawee_address: selectedCustomer.address || undefined,
      drawee_phone: selectedCustomer.phone || undefined,
      drawee_email: selectedCustomer.email || undefined,
      amount: totalAmount,
      description: values.description,
      issue_date: values.issue_date,
      due_date: values.due_date,
      place_of_issue: values.place_of_issue,
      invoice_ids: selectedInvoices,
    });
  };

  if (showPreview && createdBoeId) {
    return (
      <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Generated Bill of Exchange</h1>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate('/bills-of-exchange')}>
              Back to List
            </Button>
            <Button className="gap-2" onClick={() => {
              toast.success("Sent to drawee successfully!");
              navigate('/bills-of-exchange');
            }}>
              <Send className="h-4 w-4" />
              Send to Drawee for Acceptance
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="mx-auto w-fit pb-8">
            <BillOfExchangePreview id={createdBoeId} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950">


      <div className="p-6 overflow-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">
            
            <Card>
              <CardHeader>
                <CardTitle>1. Select Drawee (Customer)</CardTitle>
                <CardDescription>Select the party against whom this bill is drawn.</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Popover open={openCustomerCombobox} onOpenChange={setOpenCustomerCombobox}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openCustomerCombobox}
                              className={cn(
                                "w-full justify-between font-normal bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? customers.find((c) => c.id === field.value)?.name
                                : "Select a customer..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput 
                              placeholder="Search by name, phone, or GST..."
                              value={customerSearchQuery}
                              onValueChange={setCustomerSearchQuery}
                            />
                            <CommandList>
                              <CommandEmpty className="py-2 px-2 text-sm text-center">
                                <p className="text-zinc-500">No customer found.</p>
                              </CommandEmpty>
                              <CommandGroup>
                                {(() => {
                                  let filtered = customers;
                                  if (!customerSearchQuery) {
                                    filtered = filtered.filter(c => recentBoeCustomerIds.includes(c.id));
                                  } else {
                                    const q = customerSearchQuery.toLowerCase();
                                    filtered = filtered.filter(c => 
                                      c.name.toLowerCase().includes(q) || 
                                      (c.phone && c.phone.toLowerCase().includes(q)) || 
                                      (c.gst_number && c.gst_number.toLowerCase().includes(q))
                                    );
                                  }
                                  
                                  if (filtered.length === 0 && !customerSearchQuery) {
                                    return <p className="text-sm text-zinc-500 text-center py-4">Search to find a customer...</p>;
                                  }

                                  return filtered.map((customer) => {
                                    const searchValue = `${customer.name} ${customer.phone || ''} ${customer.gst_number || ''}`;
                                    
                                    return (
                                      <CommandItem
                                        key={customer.id}
                                        value={searchValue}
                                        onSelect={() => {
                                          field.onChange(customer.id);
                                          setSelectedInvoices([]); // Reset selected invoices
                                          setOpenCustomerCombobox(false);
                                        }}
                                      >
                                        <div className="flex w-full items-center justify-between">
                                          <div className="flex items-center">
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                customer.id === field.value ? "opacity-100" : "opacity-0"
                                              )}
                                            />
                                            <span>{customer.name}</span>
                                          </div>
                                          <span className="text-xs italic text-zinc-400 dark:text-zinc-500 ml-4">
                                            {customer.customer_type === 'B2B' ? customer.gst_number : customer.phone}
                                          </span>
                                        </div>
                                      </CommandItem>
                                    );
                                  });
                                })()}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedCustomer && (
                  <div className="mt-4 p-4 bg-zinc-100 dark:bg-zinc-900 rounded-md grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-zinc-500 block mb-1">Drawee Name:</span>
                      <strong className="font-medium">{selectedCustomer.name}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block mb-1">Contact:</span>
                      <span>{selectedCustomer.phone || '-'} | {selectedCustomer.email || '-'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-zinc-500 block mb-1">Address:</span>
                      <span>{selectedCustomer.address || '-'}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={!selectedCustomerId ? "opacity-50 pointer-events-none" : ""}>
              <CardHeader>
                <CardTitle>2. Select Invoices</CardTitle>
                <CardDescription>Select one or multiple bills to include in this Bill of Exchange.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingBills ? (
                  <div className="py-4 text-center text-sm text-zinc-500 flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading bills...
                  </div>
                ) : availableBills.length === 0 ? (
                  <div className="py-4 text-center text-sm text-zinc-500">
                    No open invoices found for this customer.
                  </div>
                ) : (
                  <div className="border rounded-md divide-y divide-zinc-200 dark:divide-zinc-800">
                    {availableBills.map(bill => (
                      <div key={bill.id} className="flex items-center space-x-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                        <Checkbox 
                          id={`bill-${bill.id}`} 
                          checked={selectedInvoices.includes(bill.id)}
                          onCheckedChange={() => toggleInvoice(bill.id)}
                        />
                        <div className="flex-1">
                          <label htmlFor={`bill-${bill.id}`} className="text-sm font-medium leading-none cursor-pointer">
                            Invoice #{bill.id.substring(0, 8).toUpperCase()}
                          </label>
                          <p className="text-sm text-zinc-500 mt-1">
                            Issued: {bill.issue_date} • Outstanding: {formatCurrency(Number(bill.outstanding_amount))}
                          </p>
                        </div>
                        <div className="font-bold text-right">
                          {formatCurrency(Number(bill.total_amount))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-6 flex justify-end p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-md border border-indigo-100 dark:border-indigo-800">
                  <div className="text-right">
                    <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Total Bill of Exchange Amount</span>
                    <div className="text-3xl font-bold text-indigo-950 dark:text-indigo-300">
                      {formatCurrency(totalAmount)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={!selectedCustomerId || selectedInvoices.length === 0 ? "opacity-50 pointer-events-none" : ""}>
              <CardHeader>
                <CardTitle>3. Bill Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="issue_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Issue</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date (Tenor)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="place_of_issue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Place of Issue</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Mumbai, India" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description / Note</FormLabel>
                      <FormControl>
                        <Input placeholder="For value received..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-end pt-6 border-t">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="gap-2" 
                  disabled={createMutation.isPending || selectedInvoices.length === 0}
                >
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                  Generate & Preview Bill of Exchange
                </Button>
              </CardFooter>
            </Card>

          </form>
        </Form>
      </div>
    </div>
  );
}
