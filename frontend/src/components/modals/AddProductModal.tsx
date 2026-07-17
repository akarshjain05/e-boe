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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { productService } from '@/api/services/products'
import { HsnSearch } from '@/components/shared/HsnSearch'

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
  onSuccessAction?: (productId: string, product?: any) => void
  productToEdit?: any
}

export function AddProductModal({ open, onOpenChange, initialSearchTerm, onSuccessAction, productToEdit }: AddProductModalProps) {
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

  // Auto-fill logic when modal opens with a search term or productToEdit
  useEffect(() => {
    if (open) {
      if (productToEdit) {
        form.reset({
          type: productToEdit.type || 'goods',
          name: productToEdit.name || '',
          hsn_code: productToEdit.hsn_code || '',
          unit: productToEdit.unit || '',
          quantity_in_stock: productToEdit.quantity_in_stock || 0,
          unit_price: productToEdit.unit_price || 0,
          tax_rate: productToEdit.tax_rate || 0,
        })
      } else {
        form.reset({
          type: 'goods',
          name: initialSearchTerm || '',
          hsn_code: '',
          unit: '',
          quantity_in_stock: 0,
          unit_price: 0,
          tax_rate: 0,
        })
      }
    }
  }, [open, initialSearchTerm, productToEdit, form])

  const createMutation = useMutation({
    mutationFn: productService.createProduct,
    onSuccess: (data) => {
      toast.success('Product added successfully')
      queryClient.invalidateQueries({ queryKey: ['products'] })
      if (onSuccessAction) onSuccessAction(data.id, data)
      handleClose()
    },
    onError: () => {
      toast.error('Failed to add product')
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => productService.updateProduct(productToEdit.id, data),
    onSuccess: (data) => {
      toast.success('Product updated successfully')
      queryClient.invalidateQueries({ queryKey: ['products'] })
      if (onSuccessAction) onSuccessAction(data.id, data)
      handleClose()
    },
    onError: () => {
      toast.error('Failed to update product')
    }
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  const onSubmit = (data: ProductFormValues) => {
    if (productToEdit) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) handleClose()
      else onOpenChange(val)
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{productToEdit ? 'Edit Product' : 'Add Product'}</DialogTitle>
          <DialogDescription>
            {productToEdit ? 'Update the details for this product or service below.' : 'Fill in the product or service details below.'}
          </DialogDescription>

        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex items-center space-x-3"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="goods" />
                          </FormControl>
                          <FormLabel className="font-normal text-sm cursor-pointer">
                            Goods
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="service" />
                          </FormControl>
                          <FormLabel className="font-normal text-sm cursor-pointer">
                            Service
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hsn_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{form.watch('type') === 'service' ? 'SAC' : 'HSN'}</FormLabel>
                    <FormControl>
                      <HsnSearch 
                        value={field.value || ''} 
                        onChange={(code, desc) => {
                          field.onChange(code);
                          if (desc && !form.getValues('name')) {
                            form.setValue('name', desc, { shouldValidate: true });
                          }
                        }} 
                      />
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
              {form.watch('type') === 'goods' && (
                <>
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
                </>
              )}
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
              <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Product
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
