import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, ChevronRight, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { creditorService } from '@/api/services/creditors'
import { billService } from '@/api/services/bills'
import { paymentService, BulkPaymentCreate } from '@/api/services/payments'

export function PayablesTab() {
  const [selectedCreditorId, setSelectedCreditorId] = useState<string | null>(null)
  
  const { data: creditors = [], isLoading: creditorsLoading } = useQuery({
    queryKey: ['creditors'],
    queryFn: () => creditorService.getCreditors()
  })

  if (creditorsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (selectedCreditorId) {
    const creditor = creditors.find(c => c.id === selectedCreditorId)
    return (
      <CreditorBillsView 
        creditor={creditor} 
        onBack={() => setSelectedCreditorId(null)} 
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Creditors</h2>
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input placeholder="Search creditors..." className="pl-9" />
        </div>
      </div>

      <div className="grid gap-4">
        {creditors.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">No creditors found.</div>
        ) : creditors.map((creditor: any, idx: number) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={creditor.id}
          >
            <Card 
              className="cursor-pointer hover:border-indigo-500/50 hover:shadow-md transition-all group"
              onClick={() => setSelectedCreditorId(creditor.id)}
            >
              <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    {creditor.name}
                    <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {creditor.creditor_code}
                    </span>
                  </h3>
                  <div className="text-sm text-zinc-500 mt-1 flex items-center gap-4">
                    <span>{creditor.email}</span>
                    <span>{creditor.phone}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-zinc-500">Outstanding</p>
                    <p className="font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(creditor.outstanding_balance || 0)}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                    <ChevronRight className="h-5 w-5 text-zinc-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function CreditorBillsView({ creditor, onBack }: { creditor: any, onBack: () => void }) {
  const [selectedBills, setSelectedBills] = useState<string[]>([])
  
  const { data: bills = [], isLoading, refetch } = useQuery({
    queryKey: ['creditor-bills', creditor.id],
    queryFn: () => billService.getBills({ bill_type: 'payable', creditor_id: creditor.id }).then(res => 
      res.filter(b => b.creditor_id === creditor.id || b.drawee_creditor_id === creditor.id)
    )
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBills(bills.filter(b => Number(b.outstanding_amount) > 0).map(b => b.id))
    } else {
      setSelectedBills([])
    }
  }

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) setSelectedBills(prev => [...prev, id])
    else setSelectedBills(prev => prev.filter(bId => bId !== id))
  }

  const handlePaySelected = async () => {
    if (selectedBills.length === 0) return
    
    // Calculate totals and format for bulk payment
    const paymentsToMake = selectedBills.map(id => {
      const bill = bills.find(b => b.id === id)
      return {
        bill_id: id,
        amount: Number(bill?.outstanding_amount || 0)
      }
    })

    const payload: BulkPaymentCreate = {
      payments: paymentsToMake,
      payment_method: 'bank_transfer',
      payment_date: new Date().toISOString().split('T')[0],
      notes: `Bulk payment to ${creditor.name}`
    }

    try {
      await paymentService.recordBulkPayment(payload)
      setSelectedBills([])
      refetch()
      alert("Payment successful!")
    } catch (e) {
      console.error(e)
      alert("Payment failed.")
    }
  }

  const totalSelectedAmount = selectedBills.reduce((acc, id) => {
    const bill = bills.find(b => b.id === id)
    return acc + Number(bill?.outstanding_amount || 0)
  }, 0)

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>&larr; Back to Creditors</Button>
        <div>
          <h2 className="text-2xl font-bold">{creditor.name}</h2>
          <p className="text-zinc-500">Payable Bills</p>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Checkbox 
            checked={selectedBills.length > 0 && selectedBills.length === bills.filter(b => Number(b.outstanding_amount) > 0).length} 
            onCheckedChange={handleSelectAll} 
            id="select-all"
          />
          <label htmlFor="select-all" className="text-sm font-medium">Select All Payable</label>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-sm text-zinc-500">Selected Amount: </span>
            <span className="font-bold text-lg text-indigo-600">{formatCurrency(totalSelectedAmount)}</span>
          </div>
          <Button 
            onClick={handlePaySelected} 
            disabled={selectedBills.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Pay Selected ({selectedBills.length})
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-4 w-12"></th>
              <th className="px-6 py-4 font-semibold">Bill No.</th>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Due Date</th>
              <th className="px-6 py-4 font-semibold text-right">Amount</th>
              <th className="px-6 py-4 font-semibold text-right">Outstanding</th>
              <th className="px-6 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-8">Loading bills...</td></tr>
            ) : bills.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-zinc-500">No bills found for this creditor.</td></tr>
            ) : bills.map((bill: any, idx: number) => {
              const isPayable = Number(bill.outstanding_amount) > 0
              return (
                <motion.tr 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}
                  key={bill.id}
                  className={`border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 ${selectedBills.includes(bill.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                >
                  <td className="px-6 py-4">
                    <Checkbox 
                      checked={selectedBills.includes(bill.id)} 
                      onCheckedChange={(c) => handleSelect(bill.id, !!c)}
                      disabled={!isPayable}
                    />
                  </td>
                  <td className="px-6 py-4 font-medium">{bill.bill_number}</td>
                  <td className="px-6 py-4 text-zinc-600">{formatDate(bill.issue_date)}</td>
                  <td className="px-6 py-4 text-zinc-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                      {formatDate(bill.due_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">{formatCurrency(bill.total_amount)}</td>
                  <td className="px-6 py-4 text-right font-semibold text-red-600">{formatCurrency(bill.outstanding_amount)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isPayable ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {bill.status}
                      </span>
                      {bill.status === 'pending_acceptance' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-xs border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                          onClick={async (e) => {
                            e.stopPropagation()
                            try {
                              await billService.updateBillStatus(bill.id, 'accepted')
                              refetch()
                            } catch (error) {
                              console.error('Failed to accept bill:', error)
                            }
                          }}
                        >
                          Accept
                        </Button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
