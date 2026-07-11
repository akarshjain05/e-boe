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
  onSuccess: () => void
}

export function BillPaymentsModal({ open, onOpenChange, bill, onSuccess }: BillPaymentsModalProps) {
  const { data: payments = [], isLoading, refetch } = useQuery({
    queryKey: ['bill-payments', bill?.id],
    queryFn: () => paymentService.getPaymentsForBill(bill?.id),
    enabled: !!bill?.id && open
  })

  const [confirmingId, setConfirmingId] = useState<string | null>(null)

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Payments for Bill {bill?.bill_number}</DialogTitle>
          <DialogDescription>
            Outstanding Balance: {formatCurrency(bill?.outstanding_amount || 0)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          ) : payments.length === 0 ? (
            <p className="text-center text-zinc-500 py-8">No payments found for this bill.</p>
          ) : (
            <div className="space-y-3">
              {payments.map(payment => (
                <div key={payment.id} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-lg text-zinc-900 dark:text-zinc-50">
                      {formatCurrency(payment.amount)}
                    </div>
                    <div className="text-sm text-zinc-500 mt-1">
                      {formatDate(payment.payment_date)} &middot; {payment.receipt_number}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {payment.status === 'pending_confirmation' && (
                      <Button 
                        size="sm" 
                        className="bg-indigo-600 hover:bg-indigo-700"
                        disabled={confirmingId === payment.id}
                        onClick={() => handleConfirm(payment.id)}
                      >
                        {confirmingId === payment.id ? 'Confirming...' : 'Confirm Receipt'}
                      </Button>
                    )}
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      payment.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 
                      payment.status === 'pending_confirmation' ? 'bg-amber-100 text-amber-700' : 
                      'bg-zinc-100 text-zinc-700'
                    }`}>
                      {payment.status === 'pending_confirmation' ? 'Pending' : payment.status}
                    </span>
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
