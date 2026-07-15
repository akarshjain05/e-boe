import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { productService } from '@/api/services/products'

const productSchema = z.object({
  type: z.enum(['goods', 'service']).default('goods'),
  name: z.string().min(1, 'Name is required'),
  hsn_code: z.string().optional().or(z.literal('')),
  unit: z.string().optional().or(z.literal('')),
  quantity_in_stock: z.coerce.number().min(0, 'Quantity must be non-negative').default(0),
  unit_price: z.coerce.number().min(0, 'Price must be non-negative'),
  tax_rate: z.coerce.number().min(0).max(100, 'Tax rate must be between 0 and 100'),
})

type ProductFormValues = z.infer<typeof productSchema>

interface AddProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSearchTerm?: string
  onSuccessAction?: (productId: string) => void
}

export function AddProductModal({ open, onOpenChange, initialSearchTerm, onSuccessAction }: AddProductModalProps) {
  const queryClient = useQueryClient()
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      type: 'goods',
      name: '',
      hsn_code: '',
      unit: '',
      quantity_in_stock: 0,
      unit_price: 0,
      tax_rate: 0,
    }
  })

  // Auto-fill logic when modal opens with a search term
  useEffect(() => {
    if (open && initialSearchTerm) {
      form.setValue('name', initialSearchTerm)
    }
  }, [open, initialSearchTerm, form])

  const mutation = useMutation({
    mutationFn: productService.createProduct,
    onSuccess: (data) => {
      toast.success('Product added successfully')
      queryClient.invalidateQueries({ queryKey: ['products'] })
      if (onSuccessAction) onSuccessAction(data.id)
      handleClose()
    },
    onError: () => {
      toast.error('Failed to add product')
    }
  })

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  const onSubmit = (data: ProductFormValues) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) handleClose()
      else onOpenChange(val)
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
          <DialogDescription>
            Fill in the product or service details below.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="goods">Goods</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hsn_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{form.watch('type') === 'service' ? 'SAC Code' : 'HSN Number'}</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name / Description *</FormLabel>
                  <FormControl>
                    <Input placeholder="Product or service name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Magnitude</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NOS">Pieces (NOS)</SelectItem>
                        <SelectItem value="KG">Kg (KG)</SelectItem>
                        <SelectItem value="LTR">Liters (LTR)</SelectItem>
                        <SelectItem value="MTR">Meters (MTR)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity_in_stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity (in stock)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="any" placeholder="in stock" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unit_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price Per Unit</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tax_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST</FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseFloat(v))} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select GST %" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="18">18%</SelectItem>
                        <SelectItem value="40">40%</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Product
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
