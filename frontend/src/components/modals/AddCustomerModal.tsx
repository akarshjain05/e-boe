import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Search } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { customerService } from '@/api/services/customers'
import { companiesService } from '@/api/services/companies.service'

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),
  gst_number: z.string().min(1, 'GST Number is required'),
  credit_limit: z.coerce.number().min(0, 'Credit limit must be a positive number').optional(),
})

type CustomerFormValues = z.infer<typeof customerSchema>

interface AddCustomerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSearchTerm?: string
  onSuccessAction?: (customerId: string) => void
}

export function AddCustomerModal({ open, onOpenChange, initialSearchTerm, onSuccessAction }: AddCustomerModalProps) {
  const queryClient = useQueryClient()
  
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      gst_number: '',
      credit_limit: 0
    }
  })

  // Auto-fill logic when modal opens with a search term
  useEffect(() => {
    if (open && initialSearchTerm) {
      const isGst = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(initialSearchTerm.trim())
      if (isGst) {
        form.setValue('gst_number', initialSearchTerm.trim().toUpperCase())
      } else {
        form.setValue('name', initialSearchTerm)
      }
    }
  }, [open, initialSearchTerm, form])

  const mutation = useMutation({
    mutationFn: customerService.createCustomer,
    onSuccess: (data) => {
      toast.success('Customer added successfully')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      if (onSuccessAction) onSuccessAction(data.id)
      handleClose()
    },
    onError: () => {
      toast.error('Failed to add customer')
    }
  })

  const lookupMutation = useMutation({
    mutationFn: companiesService.lookupByGst,
    onSuccess: (data) => {
      if (data.name) form.setValue('name', data.name)
      if (data.email) form.setValue('email', data.email)
      if (data.phone) form.setValue('phone', data.phone)
      toast.success('Company details auto-filled')
    },
    onError: () => {
      toast.error('Could not find company with this GSTIN on the platform')
    }
  })

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  const onSubmit = (data: CustomerFormValues) => {
    mutation.mutate({
      ...data,
      customer_code: 'CUST-' + Date.now(),
      business_type: 'B2B',
      gst_number: data.gst_number,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) handleClose()
      else onOpenChange(val)
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Customer</DialogTitle>
          <DialogDescription>
            Fill in the customer details below.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="gst_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GST Number *</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input placeholder="27AAACA1234A1Z5" {...field} />
                    </FormControl>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={() => {
                        if (field.value) {
                          lookupMutation.mutate(field.value)
                        } else {
                          toast.error('Please enter a GST Number first')
                        }
                      }}
                      disabled={lookupMutation.isPending || !field.value}
                    >
                      {lookupMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                      Lookup
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="billing@acme.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 234 567 890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="credit_limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credit Limit (Optional)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.01" placeholder="e.g. 50000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Customer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
