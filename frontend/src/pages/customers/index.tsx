import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, MoreHorizontal, ArrowUpDown, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { customerService } from '@/api/services/customers'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { AddCustomerModal } from '@/components/modals/AddCustomerModal'
import { EditCustomerModal } from '@/components/modals/EditCustomerModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<any>(null)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterHasOutstanding, setFilterHasOutstanding] = useState<boolean | undefined>(undefined)
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: customerService.deleteCustomer,
    onSuccess: () => {
      toast.success('Customer deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
    onError: () => {
      toast.error('Failed to delete customer')
    }
  })

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      deleteMutation.mutate(id)
    }
  }

  // Use debounce for search (simplified here with a small delay logic)
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', debouncedSearch, sortField, sortOrder, filterStatus, filterHasOutstanding],
    queryFn: () => customerService.getCustomers({ 

      search: debouncedSearch || undefined, 
      sort_by: sortField, 
      sort_order: sortOrder,
      status: filterStatus || undefined,
      has_outstanding: filterHasOutstanding
    }),
    placeholderData: keepPreviousData
  })

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Customers</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your drawees and monitor credit limits.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input 
                placeholder="Search customers..." 
                className="pl-9 h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 w-full sm:w-auto">
                    <Filter className="h-4 w-4" />
                    Filter {(filterStatus || filterHasOutstanding !== undefined) && <span className="flex h-2 w-2 rounded-full bg-indigo-600"></span>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Status</div>
                  <DropdownMenuItem onClick={() => setFilterStatus('')}>All Status</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('active')}>Active</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('inactive')}>Inactive</DropdownMenuItem>
                  <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1"></div>
                  <div className="px-2 py-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Balance</div>
                  <DropdownMenuItem onClick={() => setFilterHasOutstanding(undefined)}>All Balances</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterHasOutstanding(true)}>Has Outstanding</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                Export
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-semibold" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100">
                      Customer Details
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold" onClick={() => handleSort('outstanding_balance')}>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100">
                      Outstanding Balance
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold" onClick={() => handleSort('credit_limit')}>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100">
                      Credit Limit
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100">
                      Status
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mx-auto" />
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                      No customers found.
                    </td>
                  </tr>
                ) : customers.map((customer: any, idx: number) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={customer.id} 
                    className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">{customer.name}</div>
                      <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                        <span>{customer.email || 'No email'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-medium ${(customer.credit_limit > 0 && (customer.outstanding_balance || 0) > customer.credit_limit) ? 'text-red-600 dark:text-red-400' : ''}`}>
                        {formatCurrency(customer.outstanding_balance || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                      {formatCurrency(customer.credit_limit || 0)}
                    </td>
                    <td className="px-6 py-4">
                      {customer.status === 'active' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Active
                        </span>
                      )}
                      {customer.status === 'warning' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Over Limit
                        </span>
                      )}
                      {customer.status === 'inactive' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingCustomer(customer)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(customer.id)} className="text-red-600 focus:text-red-600">
                            Delete Customer
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
              Showing <span className="font-medium text-zinc-900 dark:text-zinc-100">{customers.length > 0 ? 1 : 0}</span> to <span className="font-medium text-zinc-900 dark:text-zinc-100">{customers.length}</span> results
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <AddCustomerModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen} />
      {editingCustomer && (
        <EditCustomerModal 
          open={!!editingCustomer} 
          onOpenChange={(open) => !open && setEditingCustomer(null)}
          customer={editingCustomer}
        />
      )}
    </div>
  )
}
