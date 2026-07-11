import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowUpRight, ArrowDownRight, IndianRupee, Activity, Clock
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { dashboardService, DashboardSummary } from '@/api/services/dashboard'

const StatCard = ({ title, value, change, isPositive, icon: Icon, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
  >
    <Card className="overflow-hidden border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
            <p className="text-3xl font-bold tracking-tight mt-2">{value}</p>
          </div>
          <div className={`p-4 rounded-2xl ${isPositive ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <span className={`flex items-center font-medium ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {isPositive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
            {change}%
          </span>
          <span className="text-zinc-500 dark:text-zinc-400 ml-2">vs last month</span>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)

export default function Dashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const summary = await dashboardService.getSummary()
        setData(summary)
      } catch (error) {
        console.error("Failed to fetch dashboard data", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const summary = data || {
    total_outstanding: 0,
    total_collected: 0,
    active_bills: 0,
    total_customers: 0,
    overdue_count: 0,
    due_this_week: 0,
    recent_payments: []
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Dashboard</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="cursor-pointer"
          onClick={() => window.location.href = '/bills/create'}
        >
          <Card className="h-full overflow-hidden border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center p-6 min-h-[140px]">
            <div className="text-center text-white flex flex-col items-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl font-bold">+</span>
              </div>
              <h3 className="text-xl font-bold">Create bill</h3>
            </div>
          </Card>
        </motion.div>

        <StatCard 
          title="Total Collection Pending" 
          value={formatCurrency(summary.total_outstanding)} 
          change={0.0} 
          isPositive={false}
          icon={Clock}
          delay={0.2}
        />
        <StatCard 
          title="Total Collected Payments" 
          value={formatCurrency(summary.total_collected)} 
          change={0.0} 
          isPositive={true}
          icon={Activity}
          delay={0.3}
        />
        <StatCard 
          title="Total Outstanding" 
          value={formatCurrency(summary.total_outstanding)} 
          change={0.0} 
          isPositive={false}
          icon={IndianRupee}
          delay={0.4}
        />
      </div>


    </div>
  )
}
