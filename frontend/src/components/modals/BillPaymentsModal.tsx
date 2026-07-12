import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { paymentService } from '@/api/services/payments'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

interface BillPaymentsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bill: any
  customerBills?: any[]
  onSuccess: () => void
}

export function BillPaymentsModal({ open, onOpenChange, bill, customerBills, onSuccess }: BillPaymentsModalProps) {
  const isAll = bill?.isAll;

  const { data: allPayments = [], isLoading, refetch } = useQuery({
    queryKey: ['bill-payments', isAll ? 'all' : bill?.id],
    queryFn: async () => {
      if (isAll && customerBills) {
        const promises = customerBills.map(b => paymentService.getPaymentsForBill(b.id).catch(() => []));
        const results = await Promise.all(promises);
        return results.flat();
      }
      return paymentService.getPaymentsForBill(bill?.id);
    },
    enabled: (!!bill?.id || !!isAll) && open
  })

  // We only care about pending_confirmation for the confirmation flow
  const payments = allPayments.filter(p => p.status === 'pending_confirmation')

  // Create a map to look up bill numbers
  const billMap = new Map();
  if (isAll && customerBills) {
    customerBills.forEach(b => billMap.set(b.id, b.bill_number));
  } else if (bill) {
    billMap.set(bill.id, bill.bill_number);
  }

  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)

  const handleConfirm = async (paymentId: string) => {
    setConfirmingId(paymentId)
    try {
      await paymentService.confirmPayment(paymentId)
      refetch()
      onSuccess()
    } catch (error) {
      console.error('Failed to confirm payment', error)
    } finally {
      setConfirmingId(null)
    }
  }

  const handleReject = async (paymentId: string) => {
    setRejectingId(paymentId)
    try {
      await paymentService.rejectPayment(paymentId)
      refetch()
      onSuccess()
    } catch (error) {
      console.error('Failed to reject payment', error)
    } finally {
      setRejectingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isAll ? 'All Pending Payments' : `Payments for Bill ${bill?.bill_number}`}
          </DialogTitle>
          {!isAll && (
            <DialogDescription>
              Outstanding Balance: {formatCurrency(bill?.outstanding_amount || 0)}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          ) : payments.length === 0 ? (
            <p className="text-center text-zinc-500 py-8">
              {isAll ? 'No pending payments found for this customer.' : 'No pending payments found for this bill.'}
            </p>
          ) : (
            <div className="space-y-3">
              {payments.map(payment => (
                <div key={payment.id} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-lg text-zinc-900 dark:text-zinc-50">
                      {formatCurrency(payment.amount)}
                    </div>
                    <div className="text-sm text-zinc-500 mt-1">
                      {isAll ? <span className="font-semibold text-indigo-600 dark:text-indigo-400 mr-2">Bill: {billMap.get(payment.bill_id)}</span> : null}
                      {formatDate(payment.payment_date)} &middot; {payment.receipt_number}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {payment.status === 'pending_confirmation' && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="bg-indigo-600 hover:bg-indigo-700"
                          disabled={confirmingId === payment.id || rejectingId === payment.id}
                          onClick={() => handleConfirm(payment.id)}
                        >
                          {confirmingId === payment.id ? 'Confirming...' : 'Accept'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
                          disabled={confirmingId === payment.id || rejectingId === payment.id}
                          onClick={() => handleReject(payment.id)}
                        >
                          {rejectingId === payment.id ? 'Rejecting...' : 'Reject'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="mt-6 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
