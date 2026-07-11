import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PayablesTab } from '@/components/payments/PayablesTab'
import { ReceivablesTab } from '@/components/payments/ReceivablesTab'

export default function Payments() {

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Payments</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Track and manage all payment receipts against bills.</p>
        </div>
      </div>

      <Tabs defaultValue="receivables" className="w-full space-y-6">
        <TabsList className="mb-6 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <TabsTrigger value="receivables">Receivables / Receive</TabsTrigger>
          <TabsTrigger value="payables">Payables / Paid</TabsTrigger>
        </TabsList>

      
      <TabsContent value="payables">
        <PayablesTab />
      </TabsContent>

      <TabsContent value="receivables">
        <ReceivablesTab />
      </TabsContent>
      </Tabs>
    </div>
  )
}
