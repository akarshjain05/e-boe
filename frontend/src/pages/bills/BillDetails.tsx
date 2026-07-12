import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, XCircle, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { billService } from '@/api/services/bills'
import { toast } from 'sonner'
import { RecordPaymentModal } from '@/components/modals/RecordPaymentModal'

export default function BillDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  const { data: bill, isLoading, isError } = useQuery({
    queryKey: ['bill', id],
    queryFn: () => billService.getBill(id!),
    enabled: !!id
  })

  const statusMutation = useMutation({
    mutationFn: ({ status, notes }: { status: string, notes?: string }) => billService.updateBillStatus(id!, status, notes),
    onSuccess: (_data, variables) => {
      toast.success('Bill status updated successfully')
      if (variables.status === 'pending_acceptance') {
        navigate('/bills')
      } else {
        queryClient.invalidateQueries({ queryKey: ['bill', id] })
      }
    },
    onError: () => {
      toast.error('Failed to update bill status')
    }
  })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (isError || !bill) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <p className="text-zinc-500">Failed to load bill details.</p>
        <Button onClick={() => navigate(-1)} variant="outline">Go Back</Button>
      </div>
    )
  }

  const handleStatusChange = (status: string) => {
    statusMutation.mutate({ status })
  }

  return (
    <div className="space-y-6 pb-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/bills')} className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{bill.bill_number}</h1>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">Issued to {bill.drawee_name} on {formatDate(bill.issue_date)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => window.open(billService.getBillPdfUrl(bill.id), '_blank')}>
            <Download className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Bill Preview Card */}
          <Card className="border-none shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white">
            <div className="h-2 w-full bg-indigo-600 rounded-t-xl" />
            <CardContent className="p-8 md:p-12 space-y-10 text-zinc-900">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold text-indigo-950 uppercase tracking-tight">Bill of Exchange</h2>
                  <p className="text-zinc-500 mt-1 font-medium">{bill.bill_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-500 font-medium">Amount</p>
                  <p className="text-3xl font-bold text-indigo-600">{formatCurrency(bill.total_amount)}</p>
                </div>
              </div>

              {/* Dates */}
              <div className="flex gap-12 border-y border-zinc-100 py-6">
                <div>
                  <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Date of Issue</p>
                  <p className="font-medium mt-1">{formatDate(bill.issue_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Due Date</p>
                  <p className="font-medium mt-1">{formatDate(bill.due_date)}</p>
                </div>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2">Drawer (Creator)</p>
                  <p className="font-bold text-zinc-900">{bill.drawer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2">Drawee (Payer)</p>
                  <p className="font-bold text-zinc-900">{bill.customer?.name || bill.drawee_name}</p>
                  {bill.customer?.address && <p className="text-sm text-zinc-600 whitespace-pre-wrap">{bill.customer.address}</p>}
                </div>
              </div>

              {/* Items Table */}
              <div>
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold rounded-tl-lg">Description</th>
                      <th className="px-4 py-3 font-semibold">Qty</th>
                      <th className="px-4 py-3 font-semibold">Price</th>
                      <th className="px-4 py-3 font-semibold">Tax</th>
                      <th className="px-4 py-3 font-semibold text-right rounded-tr-lg">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.items.map(item => (
                      <tr key={item.id} className="border-b border-zinc-100 last:border-0">
                        <td className="px-4 py-4">
                          <div className="font-medium text-zinc-900">{item.description}</div>
                          {item.hsn_code && <div className="text-xs text-zinc-500 mt-1">HSN: {item.hsn_code}</div>}
                        </td>
                        <td className="px-4 py-4">{item.quantity}</td>
                        <td className="px-4 py-4">{formatCurrency(item.unit_price)}</td>
                        <td className="px-4 py-4">{item.tax_rate}%</td>
                        <td className="px-4 py-4 text-right font-medium">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Signature */}
              <div className="flex flex-col md:flex-row justify-between gap-8 pt-4 border-t border-zinc-200">
                <div className="flex-1 max-w-sm">
                  <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2">Terms & Conditions</p>
                  <p className="text-xs text-zinc-600 leading-relaxed">{bill.terms_and_conditions || 'None'}</p>
                  
                  <div className="mt-8 border-t-2 border-zinc-300 border-dashed w-48 pt-2">
                    <p className="text-xs text-zinc-500 font-medium text-center">Authorized Signature</p>
                  </div>
                </div>
                <div className="w-64 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Subtotal</span>
                    <span className="font-medium">{formatCurrency(bill.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Tax</span>
                    <span className="font-medium">{formatCurrency(bill.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Discount</span>
                    <span className="font-medium">-{formatCurrency(bill.discount_amount)}</span>
                  </div>
                  <div className="pt-3 border-t border-zinc-200 flex justify-between">
                    <span className="font-bold text-zinc-900">Total</span>
                    <span className="font-bold text-lg text-indigo-600">{formatCurrency(bill.total_amount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          {/* Drawer Actions */}
          {(bill.bill_type === 'receivable' && bill.status === 'draft') && (
            <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg">Lifecycle Actions</CardTitle>
                <CardDescription>Actions available for the current state.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => handleStatusChange('pending_acceptance')} 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
                  disabled={statusMutation.isPending}
                >
                  {statusMutation.isPending && statusMutation.variables?.status === 'pending_acceptance' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Send Bill to Drawee
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Drawee Actions */}
          {(bill.bill_type === 'payable' && bill.status === 'pending_acceptance') && (
            <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg">Lifecycle Actions</CardTitle>
                <CardDescription>Actions available for the current state.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => handleStatusChange('accepted')} 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
                  disabled={statusMutation.isPending}
                >
                  {statusMutation.isPending && statusMutation.variables?.status === 'accepted' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Accept Bill
                </Button>
                <Button 
                  onClick={() => handleStatusChange('rejected')} 
                  variant="outline" 
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-2"
                  disabled={statusMutation.isPending}
                >
                  {statusMutation.isPending && statusMutation.variables?.status === 'rejected' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Reject Bill
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      <RecordPaymentModal 
        open={isPaymentModalOpen} 
        onOpenChange={setIsPaymentModalOpen} 
        defaultBillId={bill.id} 
      />
    </div>
  )
}
