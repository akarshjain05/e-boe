import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currencyCode: string = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return '-'
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  
  // Basic implementation without date-fns for now to avoid issues
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

export function getInitials(name: string) {
  if (!name) return '?'
  const parts = name.split(' ')
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'active':
    case 'approved':
    case 'paid':
    case 'accepted':
    case 'completed':
      return 'success'
    case 'pending':
    case 'pending_approval':
    case 'partially_paid':
      return 'warning'
    case 'draft':
    case 'generated':
    case 'sent':
    case 'viewed':
      return 'info'
    case 'rejected':
    case 'overdue':
    case 'cancelled':
    case 'failed':
    case 'expired':
    case 'blacklisted':
      return 'destructive'
    default:
      return 'default'
  }
}

export function generateId() {
  return Math.random().toString(36).substring(2, 9)
}
