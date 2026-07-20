import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Check, ChevronsUpDown, Loader2, ArrowRightLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { boeService } from '@/api/services/billsOfExchange';
import { customerService } from '@/api/services/customers';
import { AddCustomerModal } from '@/components/modals/AddCustomerModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { cn, formatCurrency } from '@/lib/utils';
import { BillOfExchangePreview } from '@/components/shared/BillOfExchangePreview';

const endorseSchema = z.object({
  endorsee_company_id: z.string().min(1, 'Please select a company to endorse to'),
  endorsement_type: z.enum(['blank', 'special', 'restrictive', 'conditional', 'sans_recourse']),
  remarks: z.string().optional(),
});

const ENDORSEMENT_EXPLAINERS: Record<string, string> = {
  blank: "Endorser signs without specifying an endorsee, making the bill payable to the bearer.",
  special: "Endorser specifies the exact party to whom payment must be made.",
  restrictive: "Endorser prohibits any further negotiation or transfer of the bill.",
  conditional: "Endorser adds a condition that must be fulfilled for payment.",
  sans_recourse: "Endorser transfers title but refuses any liability if the drawee defaults."
};

export default function EndorseBill() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [openCombobox, setOpenCombobox] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [searchCustomerType] = useState<'B2B' | 'B2C'>('B2B');

  const { data: boe, isLoading: isLoadingBoe } = useQuery({
    queryKey: ['bills-of-exchange', id],
    queryFn: () => boeService.getBillOfExchange(id!),
    enabled: !!id,
  });

  const { data: customers = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['customers-dropdown'],
    queryFn: () => customerService.getCustomers({})
  });

  const form = useForm<z.infer<typeof endorseSchema>>({
    resolver: zodResolver(endorseSchema),
    defaultValues: {
      endorsee_company_id: '',
      endorsement_type: 'blank',
      remarks: '',
    },
  });

  const endorseMutation = useMutation({
    mutationFn: (values: z.infer<typeof endorseSchema>) => 
      boeService.endorseBill(id!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills-of-exchange'] });
      toast.success('Bill of Exchange endorsed successfully!');
      navigate('/bills-of-exchange');
    },
    onError: () => {
      toast.error('Failed to endorse Bill of Exchange.');
    },
  });

  const onSubmit = (values: z.infer<typeof endorseSchema>) => {
    const selectedCustomer = customers.find((c: any) => c.id === values.endorsee_company_id);
    
    // We send endorsee_company_id as null because it's a Customer, not a Network Company
    const payload = {
      ...values,
      endorsee_company_id: null,
      endorsee_name: selectedCustomer?.name || 'Unknown',
      endorsee_address: selectedCustomer?.address || '',
      endorsee_phone: selectedCustomer?.phone,
      endorsee_email: selectedCustomer?.email
    };
    
    endorseMutation.mutate(payload as any);
  };

  if (isLoadingBoe || isLoadingCompanies) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!boe) {
    return (
      <div className="flex h-full items-center justify-center flex-col">
        <p className="text-zinc-500 mb-4">Bill of Exchange not found</p>
        <Button variant="outline" onClick={() => navigate('/bills-of-exchange')}>Back to list</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 overflow-auto">
      <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Endorse Bill of Exchange</h1>
            <p className="text-zinc-500">Transfer the title of this bill to another party.</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/bills-of-exchange')}>
            Back to List
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <Card>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                <CardHeader>
                  <CardTitle>Endorsement Details</CardTitle>
                  <CardDescription>Select the company you wish to endorse this bill to.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-6">
                  
                  <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-md text-sm border space-y-1">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Current Amount:</span>
                      <span className="font-bold">{formatCurrency(boe.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Drawn on:</span>
                      <span className="font-bold">{boe.drawee_name}</span>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="endorsee_company_id"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Endorsee Company</FormLabel>
                        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? customers.find(
                                      (c: any) => c.id === field.value
                                    )?.name
                                  : "Select a company..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0">
                            <Command shouldFilter={false}>
                              <CommandInput 
                                placeholder="Search companies by name or GST..." 
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                              />
                              <CommandList>
                                <CommandEmpty>No company found.</CommandEmpty>
                                <CommandGroup>
                                  {(() => {
                                    let filtered = customers;
                                    if (searchQuery) {
                                      const q = searchQuery.toLowerCase();
                                      filtered = filtered.filter((c: any) => 
                                        c.name?.toLowerCase().includes(q) || 
                                        c.gst_number?.toLowerCase().includes(q) ||
                                        c.phone?.toLowerCase().includes(q)
                                      );
                                    }
                                    return filtered.map((company: any) => (
                                      <CommandItem
                                        value={company.id}
                                        key={company.id}
                                        onSelect={() => {
                                          form.setValue("endorsee_company_id", company.id);
                                          setOpenCombobox(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            company.id === field.value
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        {company.name} {company.gst_number ? `(${company.gst_number})` : ''}
                                      </CommandItem>
                                    ));
                                  })()}
                                </CommandGroup>
                                <div className="p-1 border-t border-zinc-200 dark:border-zinc-800">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="w-full gap-2 justify-start text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setOpenCombobox(false);
                                      setIsAddCustomerModalOpen(true);
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                    Add Company / Customer
                                  </Button>
                                </div>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endorsement_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endorsement Type</FormLabel>
                        <FormControl>
                          <select 
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="blank">Blank (General Endorsement)</option>
                            <option value="special">Special (Full Endorsement)</option>
                            <option value="restrictive">Restrictive (Blocks further transfer)</option>
                            <option value="conditional">Conditional</option>
                            <option value="sans_recourse">Sans Recourse (Without liability)</option>
                          </select>
                        </FormControl>
                        <p className="text-[0.8rem] text-muted-foreground mt-2">
                          {ENDORSEMENT_EXPLAINERS[field.value as string]}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remarks (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter any endorsement remarks..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="pt-6 border-t">
                  <Button type="submit" className="w-full gap-2" disabled={endorseMutation.isPending}>
                    {endorseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
                    Confirm Endorsement
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>

          <Card className="flex flex-col bg-zinc-100/50 dark:bg-zinc-900/50 overflow-hidden">
            <CardHeader className="bg-white dark:bg-zinc-950 border-b">
              <CardTitle className="text-lg">Instrument Preview</CardTitle>
            </CardHeader>
            <div className="flex-1 overflow-auto p-4">
              <div className="scale-90 origin-top">
                <BillOfExchangePreview id={boe.id} />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <AddCustomerModal 
        open={isAddCustomerModalOpen} 
        onOpenChange={setIsAddCustomerModalOpen}
        initialCustomerType={searchCustomerType}
        onSuccessAction={(customerId: string) => {
          setIsAddCustomerModalOpen(false);
          // Wait for the queries to invalidate and the new customer to appear
          setTimeout(() => {
            form.setValue('endorsee_company_id', customerId);
          }, 500);
        }}
      />
    </div>
  );
}
