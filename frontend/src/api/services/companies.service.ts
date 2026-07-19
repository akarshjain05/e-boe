import api from '../axios';

export interface CompanyUpdate {
  name: string;
  legal_name?: string;
  organization_type?: string;
  registration_number?: string;
  tax_id?: string;
  gst_number?: string;
  pan_number?: string;
  email?: string;
  phone?: string;
  website?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  currency_code?: string;
  timezone?: string;
}

export interface Branch {
  id?: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  is_active?: boolean;
  is_head_office?: boolean;
}

export const companiesService = {
  getMe: async () => {
    const response = await api.get('/companies/me');
    return response.data;
  },
  getNetworkCompanies: async () => {
    const response = await api.get('/companies/network');
    return response.data;
  },
  updateMe: async (data: CompanyUpdate) => {
    const response = await api.put('/companies/me', data);
    return response.data;
  },
  getBranches: async (): Promise<Branch[]> => {
    const response = await api.get('/companies/me/branches');
    return response.data;
  },
  createBranch: async (data: Branch): Promise<Branch> => {
    const response = await api.post('/companies/me/branches', data);
    return response.data;
  },
  lookupByGst: async (gstin: string) => {
    const response = await api.get(`/companies/lookup/${gstin}`);
    return response.data;
  },
};
