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

  const isB2B = bill?.customer?.customer_type === 'B2B' || bill?.creditor?.creditor_type === 'B2B' || !!bill?.customer?.gst_number || bill?.bill_type === 'payable';
  const taxLabel = bill?.transaction_type === 'intra_state' ? 'CGST + SGST' : 'IGST';

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
    <div className="space-y-6 pb-8 max-w-7xl mx-auto">
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

      <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-3 gap-6">
        <div className="xl:col-span-3 lg:col-span-2 space-y-6">
          {/* Main Bill Preview Card */}
          {/* Main Bill Preview Card */}
          <Card className="border-none shadow-xl ring-1 ring-zinc-200 bg-white text-zinc-900">
            <CardContent className="p-8 md:p-12 space-y-8">
              
              {/* Header Section */}
              <div className="flex justify-between items-start pb-6 border-b border-zinc-200">
                <div className="flex items-center gap-6">
                  <div className="h-20 w-20 bg-zinc-100 border border-zinc-200 rounded flex items-center justify-center text-zinc-400 text-sm">
                    logo
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
                      {isB2B ? '[Your company name]' : '[Your business name]'}
                    </h2>
                    <p className="text-sm text-zinc-600 mt-1">[Address, city, state - pin]</p>
                    <p className="text-sm text-zinc-600 mt-0.5">
                      GSTIN: [seller gstin] {isB2B ? 'PAN: [seller pan]' : 'Phone: [phone]'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold text-zinc-900 tracking-tight mb-2">
                    {isB2B ? 'Tax invoice' : 'Retail invoice'}
                  </h2>
                  <p className="text-sm text-zinc-600">
                    Invoice no: {bill.bill_number}
                  </p>
                  <p className="text-sm text-zinc-600">
                    Date: {formatDate(bill.issue_date)}
                  </p>
                </div>
              </div>

              {/* Total Amount Payable Bar */}
              <div className="bg-indigo-950 text-white rounded-lg p-4 flex justify-between items-center">
                <span className="text-lg font-medium text-indigo-100">Total amount payable</span>
                <span className="text-3xl font-semibold tracking-tight">{formatCurrency(bill.total_amount)}</span>
              </div>

              {/* Customer Details Section */}
              {isB2B ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-50 rounded-lg p-5 border border-zinc-200">
                    <p className="text-xs text-zinc-500 font-medium uppercase mb-2">Bill to</p>
                    <p className="font-bold text-zinc-900 text-lg">{bill.customer?.name || bill.drawee_name}</p>
                    {bill.customer?.address ? (
                      <p className="text-sm text-zinc-600 mt-1">{bill.customer.address}</p>
                    ) : (
                      <p className="text-sm text-zinc-600 mt-1">[Buyer address, state]</p>
                    )}
                    <p className="text-sm text-zinc-600 mt-2">GSTIN: {bill.customer?.gst_number || '[buyer gstin]'}</p>
                  </div>
                  <div className="bg-zinc-50 rounded-lg p-5 border border-zinc-200">
                    <p className="text-xs text-zinc-500 font-medium uppercase mb-2">Ship to</p>
                    <p className="font-medium text-zinc-900">Same as billing address</p>
                    <p className="text-sm text-zinc-600 mt-1">Place of supply: [state, code]</p>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-50 rounded-lg p-5 border border-zinc-200">
                  <p className="text-xs text-zinc-500 font-medium mb-3">Customer details</p>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="font-bold text-zinc-900 text-base mb-1">Name: {bill.customer?.name || bill.drawee_name}</p>
                      <p className="text-sm text-zinc-600 mb-2">
                        Address: {bill.customer?.address || '[address, if delivery needed]'}
                      </p>
                      <p className="text-xs text-zinc-500">GSTIN not required for an unregistered / walk-in customer</p>
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900 text-base mb-1">
                        Phone: {bill.customer?.phone || '[phone, optional]'}
                      </p>
                      <p className="text-sm text-zinc-600">
                        State / place of supply: [state]
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-zinc-900 font-bold border-b-2 border-zinc-900 whitespace-nowrap">
                    <tr>
                      <th className="py-3 px-2 w-8">#</th>
                      <th className="py-3 px-2">{isB2B ? 'Description' : 'Item / service'}</th>
                      <th className="py-3 px-2">HSN/SAC</th>
                      <th className="py-3 px-2 text-right">Qty</th>
                      <th className="py-3 px-2 text-right">{isB2B ? 'Rate' : 'MRP/Rate'}</th>
                      {!isB2B && <th className="py-3 px-2 text-right">Discount</th>}
                      <th className="py-3 px-2 text-right">Taxable</th>
                      <th className="py-3 px-2 text-right">GST%</th>
                      {isB2B && <th className="py-3 px-2 text-right">{taxLabel}</th>}
                      <th className="py-3 px-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.items.map((item, idx) => (
                      <tr key={item.id} className="border-b border-zinc-200 text-zinc-800">
                        <td className="py-3 px-2">{idx + 1}</td>
                        <td className="py-3 px-2 font-medium">{item.description}</td>
                        <td className="py-3 px-2 text-zinc-600">{item.hsn_code || '-'}</td>
                        <td className="py-3 px-2 text-right">{item.quantity}</td>
                        <td className="py-3 px-2 text-right">{formatCurrency(item.unit_price)}</td>
                        {!isB2B && (
                          <td className="py-3 px-2 text-right">{item.discount_percent ? `${item.discount_percent}%` : '-'}</td>
                        )}
                        <td className="py-3 px-2 text-right">{formatCurrency(item.amount)}</td>
                        <td className="py-3 px-2 text-right">{item.tax_rate}%</td>
                        {isB2B && (
                          <td className="py-3 px-2 text-right">{formatCurrency(item.tax_amount)}</td>
                        )}
                        <td className="py-3 px-2 text-right font-medium">
                          {formatCurrency(item.amount + item.tax_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-zinc-500 mt-3 px-2">... add more rows{isB2B ? ', each row can carry its own GST slab (5/12/18/28%)' : ' — mixed GST slabs (5/12/18/28%) allowed on one bill'}</p>
              </div>

              {/* Summary Section */}
              <div className="flex justify-end pt-4 border-t border-zinc-200 mt-6">
                <div className="w-80 space-y-3">
                  {!isB2B && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600">Gross amount</span>
                      <span className="font-medium text-zinc-900">{formatCurrency(bill.amount + (bill.discount_amount || 0))}</span>
                    </div>
                  )}
                  {!isB2B && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600">Discount</span>
                      <span className="font-medium text-zinc-900">{formatCurrency(bill.discount_amount || 0)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">Taxable amount</span>
                    <span className="font-medium text-zinc-900">{formatCurrency(bill.amount)}</span>
                  </div>
                  
                  {isB2B && bill.discount_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600">Discount</span>
                      <span className="font-medium text-zinc-900">{formatCurrency(bill.discount_amount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">
                      {isB2B ? `Total tax (${taxLabel})` : taxLabel}
                    </span>
                    <span className="font-medium text-zinc-900">{formatCurrency(bill.tax_amount)}</span>
                  </div>

                  {!isB2B && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600">Round off</span>
                      <span className="font-medium text-zinc-900">₹0.00</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-zinc-900 flex justify-between items-center mt-2">
                    <span className="font-bold text-lg text-zinc-900">Amount payable</span>
                    <span className="font-bold text-xl text-zinc-900">{formatCurrency(bill.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Section */}
              <div className="flex justify-between items-end pt-12 border-t border-zinc-200 mt-12">
                <div>
                  <p className="text-sm text-zinc-600">
                    {isB2B ? 'Amount in words: [rupees ... only]' : 'Payment mode: Cash / UPI / Card'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-600">Authorised signatory</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="xl:col-span-1 lg:col-span-1 space-y-6">
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
