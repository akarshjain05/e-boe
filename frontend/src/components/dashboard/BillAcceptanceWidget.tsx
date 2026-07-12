import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { billService } from '@/api/services/bills'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Loader2, CheckCircle2, XCircle, FileCheck } from 'lucide-react'
import { toast } from 'sonner'

export function BillAcceptanceWidget() {
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
    <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 flex flex-col h-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
      <CardHeader className="pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
          <FileCheck className="h-5 w-5 text-indigo-600" />
          Bill Acceptance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 sticky top-0">
            <tr>
              <th className="px-4 py-3 font-medium">Bill Issuer</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-400 mx-auto" />
                </td>
              </tr>
            ) : bills.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-zinc-500">
                  No pending bills to accept.
                </td>
              </tr>
            ) : (
              bills.map((bill) => (
                <tr key={bill.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{bill.drawer_name}</div>
                    <div className="text-xs text-zinc-500">{bill.bill_number}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-right text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(bill.total_amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        className="bg-indigo-600 hover:bg-indigo-700 h-8 px-2"
                        disabled={acceptingId === bill.id || rejectingId === bill.id}
                        onClick={() => handleAccept(bill.id)}
                      >
                        {acceptingId === bill.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 h-8 px-2"
                        disabled={acceptingId === bill.id || rejectingId === bill.id}
                        onClick={() => handleReject(bill.id)}
                      >
                        {rejectingId === bill.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
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
