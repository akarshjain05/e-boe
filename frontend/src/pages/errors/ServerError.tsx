import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ServerError() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 relative overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl opacity-50 dark:opacity-20 animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl opacity-50 dark:opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="z-10 text-center max-w-lg"
      >
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute -inset-4 bg-red-100 dark:bg-red-900/20 rounded-full blur-xl opacity-50" />
            <div className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-red-100 dark:border-red-900/30 flex items-center justify-center relative">
              <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-500" />
            </div>
          </div>
        </div>
        
        <h1 className="text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-2">500</h1>
        <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Internal Server Error</h2>
        
        <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
          We're experiencing an unexpected technical issue. Our engineering team has been notified and is working to resolve the problem.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={() => window.location.reload()}
            className="h-12 px-8 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white rounded-lg shadow-md"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button asChild variant="outline" className="h-12 px-8 rounded-lg bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-zinc-200 dark:border-zinc-800">
            <Link to="/">
              Return to Dashboard
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
