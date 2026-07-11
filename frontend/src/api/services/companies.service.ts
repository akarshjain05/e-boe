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

export const companiesService = {
  getMe: async () => {
    const response = await api.get('/companies/me');
    return response.data;
  },
  updateMe: async (data: CompanyUpdate) => {
    const response = await api.put('/companies/me', data);
    return response.data;
  },
  lookupByGst: async (gstin: string) => {
    const response = await api.get(`/companies/lookup/${gstin}`);
    return response.data;
  },
};
