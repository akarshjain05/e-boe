import api from '../axios';
import { Customer } from './customers';

export interface BillItem {
  id: string;
  description: string;
  hsn_code: string | null;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  discount_percent: number;
  amount: number;
}

export interface Bill {
  id: string;
  bill_number: string;
  status: string;
  issue_date: string;
  due_date: string;
  currency_code: string;
  drawer_name: string;
  drawer_address?: string;
  drawer_state?: string;
  drawer_account?: string;
  drawee_name: string;
  drawee_address?: string;
  drawee_state?: string;
  drawee_account?: string;
  payee_name: string;
  amount: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  terms_and_conditions: string | null;
  customer_id: string | null;
  creditor_id: string | null;
  drawee_creditor_id?: string | null;
  payee_customer_id?: string | null;
  network_drawee_company_id?: string | null;
  network_payee_company_id?: string | null;
  bill_type: 'receivable' | 'payable';
  transaction_type: string;
  credit_period_months?: number;
  customer?: Customer;
  creditor?: any;
  items: BillItem[];
}

export interface BillCreate {
  customer_id: string;
  bill_number: string;
  issue_date: string;
  due_date: string;
  credit_period_months?: number;
  place_of_issue?: string;
  transaction_type?: string;
  currency_code?: string;
  drawer_name: string;
  drawee_name: string;
  payee_name: string;
  terms_and_conditions?: string;
  items: {
    description: string;
    hsn_code?: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    discount_percent?: number;
  }[];
}

export const billService = {
  getBills: async (params?: { limit?: number; search?: string; sort_by?: string; sort_order?: 'asc' | 'desc'; bill_type?: 'receivable' | 'payable'; status?: string; from_date?: string; to_date?: string; creditor_id?: string; customer_id?: string }): Promise<Bill[]> => {
    const response = await api.get('/bills', { params });
    return response.data;
  },
  
  getBill: async (id: string): Promise<Bill> => {
    const response = await api.get(`/bills/${id}`);
    return response.data;
  },
  
  createBill: async (data: BillCreate): Promise<Bill> => {
    const response = await api.post('/bills', data);
    return response.data;
  },
  
  updateBillStatus: async (id: string, status: string, notes?: string): Promise<Bill> => {
    const response = await api.post(`/bills/${id}/status/${status}`, { notes });
    return response.data;
  },
  
  updateBill: async (id: string, data: Partial<BillCreate>): Promise<Bill> => {
    const response = await api.put(`/bills/${id}`, data);
    return response.data;
  },
  
  deleteBill: async (id: string): Promise<void> => {
    await api.delete(`/bills/${id}`);
  },
  
  getBillPdfUrl: (id: string): string => {
    return `${api.defaults.baseURL}/documents/bills/${id}/pdf`;
  }
};
