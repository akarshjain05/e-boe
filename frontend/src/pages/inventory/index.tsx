import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, MoreHorizontal, Package } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { productService } from '@/api/services/products'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { AddProductModal } from '@/components/modals/AddProductModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('goods')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [productToEdit, setProductToEdit] = useState<any>(null)
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: productService.deleteProduct,
    onSuccess: () => {
      toast.success('Product deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: () => {
      toast.error('Failed to delete product')
    }
  })

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product/service?')) {
      deleteMutation.mutate(id)
    }
  }

  // Use debounce for search
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', debouncedSearch, filterType],
    queryFn: () => productService.getProducts({ 
      search: debouncedSearch || undefined, 
      type: filterType
    }),
    placeholderData: keepPreviousData
  })

  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Inventory</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your products and services catalogue.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <Tabs defaultValue="goods" value={filterType} onValueChange={setFilterType} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="goods">Goods</TabsTrigger>
          <TabsTrigger value="service">Services</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl mt-4">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input 
                placeholder="Search products..." 
                className="pl-9 h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Product Details</th>
                  <th className="px-6 py-4 font-semibold">{filterType === 'service' ? 'SAC' : 'HSN'}</th>
                  <th className="px-6 py-4 font-semibold">Unit Price</th>
                  {filterType === 'goods' && (
                    <th className="px-6 py-4 font-semibold text-center">Quantity (in stock)</th>
                  )}
                  <th className="px-6 py-4 font-semibold">Tax Rate</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={filterType === 'goods' ? 6 : 5} className="px-6 py-8 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mx-auto" />
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={filterType === 'goods' ? 6 : 5} className="px-6 py-12 text-center text-zinc-500">
                      <Package className="h-6 w-6 text-zinc-400 mx-auto mb-2" />
                      <p>No products found in catalogue.</p>
                    </td>
                  </tr>
                ) : products.map((product: any, idx: number) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={product.id} 
                    className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                      {product.hsn_code || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(product.unit_price || 0)}
                      </div>
                    </td>
                    {filterType === 'goods' && (
                      <td className="px-6 py-4 text-center">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {(!product.unit || ['NOS', 'KG', 'LTR', 'MTR'].includes(product.unit)) 
                            ? `${product.quantity_in_stock || 0} ${product.unit || ''}`
                            : product.unit}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        {product.tax_rate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setProductToEdit(product)
                            setIsAddModalOpen(true)
                          }}>
                            Edit Product
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(product.id)}>
                            Delete Product
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="text-sm text-zinc-500">
              Showing <span className="font-medium text-zinc-900 dark:text-zinc-100">{products.length > 0 ? 1 : 0}</span> to <span className="font-medium text-zinc-900 dark:text-zinc-100">{products.length}</span> results
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <AddProductModal 
        open={isAddModalOpen} 
        onOpenChange={(open) => {
          setIsAddModalOpen(open)
          if (!open) setProductToEdit(null)
        }}
        productToEdit={productToEdit} 
      />
    </div>
  )
}
