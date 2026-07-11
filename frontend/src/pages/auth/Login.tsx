import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Hash, Lock, CheckCircle2, Eye, EyeOff } from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { loginSchema, type LoginFormValues } from '@/schemas/auth'
import { authService } from '@/api/services/auth.service'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

export default function Login() {
  const location = useLocation()
  const successMessage = location.state?.message
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      gstNumber: '',
      password: '',
      rememberMe: false,
    },
  })

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)
    setError(null)

    try {
      const response = await authService.login(data)
      login(response.access_token, response.refresh_token, response.user)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid GST Number or password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex w-full bg-white dark:bg-zinc-950">
      {/* Left Side: Branding & Info (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-zinc-950 relative overflow-hidden p-12 text-white border-r border-zinc-800">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -right-1/4 w-[120%] h-[120%] bg-gradient-to-bl from-indigo-500/20 to-purple-500/0 rounded-full blur-3xl opacity-50 animate-pulse" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[120%] h-[120%] bg-gradient-to-tr from-blue-500/20 to-teal-500/0 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <span className="text-white font-bold text-lg">e</span>
            </div>
            <span className="text-xl font-bold tracking-tight">eBOE</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6 max-w-md">
          <h1 className="text-4xl font-bold tracking-tight">
            Streamline your B2B transactions.
          </h1>
          <p className="text-zinc-400 text-lg">
            Create, manage, and track Bills of Exchange seamlessly. Ensure compliance, automate reminders, and accelerate your cash flow.
          </p>

          <div className="space-y-4 pt-8">
            {[
              "End-to-end digital Bills of Exchange",
              "Automated compliance and tax tracking",
              "Real-time notifications and payment reminders",
              "Secure, role-based access for your whole team"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-sm text-zinc-500">
            &copy; {new Date().getFullYear()} eBOE. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 xl:p-24 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Welcome back</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">
              Sign in to your eBOE account to continue
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {successMessage && !error && (
                <div className="p-3 flex items-center justify-center gap-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-xl text-center font-medium border border-emerald-100 dark:border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                  {successMessage}
                </div>
              )}
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-xl text-center font-medium border border-red-100 dark:border-red-500/20">
                  {error}
                </div>
              )}
              
              <FormField
                control={form.control}
                name="gstNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-700 dark:text-zinc-300">GST Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Hash className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                        <Input 
                          placeholder="22AAAAA0000A1Z5" 
                          className="pl-10 h-12 rounded-xl uppercase" 
                          {...field} 
                          value={field.value?.toUpperCase() || ''}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-zinc-700 dark:text-zinc-300">Password</FormLabel>
                      <Link to="/forgot-password" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                        <Input 
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••" 
                          className="pl-10 pr-10 h-12 rounded-xl" 
                          {...field} 
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-base rounded-xl shadow-md shadow-indigo-600/20 transition-all mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : null}
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </Form>

          <div className="mt-8 text-center text-sm text-zinc-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline">
              Register your company
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
