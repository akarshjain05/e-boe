import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, ChevronRight, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { customerService } from '@/api/services/customers'
import { billService } from '@/api/services/bills'
import { BillPaymentsModal } from '@/components/modals/BillPaymentsModal'

export function ReceivablesTab() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers()
  })

  const { data: allReceivableBills = [], isLoading: billsLoading } = useQuery({
    queryKey: ['all-receivable-bills'],
    queryFn: () => billService.getBills({ bill_type: 'receivable' })
  })

  if (customersLoading || billsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Group all receivable bills by their drawee/customer
  const activeCustomersMap = new Map();

  allReceivableBills.forEach((bill: any) => {
    const matchingCustomer = customers.find(c => c.id === bill.customer_id || (c as any).company_id === bill.network_drawee_company_id || c.name === bill.drawee_name);
    const key = matchingCustomer ? matchingCustomer.id : (bill.network_drawee_company_id || bill.drawee_name);
    
    if (!activeCustomersMap.has(key)) {
      activeCustomersMap.set(key, {
        ...(matchingCustomer || {
          id: key,
          name: bill.drawee_name,
          email: '',
          phone: '',
          customer_code: 'Network',
        }),
        calculated_outstanding: 0,
        hasBills: true
      });
    }
    
    const entry = activeCustomersMap.get(key);
    entry.calculated_outstanding += Number(bill.outstanding_amount || 0);
  });

  const activeCustomers = Array.from(activeCustomersMap.values());

  if (selectedCustomerId) {
    const customer = activeCustomers.find(c => c.id === selectedCustomerId) || customers.find(c => c.id === selectedCustomerId)
    return (
      <CustomerBillsView 
        customer={customer} 
        onBack={() => setSelectedCustomerId(null)} 
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Customers</h2>
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input placeholder="Search customers..." className="pl-9" />
        </div>
      </div>

      <div className="grid gap-4">
        {activeCustomers.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">No active receivables found.</div>
        ) : activeCustomers.map((customer: any, idx: number) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={customer.id}
          >
            <Card 
              className="cursor-pointer hover:border-indigo-500/50 hover:shadow-md transition-all group"
              onClick={() => setSelectedCustomerId(customer.id)}
            >
              <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    {customer.name}
                    <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {customer.customer_code}
                    </span>
                  </h3>
                  <div className="text-sm text-zinc-500 mt-1 flex items-center gap-4">
                    <span>{customer.email}</span>
                    <span>{customer.phone}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-zinc-500">Outstanding</p>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(customer.calculated_outstanding || 0)}
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

function CustomerBillsView({ customer, onBack }: { customer: any, onBack: () => void }) {
  const [selectedBillForPayments, setSelectedBillForPayments] = useState<any>(null)
  
  const { data: bills = [], isLoading, refetch } = useQuery({
    queryKey: ['customer-bills', customer.id],
    queryFn: () => billService.getBills({ bill_type: 'receivable' }).then(res => 
      res.filter(b => b.customer_id === customer.id || b.network_drawee_company_id === customer.id || (customer as any).company_id === b.network_drawee_company_id || b.drawee_name === customer.name)
    )
  })

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>&larr; Back to Customers</Button>
        <div>
          <h2 className="text-2xl font-bold">{customer.name}</h2>
          <p className="text-zinc-500">Receivable Bills</p>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Click "View Payments" to confirm pending receipts.</label>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
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
              <tr><td colSpan={7} className="text-center py-8 text-zinc-500">No bills found for this customer.</td></tr>
            ) : bills.map((bill: any, idx: number) => {
              const isReceivable = Number(bill.outstanding_amount) > 0
              return (
                <motion.tr 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}
                  key={bill.id}
                  className={`border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50`}
                >
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
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isReceivable ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {bill.status}
                      </span>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-xs border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 ml-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedBillForPayments(bill)
                        }}
                      >
                        View Payments
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      <BillPaymentsModal 
        open={!!selectedBillForPayments}
        onOpenChange={(open) => !open && setSelectedBillForPayments(null)}
        bill={selectedBillForPayments}
        onSuccess={() => refetch()}
      />
    </div>
  )
}
