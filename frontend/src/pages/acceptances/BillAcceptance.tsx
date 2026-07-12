import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { billService } from '@/api/services/bills'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Loader2, CheckCircle2, XCircle, FileCheck } from 'lucide-react'
import { toast } from 'sonner'

export default function BillAcceptance() {
  const queryClient = useQueryClient()
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['bill-acceptances'],
    queryFn: () => billService.getBills({ bill_type: 'payable', status: 'pending_acceptance' })
  })

  const handleAccept = async (id: string) => {
    setAcceptingId(id)
    try {
      await billService.updateBillStatus(id, 'accepted')
      toast.success('Bill accepted successfully')
      queryClient.invalidateQueries({ queryKey: ['bill-acceptances'] })
      queryClient.invalidateQueries({ queryKey: ['bills'] })
      queryClient.invalidateQueries({ queryKey: ['reportsDashboard'] })
    } catch (error) {
      console.error('Failed to accept bill:', error)
      toast.error('Failed to accept bill')
    } finally {
      setAcceptingId(null)
    }
  }

  const handleReject = async (id: string) => {
    setRejectingId(id)
    try {
      await billService.updateBillStatus(id, 'rejected')
      toast.success('Bill rejected successfully')
      queryClient.invalidateQueries({ queryKey: ['bill-acceptances'] })
      queryClient.invalidateQueries({ queryKey: ['bills'] })
      queryClient.invalidateQueries({ queryKey: ['reportsDashboard'] })
    } catch (error) {
      console.error('Failed to reject bill:', error)
      toast.error('Failed to reject bill')
    } finally {
      setRejectingId(null)
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <FileCheck className="h-8 w-8 text-indigo-600" />
            Bill Acceptance
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Review and accept bills issued to you by vendors and suppliers.</p>
        </div>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Bill Issuer Name</th>
                  <th className="px-6 py-4 font-medium">Bill Number</th>
                  <th className="px-6 py-4 font-medium">Issue Date</th>
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
                ) : bills.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      No pending bills to accept.
                    </td>
                  </tr>
                ) : (
                  bills.map((bill) => (
                    <tr key={bill.id} className="bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                        {bill.drawer_name}
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                        {bill.bill_number}
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                        {formatDate(bill.issue_date)}
                      </td>
                      <td className="px-6 py-4 font-medium text-right text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(bill.total_amount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            className="bg-indigo-600 hover:bg-indigo-700"
                            disabled={acceptingId === bill.id || rejectingId === bill.id}
                            onClick={() => handleAccept(bill.id)}
                          >
                            {acceptingId === bill.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
                            disabled={acceptingId === bill.id || rejectingId === bill.id}
                            onClick={() => handleReject(bill.id)}
                          >
                            {rejectingId === bill.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
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
