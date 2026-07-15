import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { productService } from '@/api/services/products'
import { Product } from '@/api/services/products'
import { AddProductModal } from '@/components/modals/AddProductModal'

interface ProductSearchProps {
  onSelect: (product: Product) => void
}

export function ProductSearch({ onSelect }: ProductSearchProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false)
  
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-search', search],
    queryFn: () => productService.getProducts({ search: search || undefined })
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-start font-normal text-muted-foreground bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
        >
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          Select from inventory...
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] sm:w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search products..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty className="py-2 px-2 text-sm text-center">
              <p className="mb-2 text-zinc-500">
                {isLoading ? 'Searching...' : 'No products found.'}
              </p>
            </CommandEmpty>
            <CommandGroup>
              {products.map((product: Product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => {
                    onSelect(product)
                    setOpen(false)
                  }}
                  className="flex flex-col items-start py-2"
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                      ₹{product.unit_price}
                    </span>
                  </div>
                  {(product.hsn_code || product.tax_rate) && (
                    <div className="flex w-full items-center gap-3 mt-1 text-xs text-zinc-500">
                      {product.hsn_code && <span>HSN: {product.hsn_code}</span>}
                      <span>GST: {product.tax_rate}%</span>
                    </div>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <div className="p-1 border-t border-zinc-200 dark:border-zinc-800">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full gap-2 justify-start text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                onClick={(e) => {
                  e.preventDefault();
                  setOpen(false);
                  setIsAddProductModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </div>
          </CommandList>
        </Command>
      </PopoverContent>
      {isAddProductModalOpen && (
        <AddProductModal 
          open={isAddProductModalOpen} 
          onOpenChange={setIsAddProductModalOpen}
          initialSearchTerm={search}
          onSuccessAction={(_productId, product) => {
            if (product) {
              onSelect(product);
            }
          }}
        />
      )}
    </Popover>
  )
}
