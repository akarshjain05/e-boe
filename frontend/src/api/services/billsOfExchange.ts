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

  discounting_requests?: DiscountingRequest[];
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

export interface DiscountingRequest {
  id: string;
  bill_of_exchange_id: string;
  requested_by_company_id: string;
  requested_by_user_id: string;
  face_value: number;
  tenor_days: number;
  bidding_start_at: string;
  bidding_end_at?: string;
  min_acceptable_rate_bps?: number;
  max_acceptable_rate_bps?: number;
  status: string;
  selected_bid_id?: string;
  created_at: string;
  bids?: BillOfExchangeBid[];
}

export interface BillOfExchangeBid {
  id: string;
  discounting_request_id: string;
  financier_company_id: string;
  discount_rate_bps: number;
  platform_fee_bps: number;
  computed_discount_amount: number;
  computed_net_payable: number;
  status: string;
  bid_submitted_at: string;
  expires_at: string;
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

  async acceptBillOfExchange(id: string) {
    const response = await api.post<BillOfExchange>(`/bills-of-exchange/${id}/accept`);
    return response.data;
  }

  async sendForAcceptance(id: string) {
    const response = await api.post<BillOfExchange>(`/bills-of-exchange/${id}/send`);
    return response.data;
  }

  async cancelBill(id: string) {
    const response = await api.post<BillOfExchange>(`/bills-of-exchange/${id}/cancel`);
    return response.data;
  }

  async rejectBill(id: string) {
    const response = await api.post<BillOfExchange>(`/bills-of-exchange/${id}/reject`);
    return response.data;
  }

  async endorseBill(id: string, data: any) {
    const response = await api.post<BillOfExchange>(`/bills-of-exchange/${id}/endorse`, data);
    return response.data;
  }


  async getPublicBillOfExchange(token: string) {
    const response = await api.get<BillOfExchange>(`/public/bills-of-exchange/${token}`);
    return response.data;
  }

  async acceptPublicBill(token: string) {
    const response = await api.post<BillOfExchange>(`/public/bills-of-exchange/${token}/accept`);
    return response.data;
  }

  async rejectPublicBill(token: string) {
    const response = await api.post<BillOfExchange>(`/public/bills-of-exchange/${token}/reject`);
    return response.data;
  }

  async createDiscountingRequest(id: string, data: { bidding_end_at: string, min_acceptable_rate_bps?: number, max_acceptable_rate_bps?: number }) {
    const response = await api.post<DiscountingRequest>(`/bills-of-exchange/${id}/discounting-requests`, data);
    return response.data;
  }
}

export const boeService = new BillsOfExchangeService();
