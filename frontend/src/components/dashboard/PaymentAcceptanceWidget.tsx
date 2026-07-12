import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { billService } from '@/api/services/bills'
import { paymentService } from '@/api/services/payments'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Loader2, CheckCircle2, XCircle, CheckSquare } from 'lucide-react'
import { toast } from 'sonner'

export function PaymentAcceptanceWidget() {
  const queryClient = useQueryClient()
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBulkAccepting, setIsBulkAccepting] = useState(false)
  const [isBulkRejecting, setIsBulkRejecting] = useState(false)

  const { data: bills = [], isLoading: isLoadingBills } = useQuery({
    queryKey: ['receivable-bills'],
    queryFn: () => billService.getBills({ bill_type: 'receivable' })
  })

  const { data: payments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ['pending-payments'],
    queryFn: () => paymentService.getPayments({ status: 'pending_confirmation' })
  })

  const myPendingPayments = payments.filter(p => bills.some(b => b.id === p.bill_id))
  const isLoading = isLoadingBills || isLoadingPayments

  const handleAccept = async (id: string) => {
    setConfirmingId(id)
    try {
      await paymentService.confirmPayment(id)
      toast.success('Payment accepted successfully')
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] })
      queryClient.invalidateQueries({ queryKey: ['bills'] })
      queryClient.invalidateQueries({ queryKey: ['reportsDashboard'] })
    } catch (error) {
      console.error('Failed to accept payment:', error)
      toast.error('Failed to accept payment')
    } finally {
      setConfirmingId(null)
    }
  }

  const handleReject = async (id: string) => {
    setRejectingId(id)
    try {
      await paymentService.rejectPayment(id)
      toast.success('Payment rejected successfully')
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] })
      queryClient.invalidateQueries({ queryKey: ['bills'] })
      queryClient.invalidateQueries({ queryKey: ['reportsDashboard'] })
    } catch (error) {
      console.error('Failed to reject payment:', error)
      toast.error('Failed to reject payment')
    } finally {
      setRejectingId(null)
    }
  }

  const handleBulkAccept = async () => {
    setIsBulkAccepting(true)
    try {
      await Promise.all(selectedIds.map(id => paymentService.confirmPayment(id)))
      toast.success('Selected payments accepted successfully')
      setSelectedIds([])
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] })
      queryClient.invalidateQueries({ queryKey: ['bills'] })
      queryClient.invalidateQueries({ queryKey: ['reportsDashboard'] })
    } catch (error) {
      toast.error('Failed to accept some payments')
    } finally {
      setIsBulkAccepting(false)
    }
  }

  const handleBulkReject = async () => {
    setIsBulkRejecting(true)
    try {
      await Promise.all(selectedIds.map(id => paymentService.rejectPayment(id)))
      toast.success('Selected payments rejected successfully')
      setSelectedIds([])
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] })
      queryClient.invalidateQueries({ queryKey: ['bills'] })
      queryClient.invalidateQueries({ queryKey: ['reportsDashboard'] })
    } catch (error) {
      toast.error('Failed to reject some payments')
    } finally {
      setIsBulkRejecting(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(myPendingPayments.map(p => p.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id))
    }
  }

  const getCustomerName = (billId: string) => {
    const bill = bills.find(b => b.id === billId)
    return bill?.drawee_name || 'Unknown'
  }

  return (
    <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 flex flex-col h-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
      <CardHeader className="pb-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
          <CheckSquare className="h-5 w-5 text-indigo-600" />
          Payment Acceptance
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-2">
            <Checkbox 
              id="selectAllPayments" 
              checked={myPendingPayments.length > 0 && selectedIds.length === myPendingPayments.length}
              onCheckedChange={(c) => handleSelectAll(c as boolean)}
              disabled={myPendingPayments.length === 0}
            />
            <label htmlFor="selectAllPayments" className="text-sm font-medium leading-none cursor-pointer text-zinc-700 dark:text-zinc-300">
              Select All
            </label>
          </div>
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 h-8"
            disabled={selectedIds.length === 0 || isBulkAccepting || isBulkRejecting}
            onClick={handleBulkAccept}
          >
            {isBulkAccepting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 h-8"
            disabled={selectedIds.length === 0 || isBulkAccepting || isBulkRejecting}
            onClick={handleBulkReject}
          >
            {isBulkRejecting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
            Reject
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 sticky top-0">
            <tr>
              <th className="px-4 py-3 w-10"></th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-400 mx-auto" />
                </td>
              </tr>
            ) : myPendingPayments.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  No pending payments to accept.
                </td>
              </tr>
            ) : (
              myPendingPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-4 py-3">
                    <Checkbox 
                      checked={selectedIds.includes(payment.id)}
                      onCheckedChange={(checked) => handleSelectRow(payment.id, checked as boolean)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{getCustomerName(payment.bill_id)}</div>
                    <div className="text-xs text-zinc-500">{formatDate(payment.payment_date)}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-right text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        className="bg-indigo-600 hover:bg-indigo-700 h-8 px-2"
                        disabled={confirmingId === payment.id || rejectingId === payment.id}
                        onClick={() => handleAccept(payment.id)}
                      >
                        {confirmingId === payment.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 h-8 px-2"
                        disabled={confirmingId === payment.id || rejectingId === payment.id}
                        onClick={() => handleReject(payment.id)}
                      >
                        {rejectingId === payment.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
