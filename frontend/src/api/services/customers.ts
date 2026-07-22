import api from '../axios';

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_id: string | null;
  gst_number: string | null;
  credit_limit: number;
  outstanding_balance: number;
  is_active: boolean;
  status: string;
}

export interface CustomerCreate {
  customer_code: string;
  business_type: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  gst_number?: string;
  credit_limit?: number;
}

export const customerService = {
  getCustomers: async (params?: { search?: string; sort_by?: string; sort_order?: 'asc' | 'desc'; status?: string; has_outstanding?: boolean }): Promise<Customer[]> => {
    const response = await api.get('/customers', { params });
    return response.data;
  },
  
  getCustomer: async (id: string): Promise<Customer> => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },
  
  createCustomer: async (data: CustomerCreate): Promise<Customer> => {
    const response = await api.post('/customers', data);
    return response.data;
  },
  
  updateCustomer: async (id: string, data: Partial<CustomerCreate>): Promise<Customer> => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },
  
  deleteCustomer: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
  }
};
