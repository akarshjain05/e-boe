import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Hash, Lock, CheckCircle2, Eye, EyeOff, Mail, Phone, Search, Building2, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

import { useAuth } from '@/contexts/AuthContext'
import { registerSchema, type RegisterFormValues } from '@/schemas/auth'
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

export default function Register() {
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [fetchedDetails, setFetchedDetails] = useState<{
    companyName: string | null;
    legalName: string | null;
    addressLine1: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
  } | null>(null)

  const { login } = useAuth()
  const navigate = useNavigate()

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      gstNumber: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  })

  const handleVerifyGst = async () => {
    const gstNumber = form.getValues('gstNumber')
    if (!gstNumber || gstNumber.length < 15) {
      toast.error('Please enter a valid 15-character GST number')
      return
    }

    setIsVerifying(true)
    try {
      const details = await authService.verifyGst(gstNumber)
      if (!details.company_name) {
         toast.error("Could not fetch details. Please try again.")
         return
      }
      setFetchedDetails({
        companyName: details.company_name,
        legalName: details.legal_name,
        addressLine1: details.address_line1,
        city: details.city,
        state: details.state,
        postalCode: details.postal_code
      })
      toast.success('GST details verified successfully!')
    } catch (err) {
      toast.error('Failed to verify GST number. Please check and try again.')
      setFetchedDetails(null)
    } finally {
      setIsVerifying(false)
    }
  }

  async function onSubmit(data: RegisterFormValues) {
    if (!fetchedDetails) {
      toast.error("Please verify your GST number first.")
      return
    }

    setIsLoading(true)

    try {
      await authService.register(data)
      
      // Auto login after registration
      const response = await authService.login({
        gstNumber: data.gstNumber,
        password: data.password,
        rememberMe: false,
      })
      
      login(response.access_token, response.refresh_token, response.user)
      toast.success("Account created successfully!")
      navigate('/')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to register. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex w-full bg-white dark:bg-zinc-950">
      {/* Left Side: Branding & Info (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-col justify-between w-[40%] max-w-md bg-zinc-950 relative overflow-hidden p-12 text-white">
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

        <div className="relative z-10 space-y-6">
          <h1 className="text-3xl font-bold tracking-tight leading-tight">
            Join the future of B2B payments.
          </h1>
          <p className="text-zinc-400 text-lg">
            Register your company using just your GST number. We'll automatically fetch your business details and set everything up.
          </p>

          <div className="space-y-4 pt-8">
            {[
              "Instant verification via GSTIN",
              "Automated compliance tracking",
              "Secure, role-based access",
              "Real-time notifications"
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

      {/* Right Side: Registration Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 xl:px-24 overflow-y-auto">
        <div className="w-full max-w-xl mx-auto">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Create your account</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">
              Enter your GST number to verify and continue.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
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
                              onChange={(e) => {
                                field.onChange(e)
                                if (fetchedDetails) setFetchedDetails(null)
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button 
                  type="button" 
                  onClick={handleVerifyGst}
                  disabled={isVerifying || !form.watch("gstNumber") || form.watch("gstNumber").length < 15}
                  className="h-12 px-6 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all w-full sm:w-auto"
                >
                  {isVerifying ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Search className="h-5 w-5 mr-2" />}
                  Verify
                </Button>
              </div>

              <AnimatePresence>
                {fetchedDetails && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-4 mb-6">
                      <div className="flex items-start gap-3">
                        <Building2 className="w-5 h-5 text-indigo-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">
                            {fetchedDetails.companyName}
                          </p>
                          {fetchedDetails.legalName && fetchedDetails.legalName !== fetchedDetails.companyName && (
                            <p className="text-xs text-zinc-500 mt-1">Legal Name: {fetchedDetails.legalName}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-indigo-500 mt-0.5" />
                        <div>
                          <p className="text-sm text-zinc-700 dark:text-zinc-300">
                            {fetchedDetails.addressLine1}
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">
                            {fetchedDetails.city}, {fetchedDetails.state} {fetchedDetails.postalCode && `- ${fetchedDetails.postalCode}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          GST Details Verified Successfully
                        </span>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-zinc-700 dark:text-zinc-300">Work Email</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                                  <Input type="email" placeholder="john@company.com" className="pl-10 h-12 rounded-xl" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-zinc-700 dark:text-zinc-300">Phone</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                                  <Input type="tel" placeholder="+91 9876543210" className="pl-10 h-12 rounded-xl" {...field} value={field.value || ''} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-zinc-700 dark:text-zinc-300">Password</FormLabel>
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

                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-zinc-700 dark:text-zinc-300">Confirm Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                                  <Input 
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••" 
                                    className="pl-10 pr-10 h-12 rounded-xl" 
                                    {...field} 
                                  />
                                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-base rounded-xl shadow-md shadow-indigo-600/20 transition-all mt-8"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : null}
                        {isLoading ? 'Creating Account...' : 'Complete Registration'}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </Form>

          <div className="mt-8 text-center text-sm text-zinc-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline">
              Sign in instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
