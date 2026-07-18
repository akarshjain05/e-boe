import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ScrollText } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { boeService } from '@/api/services/billsOfExchange';
import { formatCurrency } from '@/lib/utils';
import { BillOfExchangePreview } from '@/components/shared/BillOfExchangePreview';

export default function ListBillsOfExchange() {
  const [search, setSearch] = useState('');
  const [selectedBoeId, setSelectedBoeId] = useState<string | null>(null);

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['bills-of-exchange'],
    queryFn: () => boeService.getBillsOfExchange()
  });

  const filteredBills = bills.filter(b => 
    b.drawee_name.toLowerCase().includes(search.toLowerCase()) || 
    b.id.includes(search)
  );

  return (
    <div className="flex flex-col h-full">


      <div className="px-6 pb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input 
              placeholder="Search by customer name or ID..."
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
                  <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500">Drawee (Customer)</th>
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
                        <Link to="/bills-of-exchange/issue">
                          <Button variant="link" className="mt-2 text-indigo-600">Issue one now</Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((bill) => (
                    <tr key={bill.id} className="border-b transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50">
                      <td className="p-4 align-middle">
                        <div className="font-medium">{bill.drawee_name}</div>
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
                      <td className="p-4 align-middle text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedBoeId(bill.id)}>View</Button>
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
    </div>
  );
}
