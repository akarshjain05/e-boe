import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { boeService } from '@/api/services/billsOfExchange'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency } from '@/lib/utils'
import { Loader2, CheckCircle2, XCircle, FileSignature } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

export function BoeAcceptanceWidget() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['bills-of-exchange'],
    queryFn: () => boeService.getBillsOfExchange()
  })

  // Filter bills awaiting acceptance by the current user's company
  const pendingBoes = bills.filter(
    (b: any) => b.network_drawee_company_id === user?.company_id && ['issued', 'sent'].includes(b.status)
  )

  const acceptMutation = useMutation({
    mutationFn: (id: string) => boeService.acceptBillOfExchange(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills-of-exchange'] })
      toast.success('Bill of Exchange accepted successfully')
    },
    onError: () => toast.error('Failed to accept Bill of Exchange')
  })

  const rejectMutation = useMutation({
    mutationFn: (id: string) => boeService.rejectBill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills-of-exchange'] })
      toast.success('Bill of Exchange rejected')
    },
    onError: () => toast.error('Failed to reject Bill of Exchange')
  })

  const handleBulkAccept = async () => {
    try {
      await Promise.all(selectedIds.map(id => acceptMutation.mutateAsync(id)))
      setSelectedIds([])
    } catch (error) {
      console.error(error)
    }
  }

  const handleBulkReject = async () => {
    try {
      await Promise.all(selectedIds.map(id => rejectMutation.mutateAsync(id)))
      setSelectedIds([])
    } catch (error) {
      console.error(error)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(pendingBoes.map((b: any) => b.id))
    else setSelectedIds([])
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) setSelectedIds(prev => [...prev, id])
    else setSelectedIds(prev => prev.filter(i => i !== id))
  }

  const isWorking = acceptMutation.isPending || rejectMutation.isPending

  return (
    <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 flex flex-col h-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
      <CardHeader className="pb-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50 shrink-0">
          <FileSignature className="h-5 w-5 text-indigo-600" />
          BoE Acceptance
        </CardTitle>
        <div className="flex items-center flex-wrap gap-2 w-full xl:w-auto xl:justify-end">
          <div className="flex items-center gap-2 mr-2">
            <Checkbox 
              id="selectAllBoes" 
              checked={pendingBoes.length > 0 && selectedIds.length === pendingBoes.length}
              onCheckedChange={(c) => handleSelectAll(c as boolean)}
              disabled={pendingBoes.length === 0}
            />
            <label htmlFor="selectAllBoes" className="text-sm font-medium leading-none cursor-pointer text-zinc-700 dark:text-zinc-300">
              Select All
            </label>
          </div>
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 h-8"
            disabled={selectedIds.length === 0 || isWorking}
            onClick={handleBulkAccept}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 h-8"
            disabled={selectedIds.length === 0 || isWorking}
            onClick={handleBulkReject}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Reject
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 sticky top-0">
            <tr>
              <th className="px-4 py-3 w-10"></th>
              <th className="px-4 py-3 font-medium">Drawer</th>
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
            ) : pendingBoes.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  No pending BoEs to accept.
                </td>
              </tr>
            ) : (
              pendingBoes.map((boe: any) => (
                <tr key={boe.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-4 py-3">
                    <Checkbox 
                      checked={selectedIds.includes(boe.id)}
                      onCheckedChange={(checked) => handleSelectRow(boe.id, checked as boolean)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{boe.drawer_name}</div>
                    <div className="text-xs text-zinc-500">{boe.id.substring(0, 8)}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-right text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(boe.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        className="bg-indigo-600 hover:bg-indigo-700 h-8 px-2"
                        disabled={isWorking}
                        onClick={() => acceptMutation.mutate(boe.id)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 h-8 px-2"
                        disabled={isWorking}
                        onClick={() => rejectMutation.mutate(boe.id)}
                      >
                        <XCircle className="h-4 w-4" />
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
