import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Mail, Lock, Building, User, Phone, MapPin, Globe, Hash, ChevronRight, ChevronLeft, Map, CheckCircle2, Eye, EyeOff } from 'lucide-react'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const STEPS = [
  { id: 1, name: 'Company Details' },
  { id: 2, name: 'Owner Details' },
  { id: 3, name: 'Address Details' }
]

const ORG_TYPES = [
  "Proprietorship",
  "Partnership",
  "LLP",
  "Private Limited",
  "Public Limited",
  "One Person Company (OPC)",
  "Trust",
  "Society",
  "Cooperative",
  "Government Organization",
  "NGO",
  "Other"
]

export default function Register() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: '',
      organizationType: '',
      companyEmail: '',
      companyPan: '',
      companyPhone: '',
      companyWebsite: '',
      gstNumber: '',
      
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      ownerPan: '',
      password: '',
      confirmPassword: '',
      
      addressLine1: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
    },
    mode: 'onTouched'
  })

  const nextStep = async () => {
    let fieldsToValidate: any[] = []
    
    if (currentStep === 1) {
      fieldsToValidate = ['companyName', 'organizationType', 'companyEmail', 'companyPan', 'companyPhone', 'companyWebsite', 'gstNumber']
    } else if (currentStep === 2) {
      fieldsToValidate = ['firstName', 'lastName', 'email', 'phone', 'ownerPan', 'password', 'confirmPassword']
    }

    const isValid = await form.trigger(fieldsToValidate)
    
    if (currentStep === 2) {
      const pwd = form.getValues('password')
      const confirmPwd = form.getValues('confirmPassword')
      if (pwd !== confirmPwd) {
        form.setError('confirmPassword', { type: 'manual', message: 'Passwords do not match' })
        return
      }
    }

    if (isValid) {
      setCurrentStep(prev => prev + 1)
      setError(null)
    } else {
      // If validation fails but no specific field error is visible, show a general error
      if (Object.keys(form.formState.errors).length === 0) {
        setError('Please check all fields and ensure they meet the requirements.')
      }
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => prev - 1)
    setError(null)
  }

  async function onSubmit(data: RegisterFormValues) {
    if (currentStep !== 3) return

    setIsLoading(true)
    setError(null)

    try {
      await authService.register(data)
      navigate('/login', { state: { message: 'Registration successful! Please login.' } })
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred during registration')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/0 rounded-full blur-3xl opacity-50 dark:opacity-20 animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500/20 to-teal-500/0 rounded-full blur-3xl opacity-50 dark:opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-2xl z-10"
      >
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl ring-1 ring-zinc-200 dark:ring-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-10">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <span className="text-white font-bold text-xl">e</span>
            </div>
          </div>
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Create your account</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">
              Tell us about your organization to setup your workspace.
            </p>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between items-center mb-8 relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-zinc-100 dark:bg-zinc-800 -z-10" />
            
            {STEPS.map((step) => (
              <div key={step.id} className="flex flex-col items-center gap-2 bg-white dark:bg-zinc-950 px-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  currentStep > step.id 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : currentStep === step.id 
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-600 ring-offset-2 dark:ring-offset-zinc-950' 
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                }`}>
                  {currentStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${currentStep >= step.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'}`}>
                  {step.name}
                </span>
              </div>
            ))}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (currentStep < STEPS.length) {
                  nextStep()
                } else {
                  form.handleSubmit(onSubmit)()
                }
              }
            }}>
              {error && (
                <div className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-xl text-center font-medium border border-red-100 dark:border-red-500/20">
                  {error}
                </div>
              )}
              
              <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                  {/* Step 1: Company Info */}
                  {currentStep === 1 && (
                    <motion.div 
                      key="step1"
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                      className="space-y-5"
                    >
                      <FormField control={form.control} name="companyName" render={({ field }) => (
                        <FormItem><FormLabel>Organization Name *</FormLabel><FormControl><div className="relative"><Building className="absolute left-3 top-3 h-5 w-5 text-zinc-400" /><Input placeholder="Acme Corp Ltd." className="pl-10 h-12 rounded-xl" {...field} /></div></FormControl><FormMessage /></FormItem>
                      )}/>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormField control={form.control} name="organizationType" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization Type *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 rounded-xl">
                                  <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ORG_TYPES.map(type => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}/>
                        <FormField control={form.control} name="gstNumber" render={({ field }) => (
                          <FormItem><FormLabel>GST Number *</FormLabel><FormControl><div className="relative"><Hash className="absolute left-3 top-3 h-5 w-5 text-zinc-400" /><Input placeholder="22AAAAA0000A1Z5" className="pl-10 h-12 rounded-xl uppercase" {...field} value={field.value?.toUpperCase() || ''} /></div></FormControl><FormMessage /></FormItem>
                        )}/>
                      </div>

                      <FormField control={form.control} name="companyEmail" render={({ field }) => (
                        <FormItem><FormLabel>Company Email *</FormLabel><FormControl><div className="relative"><Mail className="absolute left-3 top-3 h-5 w-5 text-zinc-400" /><Input type="email" placeholder="contact@acme.com" className="pl-10 h-12 rounded-xl" {...field} /></div></FormControl><FormMessage /></FormItem>
                      )}/>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormField control={form.control} name="companyPan" render={({ field }) => (
                          <FormItem><FormLabel>Company PAN *</FormLabel><FormControl><div className="relative"><Hash className="absolute left-3 top-3 h-5 w-5 text-zinc-400" /><Input placeholder="ABCDE1234F" className="pl-10 h-12 rounded-xl uppercase" maxLength={10} {...field} value={field.value?.toUpperCase() || ''} /></div></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="companyPhone" render={({ field }) => (
                          <FormItem><FormLabel>Company Phone *</FormLabel><FormControl><div className="relative"><Phone className="absolute left-3 top-3 h-5 w-5 text-zinc-400" /><Input placeholder="Support Line" className="pl-10 h-12 rounded-xl" {...field} value={field.value || ''} /></div></FormControl><FormMessage /></FormItem>
                        )}/>
                      </div>

                      <FormField control={form.control} name="companyWebsite" render={({ field }) => (
                        <FormItem><FormLabel>Company Website</FormLabel><FormControl><div className="relative"><Globe className="absolute left-3 top-3 h-5 w-5 text-zinc-400" /><Input placeholder="https://acme.com" className="pl-10 h-12 rounded-xl" {...field} value={field.value || ''} /></div></FormControl><FormMessage /></FormItem>
                      )}/>
                    </motion.div>
                  )}

                  {/* Step 2: Owner Details */}
                  {currentStep === 2 && (
                    <motion.div 
                      key="step2"
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                      className="space-y-5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormField control={form.control} name="firstName" render={({ field }) => (
                          <FormItem><FormLabel>First Name *</FormLabel><FormControl><div className="relative"><User className="absolute left-3 top-3 h-5 w-5 text-zinc-400" /><Input placeholder="John" className="pl-10 h-12 rounded-xl" {...field} /></div></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="lastName" render={({ field }) => (
                          <FormItem><FormLabel>Last Name *</FormLabel><FormControl><div className="relative"><User className="absolute left-3 top-3 h-5 w-5 text-zinc-400" /><Input placeholder="Doe" className="pl-10 h-12 rounded-xl" {...field} /></div></FormControl><FormMessage /></FormItem>
                        )}/>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormField control={form.control} name="email" render={({ field }) => (
                          <FormItem><FormLabel>Work Email *</FormLabel><FormControl><div className="relative"><Mail className="absolute left-3 top-3 h-5 w-5 text-zinc-400" /><Input type="email" placeholder="john@company.com" className="pl-10 h-12 rounded-xl" {...field} /></div></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="phone" render={({ field }) => (
                          <FormItem><FormLabel>Personal Phone</FormLabel><FormControl><div className="relative"><Phone className="absolute left-3 top-3 h-5 w-5 text-zinc-400" /><Input type="tel" placeholder="+91 9876543210" className="pl-10 h-12 rounded-xl" {...field} value={field.value || ''} /></div></FormControl><FormMessage /></FormItem>
                        )}/>
                      </div>

                      <FormField control={form.control} name="ownerPan" render={({ field }) => (
                        <FormItem><FormLabel>Owner PAN *</FormLabel><FormControl><div className="relative"><Hash className="absolute left-3 top-3 h-5 w-5 text-zinc-400" /><Input placeholder="ABCDE1234F" className="pl-10 h-12 rounded-xl uppercase" maxLength={10} {...field} value={field.value?.toUpperCase() || ''} /></div></FormControl><FormMessage /></FormItem>
                      )}/>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormField control={form.control} name="password" render={({ field }) => (
                          <FormItem><FormLabel>Password *</FormLabel><FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                              <Input type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10 h-12 rounded-xl" {...field} />
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                          </FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                          <FormItem><FormLabel>Confirm Password *</FormLabel><FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                              <Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10 h-12 rounded-xl" {...field} />
                              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                          </FormControl><FormMessage /></FormItem>
                        )}/>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Address Details */}
                  {currentStep === 3 && (
                    <motion.div 
                      key="step3"
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                      className="space-y-5"
                    >
                      <FormField control={form.control} name="addressLine1" render={({ field }) => (
                        <FormItem><FormLabel>Address Line 1</FormLabel><FormControl><div className="relative"><MapPin className="absolute left-3 top-3 h-5 w-5 text-zinc-400" /><Input placeholder="123 Business Avenue" className="pl-10 h-12 rounded-xl" {...field} value={field.value || ''} /></div></FormControl><FormMessage /></FormItem>
                      )}/>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormField control={form.control} name="city" render={({ field }) => (
                          <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Mumbai" className="h-12 rounded-xl" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="state" render={({ field }) => (
                          <FormItem><FormLabel>State / Province</FormLabel><FormControl><Input placeholder="Maharashtra" className="h-12 rounded-xl" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                        )}/>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormField control={form.control} name="country" render={({ field }) => (
                          <FormItem><FormLabel>Country</FormLabel><FormControl><div className="relative"><Map className="absolute left-3 top-3 h-5 w-5 text-zinc-400" /><Input placeholder="India" className="pl-10 h-12 rounded-xl" {...field} value={field.value || ''} /></div></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="postalCode" render={({ field }) => (
                          <FormItem><FormLabel>Postal Code</FormLabel><FormControl><Input placeholder="400001" className="h-12 rounded-xl" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                        )}/>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={currentStep === 1 ? () => navigate('/login') : prevStep}
                  className="text-zinc-500 h-12 rounded-xl px-6"
                >
                  {currentStep === 1 ? 'Cancel' : <><ChevronLeft className="mr-2 h-4 w-4" /> Back</>}
                </Button>
                
                {currentStep < STEPS.length ? (
                  <Button 
                    type="button" 
                    onClick={nextStep}
                    className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 h-12 rounded-xl px-8"
                  >
                    Next Step <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 h-12 rounded-xl px-8"
                  >
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finalizing...</>
                    ) : (
                      'Complete Registration'
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
          
          <div className="mt-8 text-center text-sm text-zinc-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline">
              Sign in instead
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
