import api from '../axios';

export interface BillOfExchange {
  id: string;
  company_id: string;
  network_drawee_company_id?: string;
  customer_id: string;
  drawer_name: string;
  drawer_address?: string;
  drawer_phone?: string;
  drawer_email?: string;
  drawee_name: string;
  drawee_address?: string;
  drawee_phone?: string;
  drawee_email?: string;
  amount: number;
  description?: string;
  issue_date: string;
  due_date: string;
  place_of_issue?: string;
  status: string;
  boe_pdf_url?: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
  invoices: {
    id: string;
    bill_of_exchange_id: string;
    bill_id: string;
  }[];
}

export interface BillOfExchangeCreate {
  customer_id: string;
  drawer_name: string;
  drawer_address?: string;
  drawer_phone?: string;
  drawer_email?: string;
  drawee_name: string;
  drawee_address?: string;
  drawee_phone?: string;
  drawee_email?: string;
  amount: number;
  description?: string;
  issue_date: string;
  due_date: string;
  place_of_issue?: string;
  invoice_ids: string[];
}

class BillsOfExchangeService {
  async getBillsOfExchange(params?: { skip?: number; limit?: number; customer_id?: string }) {
    const response = await api.get<BillOfExchange[]>('/bills-of-exchange/', { params });
    return response.data;
  }

  async getBillOfExchange(id: string) {
    const response = await api.get<BillOfExchange>(`/bills-of-exchange/${id}`);
    return response.data;
  }

  async createBillOfExchange(data: BillOfExchangeCreate) {
    const response = await api.post<BillOfExchange>('/bills-of-exchange/', data);
    return response.data;
  }

  async updateBillOfExchange(id: string, data: Partial<BillOfExchangeCreate> & { status?: string }) {
    const response = await api.put<BillOfExchange>(`/bills-of-exchange/${id}`, data);
    return response.data;
  }

  async deleteBillOfExchange(id: string) {
    const response = await api.delete<BillOfExchange>(`/bills-of-exchange/${id}`);
    return response.data;
  }
}

export const boeService = new BillsOfExchangeService();
