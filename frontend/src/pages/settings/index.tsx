import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Building, Shield, Key, MapPin } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from '@/contexts/AuthContext'
import { usersService } from '@/api/services/users.service'
import { companiesService, CompanyUpdate } from '@/api/services/companies.service'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

type SettingsTab = 'owner' | 'company' | 'address' | 'security' | 'api'

const tabs = [
  { id: 'company' as SettingsTab, label: 'Company Details', icon: Building },
  { id: 'owner' as SettingsTab, label: 'Owner Details', icon: User },
  { id: 'address' as SettingsTab, label: 'Address Details', icon: MapPin },
  { id: 'security' as SettingsTab, label: 'Security', icon: Shield },
  { id: 'api' as SettingsTab, label: 'API Keys', icon: Key },
]

const ORG_TYPES = [
  "Proprietorship", "Partnership", "LLP", "Private Limited",
  "Public Limited", "One Person Company (OPC)", "Trust",
  "Society", "Cooperative", "Government Organization", "NGO", "Other"
]

import { Plus } from 'lucide-react'
import { AddOwnerModal } from '@/components/modals/AddOwnerModal'
import { OwnerDetailsModal } from '@/components/modals/OwnerDetailsModal'

function OwnerSettings() {
  const { user } = useAuth()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedOwner, setSelectedOwner] = useState<any | null>(null)
  
  const { data: owners, isLoading } = useQuery({
    queryKey: ['owners'],
    queryFn: usersService.getUsers
  })

  if (isLoading) return <div className="p-4 text-center text-sm text-zinc-500">Loading owners...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Owners</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage the owners of this company.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 gap-2">
          <Plus className="h-4 w-4" />
          Add Owner
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {owners?.map((owner: any) => (
          <Card 
            key={owner.id} 
            className="border-zinc-200 dark:border-zinc-800 shadow-sm cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
            onClick={() => setSelectedOwner(owner)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{owner.first_name} {owner.last_name}</span>
                {owner.id === user?.id && (
                  <span className="text-xs font-normal px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-full">
                    You
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-xs">{owner.email}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-1.5 pb-4">
              <div className="flex justify-between">
                <span className="text-zinc-500">Phone:</span>
                <span className="font-medium">{owner.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">PAN:</span>
                <span className="font-medium uppercase">{owner.pan_number || 'N/A'}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddOwnerModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
      <OwnerDetailsModal open={!!selectedOwner} onOpenChange={(open) => !open && setSelectedOwner(null)} owner={selectedOwner} />
    </div>
  )
}

function CompanySettings() {
  const queryClient = useQueryClient()
  const { data: company, isLoading } = useQuery({
    queryKey: ['company'],
    queryFn: companiesService.getMe
  })

  const [formData, setFormData] = useState<CompanyUpdate>({
    name: '',
    organization_type: '',
    gst_number: '',
    pan_number: '',
    phone: '',
    website: ''
  })

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        organization_type: company.organization_type || '',
        gst_number: company.gst_number || '',
        pan_number: company.pan_number || '',
        phone: company.phone || '',
        website: company.website || ''
      })
    }
  }, [company])

  const mutation = useMutation({
    mutationFn: companiesService.updateMe,
    onSuccess: () => {
      toast.success('Company details updated successfully')
      queryClient.invalidateQueries({ queryKey: ['company'] })
    },
    onError: () => {
      toast.error('Failed to update company details')
    }
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleTypeChange = (val: string) => {
    setFormData(prev => ({ ...prev, organization_type: val }))
  }

  const handleSave = () => mutation.mutate(formData)

  if (isLoading) return <div className="p-4 text-center text-sm text-zinc-500">Loading company details...</div>

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800">
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
          <CardDescription>Configure your organization details shown on bills.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Organization Name</Label>
              <Input name="name" value={formData.name} onChange={handleChange} className="h-10" />
            </div>
            <div className="space-y-2">
              <Label>Organization Type</Label>
              <Select onValueChange={handleTypeChange} value={formData.organization_type}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  {ORG_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>GST Number</Label>
              <Input name="gst_number" value={formData.gst_number} onChange={handleChange} className="h-10 uppercase" />
            </div>
            <div className="space-y-2">
              <Label>Company PAN</Label>
              <Input name="pan_number" value={formData.pan_number} onChange={handleChange} className="h-10 uppercase" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Phone</Label>
              <Input name="phone" value={formData.phone} onChange={handleChange} className="h-10" />
            </div>
            <div className="space-y-2">
              <Label>Company Website</Label>
              <Input name="website" value={formData.website} onChange={handleChange} className="h-10" />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={mutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20">
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AddressSettings() {
  const queryClient = useQueryClient()
  const { data: company, isLoading } = useQuery({
    queryKey: ['company'],
    queryFn: companiesService.getMe
  })

  const [formData, setFormData] = useState<CompanyUpdate>({
    name: '',
    address_line1: '',
    city: '',
    state: '',
    country: '',
    postal_code: ''
  })

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        address_line1: company.address_line1 || '',
        city: company.city || '',
        state: company.state || '',
        country: company.country || '',
        postal_code: company.postal_code || ''
      })
    }
  }, [company])

  const mutation = useMutation({
    mutationFn: companiesService.updateMe,
    onSuccess: () => {
      toast.success('Address details updated successfully')
      queryClient.invalidateQueries({ queryKey: ['company'] })
    },
    onError: () => {
      toast.error('Failed to update address details')
    }
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = () => mutation.mutate(formData)

  if (isLoading) return <div className="p-4 text-center text-sm text-zinc-500">Loading address details...</div>

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800">
        <CardHeader>
          <CardTitle>Address Details</CardTitle>
          <CardDescription>Your registered primary business address.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Address Line 1</Label>
            <Input name="address_line1" value={formData.address_line1} onChange={handleChange} className="h-10" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input name="city" value={formData.city} onChange={handleChange} className="h-10" />
            </div>
            <div className="space-y-2">
              <Label>State / Province</Label>
              <Input name="state" value={formData.state} onChange={handleChange} className="h-10" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Country</Label>
              <Input name="country" value={formData.country} onChange={handleChange} className="h-10" />
            </div>
            <div className="space-y-2">
              <Label>Postal Code</Label>
              <Input name="postal_code" value={formData.postal_code} onChange={handleChange} className="h-10" />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={mutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20">
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SecuritySettings() {
  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input type="password" className="h-10" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" className="h-10" />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input type="password" className="h-10" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20">Update Password</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ApiKeySettings() {
  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage API keys for external integrations.</CardDescription>
            </div>
            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 gap-2">
              <Key className="h-4 w-4" />
              Generate Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <div>
                <p className="text-sm font-medium">Production API Key</p>
                <p className="text-xs text-zinc-500 mt-0.5 font-mono">eboe_live_sk_...x9f4 · Created Oct 1, 2023</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Copy</Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">Revoke</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('company')

  const renderContent = () => {
    switch (activeTab) {
      case 'company': return <CompanySettings />
      case 'owner': return <OwnerSettings />
      case 'address': return <AddressSettings />
      case 'security': return <SecuritySettings />
      case 'api': return <ApiKeySettings />
      default: return <CompanySettings />
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Profile & Settings</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your account, company, and application preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <nav className="w-full md:w-56 shrink-0">
          <div className="sticky top-24 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 min-w-0"
        >
          {renderContent()}
        </motion.div>
      </div>
    </div>
  )
}
