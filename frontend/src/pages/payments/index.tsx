import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, MoreHorizontal, ArrowUpDown, ChevronDown, CheckCircle2, Clock, XCircle, IndianRupee, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/lib/utils'
import { paymentService } from '@/api/services/payments'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { RecordPaymentModal } from '@/components/modals/RecordPaymentModal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PayablesTab } from '@/components/payments/PayablesTab'
import { ReceivablesTab } from '@/components/payments/ReceivablesTab'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export default function Payments() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('')

  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', debouncedSearch, sortField, sortOrder, filterStatus, filterPaymentMethod],
    queryFn: () => paymentService.getPayments({ 
      search: debouncedSearch || undefined, 
      sort_by: sortField, 
      sort_order: sortOrder,
      status: filterStatus || undefined,
      payment_method: filterPaymentMethod || undefined
    }),
    placeholderData: keepPreviousData
  })

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'completed':
      case 'successful':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Confirmed
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
            <Clock className="h-3.5 w-3.5" />
            Pending
          </span>
        )
      case 'failed':
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20">
            <XCircle className="h-3.5 w-3.5" />
            Failed
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            <Clock className="h-3.5 w-3.5" />
            {status}
          </span>
        )
    }
  }

  const totalConfirmed = payments.filter(p => ['confirmed', 'completed', 'successful'].includes(p.status.toLowerCase())).reduce((s, p) => s + Number(p.amount), 0)
  const totalPending = payments.filter(p => p.status.toLowerCase() === 'pending').reduce((s, p) => s + Number(p.amount), 0)

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Payments</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Track and manage all payment receipts against bills.</p>
        </div>
        <Button onClick={() => setIsRecordModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 gap-2">
          <Plus className="h-4 w-4" />
          Record Payment
        </Button>
      </div>

      <Tabs defaultValue="receivables" className="w-full space-y-6">
        <TabsList className="mb-6 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <TabsTrigger value="receivables">Receivables (Customers)</TabsTrigger>
          <TabsTrigger value="payables">Payables (Creditors)</TabsTrigger>
          <TabsTrigger value="received">Received (Receipts)</TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-6">

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
              <IndianRupee className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Confirmed</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{formatCurrency(totalConfirmed)}</p>
            </div>
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Pending</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{formatCurrency(totalPending)}</p>
            </div>
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
              <IndianRupee className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Payments</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{payments.length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input 
                placeholder="Search receipts..." 
                className="pl-9 h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 w-full sm:w-auto">
                    <Filter className="h-4 w-4" />
                    Filter {(filterStatus || filterPaymentMethod) && <span className="flex h-2 w-2 rounded-full bg-indigo-600"></span>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Status</div>
                  <DropdownMenuItem onClick={() => setFilterStatus('')}>All Status</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('completed')}>Completed</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('pending')}>Pending</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('failed')}>Failed</DropdownMenuItem>
                  <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1"></div>
                  <div className="px-2 py-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Method</div>
                  <DropdownMenuItem onClick={() => setFilterPaymentMethod('')}>All Methods</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPaymentMethod('bank_transfer')}>Bank Transfer</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPaymentMethod('cheque')}>Cheque</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPaymentMethod('cash')}>Cash</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPaymentMethod('upi')}>UPI</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                Export
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 dark:bg-zinc-900/50 z-10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            )}
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-semibold" onClick={() => handleSort('receipt_number')}>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100">
                      Receipt Details
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold" onClick={() => handleSort('payment_method')}>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100">
                      Payment Details
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold" onClick={() => handleSort('amount')}>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100">
                      Amount
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100">
                      Status
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold" onClick={() => handleSort('payment_date')}>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100">
                      Date
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 && !isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                      No payments found.
                    </td>
                  </tr>
                ) : payments.map((payment: any, idx: number) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={payment.id} 
                    className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">{payment.receipt_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-700 dark:text-zinc-300">{payment.payment_method}</div>
                      {payment.reference_number && (
                        <div className="text-xs text-zinc-500 mt-1">Ref: {payment.reference_number}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(payment.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                      {formatDate(payment.payment_date)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="text-sm text-zinc-500">
              Showing <span className="font-medium text-zinc-900 dark:text-zinc-100">{payments.length > 0 ? 1 : 0}</span> to <span className="font-medium text-zinc-900 dark:text-zinc-100">{payments.length}</span> results
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </TabsContent>
      
      <TabsContent value="payables">
        <PayablesTab />
      </TabsContent>

      <TabsContent value="receivables">
        <ReceivablesTab />
      </TabsContent>
      </Tabs>
      <RecordPaymentModal open={isRecordModalOpen} onOpenChange={setIsRecordModalOpen} />
    </div>
  )
}
