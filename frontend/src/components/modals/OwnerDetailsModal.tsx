import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface Owner {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  pan_number?: string
  is_active: boolean
  is_verified: boolean
  last_login_at?: string
  created_at: string
}

interface OwnerDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  owner: Owner | null
}

export function OwnerDetailsModal({ open, onOpenChange, owner }: OwnerDetailsModalProps) {
  if (!owner) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Owner Details</DialogTitle>
          <DialogDescription>
            Detailed information about this owner.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-500">First Name</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{owner.first_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Last Name</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{owner.last_name}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">Email Address</p>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">{owner.email}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-500">Phone Number</p>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{owner.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">PAN Number</p>
              <p className="font-medium text-zinc-900 dark:text-zinc-100 uppercase">{owner.pan_number || 'N/A'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <div>
              <p className="text-sm font-medium text-zinc-500">Status</p>
              <p className="font-medium">
                {owner.is_active ? (
                  <span className="text-emerald-600 dark:text-emerald-400">Active</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">Inactive</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Verified</p>
              <p className="font-medium">
                {owner.is_verified ? (
                  <span className="text-emerald-600 dark:text-emerald-400">Yes</span>
                ) : (
                  <span className="text-zinc-500">No</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
