import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { companiesService } from '@/api/services/companies.service'

export function AppLayout() {
  const location = useLocation()
  
  const { data: company, isLoading } = useQuery({
    queryKey: ['company', 'me'],
    queryFn: companiesService.getMe
  })

  // If user is a financier and hasn't completed onboarding, force them there
  if (!isLoading && company?.company_type === 'financier' && !company?.financier_profile) {
    if (location.pathname !== '/financier/onboarding') {
      return <Navigate to="/financier/onboarding" replace />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative">
          {/* Subtle background pattern for depth */}
          <div className="absolute inset-0 z-0 bg-[url('/grid.svg')] bg-center opacity-5 dark:opacity-[0.02]" style={{ backgroundSize: '30px' }} />
          
          <div className="relative z-10 max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
