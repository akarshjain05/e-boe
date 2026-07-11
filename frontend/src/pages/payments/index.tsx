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
          <TabsTrigger value="receivables">Receivables / Receive</TabsTrigger>
          <TabsTrigger value="payables">Payables / Paid</TabsTrigger>
        </TabsList>

      
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
