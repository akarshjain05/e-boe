import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { billService } from '@/api/services/bills'
import { paymentService } from '@/api/services/payments'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Loader2, CheckCircle2, XCircle, CheckSquare } from 'lucide-react'
import { toast } from 'sonner'

export default function PaymentAcceptance() {
  const queryClient = useQueryClient()
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)

  // Fetch all receivable bills
  const { data: bills = [], isLoading: isLoadingBills } = useQuery({
    queryKey: ['receivable-bills'],
    queryFn: () => billService.getBills({ bill_type: 'receivable' })
  })

  // Fetch all pending_confirmation payments
  const { data: payments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ['pending-payments'],
    queryFn: () => paymentService.getPayments({ status: 'pending_confirmation' })
  })

  // Filter payments to only include those belonging to our receivable bills
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

  const getCustomerName = (billId: string) => {
    const bill = bills.find(b => b.id === billId)
    return bill?.drawee_name || 'Unknown Customer'
  }

  const getBillNumber = (billId: string) => {
    const bill = bills.find(b => b.id === billId)
    return bill?.bill_number || 'Unknown Bill'
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <CheckSquare className="h-8 w-8 text-indigo-600" />
            Payment Acceptance
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Review and accept incoming payments from your customers.</p>
        </div>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Customer Name</th>
                  <th className="px-6 py-4 font-medium">Bill Number</th>
                  <th className="px-6 py-4 font-medium">Payment Date</th>
                  <th className="px-6 py-4 font-medium text-right">Amount</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-zinc-400 mx-auto" />
                    </td>
                  </tr>
                ) : myPendingPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      No pending payments to accept.
                    </td>
                  </tr>
                ) : (
                  myPendingPayments.map((payment) => (
                    <tr key={payment.id} className="bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                        {getCustomerName(payment.bill_id)}
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                        {getBillNumber(payment.bill_id)}
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                        {formatDate(payment.payment_date)}
                      </td>
                      <td className="px-6 py-4 font-medium text-right text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            className="bg-indigo-600 hover:bg-indigo-700"
                            disabled={confirmingId === payment.id || rejectingId === payment.id}
                            onClick={() => handleAccept(payment.id)}
                          >
                            {confirmingId === payment.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
                            disabled={confirmingId === payment.id || rejectingId === payment.id}
                            onClick={() => handleReject(payment.id)}
                          >
                            {rejectingId === payment.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
