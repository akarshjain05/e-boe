import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Check, ChevronsUpDown, Loader2, Banknote, Gavel, CheckCircle2, Coins } from 'lucide-react';
import { toast } from 'sonner';

import { boeService } from '@/api/services/billsOfExchange';
import { companiesService } from '@/api/services/companies.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { cn, formatCurrency } from '@/lib/utils';
import { BillOfExchangePreview } from '@/components/shared/BillOfExchangePreview';

const bidSchema = z.object({
  financier_company_id: z.string().min(1, 'Please select a financier'),
  discount_rate: z.coerce.number().min(0, 'Must be positive').max(100, 'Cannot exceed 100%'),
  notes: z.string().optional(),
});

export default function DiscountBill() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [openCombobox, setOpenCombobox] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: boe, isLoading: isLoadingBoe } = useQuery({
    queryKey: ['bills-of-exchange', id],
    queryFn: () => boeService.getBillOfExchange(id!),
    enabled: !!id,
  });

  const { data: networkCompanies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['network-companies'],
    queryFn: () => companiesService.getNetworkCompanies(),
  });

  const form = useForm<z.infer<typeof bidSchema>>({
    resolver: zodResolver(bidSchema),
    defaultValues: {
      financier_company_id: '',
      discount_rate: 5.0,
      notes: '',
    },
  });

  const openBiddingMutation = useMutation({
    mutationFn: () => boeService.openBidding(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills-of-exchange'] });
      toast.success('Bidding opened successfully!');
    },
    onError: () => {
      toast.error('Failed to open bidding.');
    },
  });

  const submitBidMutation = useMutation({
    mutationFn: (values: z.infer<typeof bidSchema>) => boeService.submitBid(id!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills-of-exchange'] });
      toast.success('Bid submitted successfully!');
      form.reset({ financier_company_id: '', discount_rate: 5.0, notes: '' });
    },
    onError: () => {
      toast.error('Failed to submit bid.');
    },
  });

  const acceptBidMutation = useMutation({
    mutationFn: (bidId: string) => boeService.acceptBid(id!, bidId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills-of-exchange'] });
      toast.success('Bid accepted successfully!');
    },
    onError: () => {
      toast.error('Failed to accept bid.');
    },
  });

  const disburseMutation = useMutation({
    mutationFn: () => boeService.disburse(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills-of-exchange'] });
      toast.success('Funds disbursed successfully!');
    },
    onError: () => {
      toast.error('Failed to disburse funds.');
    },
  });

  const onSubmitBid = (values: z.infer<typeof bidSchema>) => {
    submitBidMutation.mutate(values);
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

  const isListed = boe.status === 'listed_for_discounting';
  const isBiddingOpen = boe.status === 'bidding_open';
  const isBidAccepted = boe.status === 'bid_accepted';
  const isDiscounted = boe.status === 'discounted';

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 overflow-auto">
      <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bidding & Discounting</h1>
            <p className="text-zinc-500">Manage financier bids for this instrument.</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/bills-of-exchange')}>
            Back to List
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col space-y-6">
            
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Discounting Status</CardTitle>
                <CardDescription>Current phase of the discounting lifecycle.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className={cn("px-4 py-2 rounded-full font-bold text-sm", 
                    isListed ? "bg-amber-100 text-amber-800" :
                    isBiddingOpen ? "bg-blue-100 text-blue-800" :
                    isBidAccepted ? "bg-emerald-100 text-emerald-800" :
                    isDiscounted ? "bg-purple-100 text-purple-800" : "bg-zinc-100 text-zinc-800"
                  )}>
                    {boe.status.toUpperCase().replace(/_/g, ' ')}
                  </div>
                </div>

                {isListed && (
                  <Button 
                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700" 
                    onClick={() => openBiddingMutation.mutate()}
                    disabled={openBiddingMutation.isPending}
                  >
                    {openBiddingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gavel className="h-4 w-4" />}
                    Open Bidding
                  </Button>
                )}
                {isBidAccepted && (
                  <Button 
                    className="w-full gap-2 bg-purple-600 hover:bg-purple-700" 
                    onClick={() => disburseMutation.mutate()}
                    disabled={disburseMutation.isPending}
                  >
                    {disburseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coins className="h-4 w-4" />}
                    Mark Funds Disbursed
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Bids List */}
            {(isBiddingOpen || isBidAccepted || isDiscounted) && (
              <Card>
                <CardHeader>
                  <CardTitle>Financier Bids</CardTitle>
                  <CardDescription>Bids received from the network.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {boe.bids?.length === 0 ? (
                    <p className="text-zinc-500 text-sm italic">No bids received yet.</p>
                  ) : (
                    boe.bids?.map(bid => {
                      const netProceeds = boe.amount - (boe.amount * bid.discount_rate / 100);
                      const companyName = networkCompanies.find((c: any) => c.id === bid.financier_company_id)?.name || 'Unknown Financier';
                      return (
                        <div key={bid.id} className={cn("p-4 border rounded-md flex justify-between items-center", bid.status === 'accepted' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : bid.status === 'rejected' ? 'opacity-50' : '')}>
                          <div>
                            <div className="font-bold">{companyName}</div>
                            <div className="text-sm text-zinc-500">Rate: {bid.discount_rate}% &bull; Proceeds: {formatCurrency(netProceeds)}</div>
                          </div>
                          <div>
                            {bid.status === 'pending' && isBiddingOpen && (
                              <Button size="sm" onClick={() => acceptBidMutation.mutate(bid.id)} disabled={acceptBidMutation.isPending}>
                                Accept Bid
                              </Button>
                            )}
                            {bid.status === 'accepted' && (
                              <span className="text-emerald-600 font-bold flex items-center gap-1 text-sm"><CheckCircle2 className="w-4 h-4" /> Accepted</span>
                            )}
                            {bid.status === 'rejected' && (
                              <span className="text-red-500 font-bold text-sm">Rejected</span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>
            )}

            {/* Submit Bid Form (Demo) */}
            {isBiddingOpen && (
              <Card>
                <CardHeader>
                  <CardTitle>Submit Bid (Simulated)</CardTitle>
                  <CardDescription>Simulate a financier submitting a bid on this platform.</CardDescription>
                </CardHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitBid)} className="flex flex-col flex-1">
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="financier_company_id"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Financier / Bank</FormLabel>
                            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                                  >
                                    {field.value ? networkCompanies.find((c: any) => c.id === field.value)?.name : "Select a financier..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-[400px] p-0">
                                <Command>
                                  <CommandInput placeholder="Search companies..." value={searchQuery} onValueChange={setSearchQuery} />
                                  <CommandList>
                                    <CommandEmpty>No company found.</CommandEmpty>
                                    <CommandGroup>
                                      {networkCompanies.map((company: any) => (
                                        <CommandItem
                                          value={company.name}
                                          key={company.id}
                                          onSelect={() => { form.setValue("financier_company_id", company.id); setOpenCombobox(false); }}
                                        >
                                          <Check className={cn("mr-2 h-4 w-4", company.id === field.value ? "opacity-100" : "opacity-0")} />
                                          {company.name}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
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
                        name="discount_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount Rate (%)</FormLabel>
                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter>
                      <Button type="submit" className="w-full" disabled={submitBidMutation.isPending}>
                        {submitBidMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Bid
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </Card>
            )}

          </div>

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
    </div>
  );
}
