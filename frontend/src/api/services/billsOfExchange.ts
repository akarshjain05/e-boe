import api from '../axios';

export interface BillOfExchange {
  id: string;
  company_id: string;
  network_drawee_company_id?: string;
  current_holder_company_id?: string;
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
  rejected_at?: string;
  rejected_reason?: string;
  public_access_token?: string;
  is_negotiable?: boolean;
  endorsement_restricted?: boolean;
  created_at: string;
  updated_at: string;
  invoices: {
    id: string;
    bill_of_exchange_id: string;
    bill_id: string;
  }[];
  endorsements: BOEEndorsement[];
}

export interface BOEEndorsement {
  id: string;
  bill_of_exchange_id: string;
  sequence_no: number;
  endorser_company_id: string;
  endorser_name: string;
  endorser_signature_ref?: string;
  endorsee_company_id?: string;
  endorsee_name: string;
  endorsee_address?: string;
  endorsee_phone?: string;
  endorsee_email?: string;
  endorsement_type: string;
  endorsement_date: string;
  remarks?: string;
  is_active: boolean;
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
  is_negotiable?: boolean;
  endorsement_restricted?: boolean;
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
