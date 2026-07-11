import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 relative overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl opacity-50 dark:opacity-20 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-50 dark:opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 text-center max-w-lg"
      >
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute -inset-4 bg-indigo-100 dark:bg-indigo-900/20 rounded-full blur-xl opacity-50" />
            <div className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center relative">
              <FileQuestion className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>
        
        <h1 className="text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Page not found</h2>
        
        <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
          Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or perhaps the URL is incorrect.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md shadow-indigo-600/20">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-12 px-8 rounded-lg bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-zinc-200 dark:border-zinc-800">
            <Link to="/settings">
              Contact Support
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
