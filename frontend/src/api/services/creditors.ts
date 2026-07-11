import api from '../axios';

export interface Creditor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_id: string | null;
  credit_limit: number;
  outstanding_balance: number;
  is_active: boolean;
  status: string;
}

export interface CreditorCreate {
  creditor_type: 'B2B' | 'B2C';
  creditor_code: string;
  business_type: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  gst_number?: string;
  credit_limit?: number;
}

export const creditorService = {
  getCreditors: async (params?: { search?: string; sort_by?: string; sort_order?: 'asc' | 'desc' }): Promise<Creditor[]> => {
    const response = await api.get('/creditors', { params });
    return response.data;
  },
  
  getCreditor: async (id: string): Promise<Creditor> => {
    const response = await api.get(`/creditors/${id}`);
    return response.data;
  },
  
  createCreditor: async (data: CreditorCreate): Promise<Creditor> => {
    const response = await api.post('/creditors', data);
    return response.data;
  },
  
  updateCreditor: async (id: string, data: Partial<CreditorCreate>): Promise<Creditor> => {
    const response = await api.put(`/creditors/${id}`, data);
    return response.data;
  },
  
  deleteCreditor: async (id: string): Promise<void> => {
    await api.delete(`/creditors/${id}`);
  }
};
