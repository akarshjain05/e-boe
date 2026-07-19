import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financiersService } from '@/api/services/companies.service';
import { CheckCircle2, ShieldCheck, Building2, Percent, Loader2, ArrowRight } from 'lucide-react';

const onboardingSchema = z.object({
  license_number: z.string().min(3, 'License number must be at least 3 characters'),
  license_type: z.enum(['bank', 'nbfc_factor', 'fi'], {
    error: 'Please select a license type'
  }),
  min_rate_bps: z.number().min(0, 'Rate cannot be negative').max(10000, 'Rate cannot exceed 100%'),
  max_exposure_limit: z.number().min(0, 'Exposure limit cannot be negative').optional(),
  settlement_bank_account_id: z.string().uuid('Invalid bank account ID').optional().or(z.literal('')),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export default function FinancierOnboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      min_rate_bps: 800, // 8.00% default
    }
  });

  const mutation = useMutation({
    mutationFn: financiersService.createProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', 'me'] });
      navigate('/dashboard', { replace: true });
    },
    onError: (error: any) => {
      setServerError(error.response?.data?.detail || 'Failed to submit profile. Please try again.');
    },
  });

  const onSubmit = (data: OnboardingFormValues) => {
    setServerError(null);
    // Convert empty string to undefined for optional uuid
    const payload = {
      ...data,
      settlement_bank_account_id: data.settlement_bank_account_id || undefined
    };
    mutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 bg-[url('/grid.svg')] bg-center opacity-5 dark:opacity-[0.02]" style={{ backgroundSize: '30px' }} />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 dark:opacity-10 animate-blob"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 dark:opacity-10 animate-blob animation-delay-2000"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-100 dark:bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-200 dark:border-indigo-500/20 mb-4 shadow-sm">
            <ShieldCheck className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Complete your Financier Profile
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
            Provide your regulatory and operating details to start discounting bills on the TReDS platform.
          </p>
        </div>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-white dark:bg-zinc-900 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-zinc-200 dark:border-zinc-800 backdrop-blur-xl">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            
            {serverError && (
              <div className="bg-red-50 dark:bg-red-500/10 border-l-4 border-red-500 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 dark:text-red-400">{serverError}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="license_type" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Institution Type
              </label>
              <div className="mt-2">
                <select
                  id="license_type"
                  {...register('license_type')}
                  className="block w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                >
                  <option value="">Select institution type...</option>
                  <option value="bank">Commercial Bank</option>
                  <option value="nbfc_factor">NBFC Factor</option>
                  <option value="fi">Financial Institution</option>
                </select>
                {errors.license_type && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.license_type.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="license_number" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                RBI License / Registration Number
              </label>
              <div className="mt-2 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                  type="text"
                  id="license_number"
                  {...register('license_number')}
                  className="block w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 pl-10 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                  placeholder="e.g. B.14.0001"
                />
              </div>
              {errors.license_number && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.license_number.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="min_rate_bps" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Minimum Acceptable Discount Rate (BPS)
              </label>
              <div className="mt-2 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Percent className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                  type="number"
                  id="min_rate_bps"
                  {...register('min_rate_bps', { valueAsNumber: true })}
                  className="block w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 pl-10 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                  placeholder="800"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-zinc-500 sm:text-sm" id="price-currency">
                    BPS (100 = 1%)
                  </span>
                </div>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                This is your default floor rate. You can bid higher on individual bills.
              </p>
              {errors.min_rate_bps && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.min_rate_bps.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="max_exposure_limit" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Global Exposure Limit (₹) <span className="text-zinc-400 font-normal">(Optional)</span>
              </label>
              <div className="mt-2 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-zinc-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  id="max_exposure_limit"
                  {...register('max_exposure_limit', { valueAsNumber: true, setValueAs: v => v === "" ? undefined : parseInt(v, 10) })}
                  className="block w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 pl-8 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                  placeholder="1000000000"
                />
              </div>
              {errors.max_exposure_limit && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.max_exposure_limit.message}</p>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <div className="rounded-md bg-indigo-50 dark:bg-indigo-500/10 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-indigo-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Verification Process</h3>
                    <div className="mt-2 text-sm text-indigo-700 dark:text-indigo-400">
                      <p>
                        Your profile will undergo an automated regulatory check. You will be able to start bidding immediately once your license is verified against RBI records.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-3 px-4 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
              >
                {mutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting Profile...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Complete Onboarding
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
