import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, MoreHorizontal, ArrowUpDown, CheckCircle2, Clock, AlertTriangle, FileText, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatCurrency, formatDate } from '@/lib/utils'
import { billService } from '@/api/services/bills'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'

export default function Bills() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterFromDate, setFilterFromDate] = useState<string>('')
  const [filterToDate, setFilterToDate] = useState<string>('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: billService.deleteBill,
    onSuccess: () => {
      toast.success('Bill deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['bills'] })
      queryClient.invalidateQueries({ queryKey: ['reportsDashboard'] })
    },
    onError: () => {
      toast.error('Failed to delete bill')
    }
  })

  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['bills', debouncedSearch, sortField, sortOrder, filterStatus, filterFromDate, filterToDate],
    queryFn: () => billService.getBills({ 
      search: debouncedSearch || undefined, 
      sort_by: sortField, 
      sort_order: sortOrder,
      status: filterStatus || undefined,
      from_date: filterFromDate || undefined,
      to_date: filterToDate || undefined
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

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Accepted
          </span>
        )
      case 'pending_acceptance':
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
            <Clock className="h-3.5 w-3.5" />
            Pending Acceptance
          </span>
        )
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20">
            <AlertTriangle className="h-3.5 w-3.5" />
            Overdue
          </span>
        )
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Paid
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            <FileText className="h-3.5 w-3.5" />
            {status}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Bills</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Create and manage your bills.</p>
        </div>
        <Button onClick={() => navigate('/bills/create')} className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 gap-2">
          <Plus className="h-4 w-4" />
          Create New Bill
        </Button>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input 
                placeholder="Search bills..." 
                className="pl-9 h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  <Filter className="h-4 w-4" />
                  Filters {(filterStatus || filterFromDate || filterToDate) && <span className="flex h-2 w-2 rounded-full bg-indigo-600"></span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Status</div>
                <DropdownMenuItem onClick={() => setFilterStatus('')}>All Status</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('draft')}>Draft</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('sent')}>Sent</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('accepted')}>Accepted</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('rejected')}>Rejected</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('paid')}>Paid</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('overdue')}>Overdue</DropdownMenuItem>
                
                <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1"></div>
                <div className="px-2 py-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Date Range</div>
                <div className="px-2 py-1 flex flex-col gap-2">
                  <Input 
                    type="date" 
                    placeholder="From" 
                    value={filterFromDate}
                    onChange={(e) => setFilterFromDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input 
                    type="date" 
                    placeholder="To" 
                    value={filterToDate}
                    onChange={(e) => setFilterToDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs justify-start px-2 text-zinc-500 hover:text-zinc-900" 
                    onClick={() => { setFilterFromDate(''); setFilterToDate(''); }}
                  >
                    Clear Dates
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-semibold" onClick={() => handleSort('bill_number')}>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100">
                      Bill Details
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold" onClick={() => handleSort('drawee_name')}>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100">
                      Drawee
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold" onClick={() => handleSort('total_amount')}>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100">
                      Amount
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100">
                      Status
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold" onClick={() => handleSort('due_date')}>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100">
                      Due Date
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mx-auto" />
                    </td>
                  </tr>
                ) : bills.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                      No bills found.
                    </td>
                  </tr>
                ) : bills.map((bill: any, idx: number) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={bill.id} 
                    className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/bills/${bill.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">{bill.bill_number}</div>
                      <div className="text-xs text-zinc-500 mt-1">{bill.currency_code}</div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {bill.drawee_name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{formatCurrency(bill.total_amount)}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(bill.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-zinc-500">Issued: {formatDate(bill.issue_date)}</div>
                      <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mt-1">Due: {formatDate(bill.due_date)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/bills/${bill.id}`)
                          }}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/bills/${bill.id}/edit`)
                          }}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={(e) => {
                            e.stopPropagation()
                            if (window.confirm('Are you sure you want to delete this bill?')) {
                              deleteMutation.mutate(bill.id)
                            }
                          }}>
                            Delete
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
              Showing <span className="font-medium text-zinc-900 dark:text-zinc-100">{bills.length > 0 ? 1 : 0}</span> to <span className="font-medium text-zinc-900 dark:text-zinc-100">{bills.length}</span> results
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
