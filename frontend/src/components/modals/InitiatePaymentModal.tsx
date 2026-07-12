import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { paymentService } from '@/api/services/payments'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface InitiatePaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bill: any
  onSuccess: () => void
}

export function InitiatePaymentModal({ open, onOpenChange, bill, onSuccess }: InitiatePaymentModalProps) {
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const maxAmount = Number(bill?.outstanding_amount || 0)
  const today = new Date().toISOString().split('T')[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bill || !amount) return
    
    const payAmount = Number(amount)
    if (payAmount <= 0 || payAmount > maxAmount) return

    setIsSubmitting(true)
    try {
      await paymentService.recordPayment({
        bill_id: bill.id,
        amount: payAmount,
        payment_method: paymentMethod as any,
        payment_date: today,
      })
      onSuccess()
      onOpenChange(false)
      setAmount('')
    } catch (error) {
      console.error('Failed to initiate payment', error)
      // Per instructions: don't show that payment failed for now
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Initiate Payment</DialogTitle>
          <DialogDescription>
            Enter the amount you wish to pay for bill <strong>{bill?.bill_number}</strong>.
            <br/>
            Outstanding Balance: {formatCurrency(maxAmount)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bill Number</Label>
              <Input value={bill?.bill_number || ''} disabled className="bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input value={formatDate(today)} disabled className="bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">Payment Amount</Label>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="full_payment" 
                  checked={Number(amount) === maxAmount && maxAmount > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setAmount(maxAmount.toString())
                    } else {
                      setAmount('')
                    }
                  }}
                />
                <label
                  htmlFor="full_payment"
                  className="text-sm font-medium leading-none text-zinc-500 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Do full payment
                </label>
              </div>
            </div>
            <Input
              id="amount"
              type="number"
              step="0.01"
              max={maxAmount}
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Max: ${maxAmount}`}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Mode of Payment</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select mode of payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !amount || Number(amount) > maxAmount || Number(amount) <= 0}>
              {isSubmitting ? 'Processing...' : 'Pay'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
