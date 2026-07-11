import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { companiesService, Branch } from '@/api/services/companies.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface AddAddressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAddressModal({ open, onOpenChange }: AddAddressModalProps) {
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState<Branch>({
    name: '',
    code: '',
    address_line1: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    email: '',
    phone: ''
  })

  const mutation = useMutation({
    mutationFn: companiesService.createBranch,
    onSuccess: () => {
      toast.success('Address added successfully')
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      onOpenChange(false)
      setFormData({
        name: '', code: '', address_line1: '', city: '', state: '', country: '', postal_code: '', email: '', phone: ''
      })
    },
    onError: (error) => {
      toast.error('Failed to add address')
      console.error(error)
    }
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.code) {
      toast.error('Name and Code are required')
      return
    }
    mutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Additional Address</DialogTitle>
          <DialogDescription>
            Add a new branch or location address for your company.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Branch Name *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Head Office" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Branch Code *</Label>
              <Input id="code" name="code" value={formData.code} onChange={handleChange} required placeholder="e.g. HO-01" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address_line1">Address Line</Label>
            <Input id="address_line1" name="address_line1" value={formData.address_line1} onChange={handleChange} placeholder="Street address" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" value={formData.city} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" value={formData.state} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input id="postal_code" name="postal_code" value={formData.postal_code} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" value={formData.country} onChange={handleChange} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {mutation.isPending ? 'Adding...' : 'Add Address'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
