import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Search, Filter, ArrowUpDown, FileText, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/lib/utils'
import { paymentService } from '@/api/services/payments'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Passbook() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<string>('payment_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterType, setFilterType] = useState<'all' | 'received' | 'paid'>('all')

  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['passbook_payments', debouncedSearch, sortField, sortOrder],
    queryFn: () => paymentService.getPayments({ 
      search: debouncedSearch || undefined, 
      sort_by: sortField, 
      sort_order: sortOrder
    }),
    placeholderData: keepPreviousData
  })

  // Filter payments locally by received vs paid if needed
  const filteredPayments = payments.filter((p: any) => {
    if (filterType === 'all') return true;
    if (filterType === 'received' && p.bill_type === 'receivable') return true;
    if (filterType === 'paid' && p.bill_type === 'payable') return true;
    return false;
  })

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Passbook</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Track all your incoming and outgoing transactions.</p>
        </div>
        <div className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <BookOpen className="h-5 w-5 text-indigo-600" />
          <span className="font-semibold">Ledger View</span>
        </div>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-t-xl">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search by bill number, participant, or receipt..."
                className="pl-9 h-10 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto h-10 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                    <Filter className="h-4 w-4 mr-2" />
                    {filterType === 'all' ? 'All Transactions' : filterType === 'received' ? 'Money Received' : 'Money Paid'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setFilterType('all')}>All Transactions</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('received')}>Money Received</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('paid')}>Money Paid</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
  
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-semibold cursor-pointer" onClick={() => handleSort('payment_date')}>
                    <div className="flex items-center gap-2">Date <ArrowUpDown className="h-3 w-3" /></div>
                  </th>
                  <th className="px-6 py-4 font-semibold">Participant</th>
                  <th className="px-6 py-4 font-semibold">Bill No.</th>
                  <th className="px-6 py-4 font-semibold">Payment Method</th>
                  <th className="px-6 py-4 font-semibold cursor-pointer" onClick={() => handleSort('amount')}>
                    <div className="flex items-center justify-end gap-2 text-right w-full">Amount <ArrowUpDown className="h-3 w-3" /></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-transparent">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-zinc-400 mx-auto" />
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                          <FileText className="h-6 w-6 text-zinc-400" />
                        </div>
                        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">No transactions found</h3>
                        <p className="text-zinc-500 mt-1">Your ledger is empty based on the current filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment: any, idx: number) => {
                    const isReceived = payment.bill_type === 'receivable';
                    
                    return (
                      <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={payment.id} 
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">{formatDate(payment.payment_date)}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">{payment.receipt_number}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">{payment.participant_name || '-'}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">{isReceived ? 'Received from' : 'Paid to'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-zinc-700 dark:text-zinc-300">{payment.bill_number || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                            {payment.payment_method.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className={`font-bold flex items-center justify-end gap-1.5 ${isReceived ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isReceived ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                            {isReceived ? '+' : '-'}{formatCurrency(payment.amount)}
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-zinc-500 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-xl">
            <span className="text-sm">Showing <span className="font-medium text-zinc-900 dark:text-zinc-100">{filteredPayments.length > 0 ? 1 : 0}</span> to <span className="font-medium text-zinc-900 dark:text-zinc-100">{filteredPayments.length}</span> results</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled className="border-zinc-200 dark:border-zinc-800">Previous</Button>
              <Button variant="outline" size="sm" disabled className="border-zinc-200 dark:border-zinc-800">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
