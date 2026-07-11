import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Plus, Trash2, Loader2, Save, FileText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { formatCurrency } from '@/lib/utils'
import { billService } from '@/api/services/bills'
import { customerService } from '@/api/services/customers'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

// Schema for a single bill item
const billItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  hsn_code: z.string().optional(),
  quantity: z.coerce.number().min(0.01, 'Quantity must be > 0'),
  unit_price: z.coerce.number().min(0, 'Price must be >= 0'),
  tax_rate: z.coerce.number().min(0, 'Tax % must be >= 0').max(100, 'Tax % cannot exceed 100').default(18),
  discount_percent: z.coerce.number().min(0, 'Discount must be >= 0').max(100, 'Discount cannot exceed 100').optional().default(0),
})

// Schema for the entire bill
const createBillSchema = z.object({
  customer_id: z.string().min(1, 'Please select a customer'),
  bill_number: z.string().min(1, 'Bill number is required'),
  issue_date: z.string().min(1, 'Issue date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  credit_period_months: z.coerce.number().optional(),
  currency_code: z.string().default('INR'),
  
  transaction_type: z.enum(['intra_state', 'inter_state']).default('intra_state'),
  
  drawer_name: z.string().min(1, 'Drawer name is required'),
  drawee_name: z.string().min(1, 'Drawee name is required'),
  payee_name: z.string().min(1, 'Payee name is required'),
  
  terms_and_conditions: z.string().optional(),
  
  items: z.array(billItemSchema).min(1, 'At least one item is required'),
})

type CreateBillValues = z.infer<typeof createBillSchema>

export default function CreateBill() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const queryClient = useQueryClient()

  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers-dropdown'],
    queryFn: () => customerService.getCustomers({})
  })

  // Use auth context for defaults
  const { user } = useAuth()
  
  // Generate a random bill number on load
  const [defaultBillNumber] = useState(`BOE-${Math.floor(Date.now() / 1000)}`)

  const form = useForm<CreateBillValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createBillSchema) as any,
    defaultValues: {
      bill_number: defaultBillNumber,
      currency_code: 'INR',
      issue_date: new Date().toISOString().split('T')[0],
      drawer_name: user ? `${user.first_name} ${user.last_name}` : '',
      payee_name: user ? `${user.first_name} ${user.last_name}` : '',
      items: [
        { description: '', quantity: 1, unit_price: 0, tax_rate: 18, discount_percent: 0 }
      ]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items'
  })

  // Watch fields for calculations
  const items = form.watch('items')
  const transactionType = form.watch('transaction_type')
  
  const isIntraState = transactionType === 'intra_state'
  
  const calculateTotals = () => {
    let subtotal = 0
    let totalTax = 0
    let totalCgst = 0
    let totalSgst = 0
    let totalIgst = 0
    let totalDiscount = 0

    items.forEach(item => {
      const qty = Number(item.quantity) || 0
      const price = Number(item.unit_price) || 0
      const taxRate = Number(item.tax_rate) || 0
      const discountRate = Number(item.discount_percent) || 0

      const gross = qty * price
      const discount = gross * (discountRate / 100)
      const net = gross - discount
      const tax = net * (taxRate / 100)
      
      if (isIntraState) {
        totalCgst += tax / 2
        totalSgst += tax / 2
      } else {
        totalIgst += tax
      }

      subtotal += gross
      totalDiscount += discount
      totalTax += tax
    })

    return {
      subtotal,
      totalDiscount,
      totalTax,
      totalCgst,
      totalSgst,
      totalIgst,
      total: subtotal - totalDiscount + totalTax
    }
  }

  const totals = calculateTotals()

  const mutation = useMutation({
    mutationFn: billService.createBill,
    onSuccess: (data) => {
      toast.success('Bill created successfully')
      queryClient.invalidateQueries({ queryKey: ['bills'] })
      queryClient.invalidateQueries({ queryKey: ['reportsDashboard'] })
      navigate(`/bills/${data.id}`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create bill')
      setIsSubmitting(false)
    }
  })

  async function onSubmit(data: CreateBillValues) {
    setIsSubmitting(true)
    
    // Auto populate drawee name and state if we have the customer record
    const selectedCustomer = customers.find(c => c.id === data.customer_id)
    if (selectedCustomer) {
      if (!data.drawee_name) data.drawee_name = selectedCustomer.name
      // Assuming customer state might be available, for now user must enter it manually in Parties or it comes from addresses if expanded
    }
    
    mutation.mutate(data as any)
  }
  
  const issueDate = form.watch('issue_date')
  
  const handleCreditPeriodChange = (val: string) => {
    const months = parseFloat(val)
    form.setValue('credit_period_months', isNaN(months) ? undefined : months)
    
    if (!isNaN(months) && issueDate) {
      const issue = new Date(issueDate)
      issue.setMonth(issue.getMonth() + Math.floor(months))
      issue.setDate(issue.getDate() + Math.round((months % 1) * 30))
      form.setValue('due_date', issue.toISOString().split('T')[0], { shouldValidate: true })
    }
  }

  const handleDueDateChange = (val: string) => {
    form.setValue('due_date', val)
    if (val && issueDate) {
        const issue = new Date(issueDate).getTime()
        const due = new Date(val).getTime()
        const diffDays = (due - issue) / (1000 * 60 * 60 * 24)
        const months = Math.round((diffDays / 30) * 10) / 10
        form.setValue('credit_period_months', months > 0 ? months : 0, { shouldValidate: true })
    }
  }

  return (
    <div className="space-y-6 pb-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Create Bill</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">Draft a new bill of exchange.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button onClick={form.handleSubmit(onSubmit)} className="bg-indigo-600 hover:bg-indigo-700 shadow-sm gap-2" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Bill
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Primary Details */}
              <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg">Primary Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="customer_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer (Drawee)</FormLabel>
                        <select 
                          className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e)
                            const selectedCustomer = customers.find(c => c.id === e.target.value)
                            if (selectedCustomer) {
                              form.setValue('drawee_name', selectedCustomer.name, { shouldValidate: true })
                            }
                          }}
                          disabled={isLoadingCustomers}
                        >
                          <option value="">Select a customer</option>
                          {customers.map(customer => (
                            <option key={customer.id} value={customer.id}>
                              {customer.name}
                            </option>
                          ))}
                        </select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="bill_number" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bill Number</FormLabel>
                      <FormControl><Input placeholder="BOE-2023-001" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="issue_date" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="credit_period_months" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit Period (months)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="any" 
                          placeholder="e.g. 1.5" 
                          value={field.value ?? ''} 
                          onChange={(e) => handleCreditPeriodChange(e.target.value)} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="due_date" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          value={field.value} 
                          onChange={(e) => handleDueDateChange(e.target.value)} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="transaction_type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type of Transaction</FormLabel>
                      <FormControl>
                        <select 
                          className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300"
                          {...field}
                        >
                          <option value="intra_state">Intra-State (Within State)</option>
                          <option value="inter_state">Inter-State (Outside State)</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              {/* Line Items */}
              <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg">Line Items</CardTitle>
                    <CardDescription>Add the goods or services for this bill.</CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', quantity: 1, unit_price: 0, tax_rate: 18, discount_percent: 0 })} className="gap-2">
                    <Plus className="h-4 w-4" /> Add Item
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-4 relative">
                      <div className="absolute top-4 right-4">
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pr-10">
                        <FormField control={form.control} name={`items.${index}.description`} render={({ field }) => (
                          <FormItem className="sm:col-span-12">
                            <FormLabel>Description</FormLabel>
                            <FormControl><Input placeholder="Item description..." {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        
                        <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                          <FormItem className="sm:col-span-3">
                            <FormLabel>Quantity</FormLabel>
                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name={`items.${index}.unit_price`} render={({ field }) => (
                          <FormItem className="sm:col-span-3">
                            <FormLabel>Price</FormLabel>
                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name={`items.${index}.discount_percent`} render={({ field }) => (
                          <FormItem className="sm:col-span-3">
                            <FormLabel>Discount (%)</FormLabel>
                            <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name={`items.${index}.tax_rate`} render={({ field }) => (
                          <FormItem className="sm:col-span-3">
                            <FormLabel>GST (%)</FormLabel>
                            <FormControl>
                              <select 
                                className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              >
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </div>
                  ))}
                  {fields.length === 0 && (
                    <div className="text-center py-8 text-zinc-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No items added. Add an item to proceed.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Parties */}
              <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg">Parties</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4">
                  <FormField control={form.control} name="drawer_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Drawer (Creator)</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="drawee_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Drawee (Payer)</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="payee_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payee (Receiver)</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Summary */}
            <div className="space-y-6">
              <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Subtotal</span>
                    <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  {totals.totalDiscount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Discount</span>
                      <span className="font-medium">-{formatCurrency(totals.totalDiscount)}</span>
                    </div>
                  )}
                  {totals.totalTax > 0 && (
                    <div className="space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-2 mt-2">
                      {totals.totalCgst > 0 && (
                        <div className="flex justify-between text-sm text-zinc-500">
                          <span>CGST</span>
                          <span>{formatCurrency(totals.totalCgst)}</span>
                        </div>
                      )}
                      {totals.totalSgst > 0 && (
                        <div className="flex justify-between text-sm text-zinc-500">
                          <span>SGST</span>
                          <span>{formatCurrency(totals.totalSgst)}</span>
                        </div>
                      )}
                      {totals.totalIgst > 0 && (
                        <div className="flex justify-between text-sm text-zinc-500">
                          <span>IGST</span>
                          <span>{formatCurrency(totals.totalIgst)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-between">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-50">Total</span>
                    <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">{formatCurrency(totals.total)}</span>
                  </div>
                </CardContent>
                <CardFooter className="bg-zinc-50 dark:bg-zinc-900/50 rounded-b-xl border-t border-zinc-200 dark:border-zinc-800">
                  <p className="text-xs text-zinc-500 text-center w-full">
                    Please review all details before saving. You can edit this bill while it remains in Draft status.
                  </p>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
