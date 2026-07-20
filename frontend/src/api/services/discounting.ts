import api from '../axios';
import { BillOfExchange, DiscountingRequest, BillOfExchangeBid } from './billsOfExchange';

export interface DiscountingTransaction {
  id: string;
  discounting_request_id: string;
  bid_id: string;
  financier_company_id: string;
  seller_company_id: string;
  disbursement_reference: string;
  disbursed_amount: number;
  disbursed_at: string;
  maturity_amount_due: number;
  maturity_settlement_status: string;
  settled_amount: number;
  settled_at?: string;
  recourse_type: string;
  created_at: string;
}

class DiscountingService {
  async getDiscountingRequests(params?: { skip?: number; limit?: number }) {
    const response = await api.get<DiscountingRequest[]>('/discounting-requests', { params });
    return response.data;
  }

  async getDiscountingRequest(id: string) {
    const response = await api.get<DiscountingRequest>(`/discounting-requests/${id}`);
    return response.data;
  }

  async submitBid(id: string, data: { financier_company_id: string; discount_rate_bps: number; platform_fee_bps?: number }) {
    const response = await api.post<BillOfExchangeBid>(`/discounting-requests/${id}/bids`, data);
    return response.data;
  }

  async withdrawBid(id: string, bidId: string) {
    const response = await api.delete<BillOfExchangeBid>(`/discounting-requests/${id}/bids/${bidId}`);
    return response.data;
  }

  async selectBid(id: string, bidId: string) {
    const response = await api.post<BillOfExchange>(`/discounting-requests/${id}/select-bid`, { bid_id: bidId });
    return response.data;
  }

  async disburse(id: string) {
    const response = await api.post<BillOfExchange>(`/discounting-requests/${id}/disburse`);
    return response.data;
  }

  async getDiscountingTransactions(params?: { skip?: number; limit?: number }) {
    const response = await api.get<DiscountingTransaction[]>('/discounting-transactions', { params });
    return response.data;
  }

  async settleTransaction(id: string) {
    const response = await api.post<DiscountingTransaction>(`/discounting-transactions/${id}/settle`);
    return response.data;
  }
}

export const discountingService = new DiscountingService();
