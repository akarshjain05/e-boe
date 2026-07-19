import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ScrollText, MoreHorizontal, Edit, Trash2, Send, ArrowRightLeft, Banknote } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { boeService } from '@/api/services/billsOfExchange';
import { formatCurrency } from '@/lib/utils';
import { BillOfExchangePreview } from '@/components/shared/BillOfExchangePreview';

import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function ListBillsOfExchange() {
  const { user } = useAuth();
  const companyId = user?.company_id;
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [selectedBoeId, setSelectedBoeId] = useState<string | null>(null);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [discountingBoeId, setDiscountingBoeId] = useState<string | null>(null);
  const [biddingEndAt, setBiddingEndAt] = useState<string>('');
  const [minRateBps, setMinRateBps] = useState<string>('');
  const [maxRateBps, setMaxRateBps] = useState<string>('');
  
  const [activeTab, setActiveTab] = useState<'issued_by_me' | 'issued_against_me'>('issued_by_me');

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['bills-of-exchange'],
    queryFn: () => boeService.getBillsOfExchange()
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => boeService.acceptBillOfExchange(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills-of-exchange'] });
      toast.success('Bill of Exchange accepted successfully');
    },
    onError: () => {
      toast.error('Failed to accept Bill of Exchange');
    }
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => boeService.sendForAcceptance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills-of-exchange'] });
      toast.success('Bill of Exchange sent to Drawee for acceptance');
    },
    onError: () => {
      toast.error('Failed to send Bill of Exchange');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => boeService.deleteBillOfExchange(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills-of-exchange'] });
      toast.success('Bill of Exchange deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete Bill of Exchange');
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => boeService.cancelBill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills-of-exchange'] });
      toast.success('Bill of Exchange cancelled successfully');
    },
    onError: () => {
      toast.error('Failed to cancel Bill of Exchange');
    }
  });

  const listForDiscountingMutation = useMutation({
    mutationFn: (data: { id: string; bidding_end_at: string; min_acceptable_rate_bps?: number; max_acceptable_rate_bps?: number }) => 
      boeService.createDiscountingRequest(data.id, {
        bidding_end_at: data.bidding_end_at,
        min_acceptable_rate_bps: data.min_acceptable_rate_bps,
        max_acceptable_rate_bps: data.max_acceptable_rate_bps
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills-of-exchange'] });
      toast.success('Bill listed for discounting successfully');
      setDiscountDialogOpen(false);
      setDiscountingBoeId(null);
    },
    onError: () => {
      toast.error('Failed to list bill for discounting');
    }
  });

  const handleDiscountSubmit = () => {
    if (!discountingBoeId || !biddingEndAt) return;
    listForDiscountingMutation.mutate({
      id: discountingBoeId,
      bidding_end_at: new Date(biddingEndAt).toISOString(),
      min_acceptable_rate_bps: minRateBps ? parseInt(minRateBps) : undefined,
      max_acceptable_rate_bps: maxRateBps ? parseInt(maxRateBps) : undefined
    });
  };

  const filteredBills = bills.filter(b => {
    const matchesSearch = b.drawee_name.toLowerCase().includes(search.toLowerCase()) || 
                          b.drawer_name.toLowerCase().includes(search.toLowerCase()) || 
                          b.id.includes(search);
    const matchesTab = activeTab === 'issued_by_me' 
      ? b.company_id === companyId 
      : b.network_drawee_company_id === companyId;
    return matchesSearch && matchesTab;
  });


  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="issued_by_me">Issued by Me</TabsTrigger>
              <TabsTrigger value="issued_against_me">Issued Against Me</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input 
              placeholder="Search by name or ID..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b bg-zinc-50/50 dark:bg-zinc-900/50">
                <tr className="border-b transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 data-[state=selected]:bg-zinc-100">
                  <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">
                    {activeTab === 'issued_by_me' ? 'Drawee (Customer)' : 'Drawer (Supplier)'}
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">Issue Date</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">Due Date</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">Amount</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">Status</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="h-24 text-center">Loading...</td>
                  </tr>
                ) : filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="h-48 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center">
                        <ScrollText className="h-10 w-10 text-zinc-300 mb-2" />
                        <p>No Bills of Exchange found.</p>
                        {activeTab === 'issued_by_me' && (
                          <Link to="/bills-of-exchange/issue">
                            <Button variant="link" className="mt-2 text-indigo-600">Issue one now</Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((bill) => (
                    <tr 
                      key={bill.id} 
                      className="border-b transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 cursor-pointer"
                      onClick={() => setSelectedBoeId(bill.id)}
                    >
                      <td className="p-4 align-middle">
                        <div className="font-medium">
                          {activeTab === 'issued_by_me' ? bill.drawee_name : bill.drawer_name}
                        </div>
                        <div className="text-xs text-zinc-500">{bill.id.substring(0, 8)}...</div>
                      </td>
                      <td className="p-4 align-middle">{format(new Date(bill.issue_date), 'MMM dd, yyyy')}</td>
                      <td className="p-4 align-middle">{format(new Date(bill.due_date), 'MMM dd, yyyy')}</td>
                      <td className="p-4 align-middle font-medium">{formatCurrency(bill.amount)}</td>
                      <td className="p-4 align-middle">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${bill.status === 'issued' ? 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80' : 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                          {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                        </span>
                      </td>
                      <td className="p-4 align-middle text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        {activeTab === 'issued_against_me' && ['issued', 'sent'].includes(bill.status) && (
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              acceptMutation.mutate(bill.id);
                            }}
                            disabled={acceptMutation.isPending}
                          >
                            Accept
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {bill.status === 'draft' && activeTab === 'issued_by_me' && (
                              <>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  sendMutation.mutate(bill.id);
                                }} disabled={sendMutation.isPending}>
                                  <Send className="mr-2 h-4 w-4" />
                                  <span>Issue & Send</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/bills-of-exchange/edit/' + bill.id);
                                }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  <span>Edit Draft</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm('Are you sure you want to delete this draft?')) {
                                      deleteMutation.mutate(bill.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete Draft</span>
                                </DropdownMenuItem>
                              </>
                            )}

                            {bill.status === 'issued' && activeTab === 'issued_by_me' && (
                              <DropdownMenuItem 
                                className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm('Are you sure you want to cancel this bill?')) {
                                    cancelMutation.mutate(bill.id);
                                  }
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Cancel Bill</span>
                              </DropdownMenuItem>
                            )}
                            
                            {['accepted', 'endorsed'].includes(bill.status) && activeTab === 'issued_by_me' && (
                              <>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/bills-of-exchange/endorse/' + bill.id);
                                }}>
                                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                                  <span>Endorse Bill</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setDiscountingBoeId(bill.id);
                                  setDiscountDialogOpen(true);
                                }}>
                                  <Banknote className="mr-2 h-4 w-4" />
                                  <span>List for Discounting</span>
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            {['listed_for_discounting', 'bidding_open', 'bid_accepted'].includes(bill.status) && activeTab === 'issued_by_me' && (
                               <DropdownMenuItem onClick={(e) => {
                                 e.stopPropagation();
                                 navigate('/bills-of-exchange/discount/' + bill.id);
                               }}>
                                 <Banknote className="mr-2 h-4 w-4" />
                                 <span>Bidding & Discounting</span>
                               </DropdownMenuItem>
                            )}

                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedBoeId} onOpenChange={(open) => !open && setSelectedBoeId(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b shrink-0 bg-zinc-50 dark:bg-zinc-900/50">
            <DialogTitle>Bill of Exchange</DialogTitle>
            <DialogDescription>View the details of this bill of exchange instrument.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-950 p-6">
            <div className="mx-auto w-fit pb-8">
              {selectedBoeId && <BillOfExchangePreview id={selectedBoeId} />}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>List for Discounting</DialogTitle>
            <DialogDescription>Create a factoring unit to invite bids from financiers.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Bidding End Date & Time *</label>
              <Input type="datetime-local" value={biddingEndAt} onChange={(e) => setBiddingEndAt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Acceptable Rate (BPS)</label>
              <Input type="number" placeholder="e.g. 500 (5%)" value={minRateBps} onChange={(e) => setMinRateBps(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Acceptable Rate (BPS)</label>
              <Input type="number" placeholder="e.g. 1500 (15%)" value={maxRateBps} onChange={(e) => setMaxRateBps(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDiscountDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDiscountSubmit} disabled={!biddingEndAt || listForDiscountingMutation.isPending}>
              List Bill
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
