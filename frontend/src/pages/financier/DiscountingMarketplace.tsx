import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2, Banknote } from 'lucide-react';
import { toast } from 'sonner';

import { discountingService } from '@/api/services/discounting';
import { companiesService } from '@/api/services/companies.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { BillOfExchangePreview } from '@/components/shared/BillOfExchangePreview';

const bidSchema = z.object({
  discount_rate: z.coerce.number().min(0, 'Must be positive').max(100, 'Cannot exceed 100%'),
  platform_fee: z.coerce.number().min(0).default(0),
});

export default function DiscountingMarketplace() {
  const queryClient = useQueryClient();
  const [selectedDrId, setSelectedDrId] = useState<string | null>(null);

  const { data: myCompany } = useQuery({
    queryKey: ['company-me'],
    queryFn: () => companiesService.getMe()
  });

  const { data: discountingRequests = [], isLoading } = useQuery({
    queryKey: ['discounting-requests'],
    queryFn: () => discountingService.getDiscountingRequests()
  });

  const form = useForm<z.infer<typeof bidSchema>>({
    resolver: zodResolver(bidSchema) as any,
    defaultValues: {
      discount_rate: 5.0,
      platform_fee: 0,
    },
  });

  const discountRate = form.watch('discount_rate');
  const platformFee = form.watch('platform_fee');

  const selectedDr = discountingRequests.find(dr => dr.id === selectedDrId);
  const faceValue = selectedDr?.face_value || 0;
  const tenorDays = selectedDr?.tenor_days || 0;
  
  // Simple simple interest calculation: FV * (rate/100) * (days/365)
  const computedDiscountAmount = (faceValue * (discountRate / 100) * tenorDays) / 365;
  const computedNetPayable = faceValue - computedDiscountAmount - platformFee;

  const submitBidMutation = useMutation({
    mutationFn: (values: z.infer<typeof bidSchema>) => {
      const payload = {
        financier_company_id: myCompany!.id,
        discount_rate_bps: Math.round(values.discount_rate * 100),
        platform_fee_bps: Math.round(values.platform_fee * 100),
      };
      return discountingService.submitBid(selectedDrId!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounting-requests'] });
      toast.success('Bid submitted successfully!');
      setSelectedDrId(null);
      form.reset({ discount_rate: 5.0, platform_fee: 0 });
    },
    onError: () => {
      toast.error('Failed to submit bid.');
    },
  });

  const onSubmitBid = (values: z.infer<typeof bidSchema>) => {
    submitBidMutation.mutate(values);
  };

  return (
    <div className="flex flex-col h-full overflow-auto bg-zinc-50 dark:bg-zinc-950">
      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Discounting Marketplace</h1>
          <p className="text-zinc-500">Browse open factoring units and submit bids.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
          ) : discountingRequests.length === 0 ? (
            <div className="col-span-full py-12 text-center text-zinc-500">
              <Banknote className="w-12 h-12 mx-auto mb-4 text-zinc-300" />
              <p>No open discounting requests available at the moment.</p>
            </div>
          ) : (
            discountingRequests.map(dr => (
              <Card key={dr.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>Factor Unit: {formatCurrency(dr.face_value)}</CardTitle>
                  <CardDescription>Ends: {new Date(dr.bidding_end_at!).toLocaleString()}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-zinc-500 block">Tenor</span>
                      <span className="font-bold">{dr.tenor_days} Days</span>
                    </div>
                    {dr.max_acceptable_rate_bps && (
                      <div>
                        <span className="text-zinc-500 block">Max Rate</span>
                        <span className="font-bold">{(dr.max_acceptable_rate_bps / 100).toFixed(2)}%</span>
                      </div>
                    )}
                  </div>
                  <Button className="w-full" onClick={() => setSelectedDrId(dr.id)}>
                    View & Bid
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={!!selectedDrId} onOpenChange={(open) => !open && setSelectedDrId(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 pb-2 border-b">
            <DialogTitle>Submit Bid</DialogTitle>
            <DialogDescription>Review the bill and submit your discounting bid.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-6 bg-zinc-50 dark:bg-zinc-900 flex gap-6">
            <div className="flex-1 bg-white dark:bg-zinc-950 border rounded-lg overflow-auto">
              {selectedDr && <BillOfExchangePreview id={selectedDr.bill_of_exchange_id} />}
            </div>
            
            <div className="w-[350px] shrink-0">
              <Card>
                <CardHeader>
                  <CardTitle>Your Bid</CardTitle>
                </CardHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitBid)}>
                    <CardContent className="space-y-4">
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
                      
                      <FormField
                        control={form.control}
                        name="platform_fee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Fees</FormLabel>
                            <FormControl><Input type="number" step="1" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md space-y-2 mt-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-800 dark:text-blue-300">Face Value</span>
                          <span className="font-bold">{formatCurrency(faceValue)}</span>
                        </div>
                        <div className="flex justify-between text-red-600 dark:text-red-400">
                          <span>Less Discount ({discountRate}%)</span>
                          <span>- {formatCurrency(computedDiscountAmount)}</span>
                        </div>
                        <div className="flex justify-between text-red-600 dark:text-red-400 border-b pb-2">
                          <span>Less Fees</span>
                          <span>- {formatCurrency(platformFee)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400 pt-2 text-base font-bold">
                          <span>Net Payable</span>
                          <span>{formatCurrency(computedNetPayable)}</span>
                        </div>
                      </div>

                    </CardContent>
                    <div className="p-6 pt-0">
                      <Button type="submit" className="w-full" disabled={submitBidMutation.isPending || computedNetPayable <= 0}>
                        {submitBidMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Submit Bid
                      </Button>
                    </div>
                  </form>
                </Form>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
