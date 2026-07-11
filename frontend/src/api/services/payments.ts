import api from '../axios';

export interface Payment {
  id: string;
  bill_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number: string | null;
  status: string;
  notes: string | null;
  receipt_number: string;
  created_at: string;
}

export interface PaymentCreate {
  bill_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number?: string;
  notes?: string;
}

export interface BillPayment {
  bill_id: string;
  amount: number;
}

export interface BulkPaymentCreate {
  payments: BillPayment[];
  payment_method: string;
  payment_date: string;
  bank_name?: string;
  cheque_number?: string;
  cheque_date?: string;
  upi_id?: string;
  transaction_id?: string;
  reference_number?: string;
  notes?: string;
}

export const paymentService = {
  getPayments: async (params?: { search?: string; sort_by?: string; sort_order?: 'asc' | 'desc'; status?: string; payment_method?: string }): Promise<Payment[]> => {
    const response = await api.get('/payments/', { params });
    return response.data;
  },
  
  getPayment: async (id: string): Promise<Payment> => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },
  
  recordPayment: async (data: PaymentCreate): Promise<Payment> => {
    const response = await api.post('/payments/', data);
    return response.data;
  },
  
  getPaymentsForBill: async (billId: string): Promise<Payment[]> => {
    const response = await api.get(`/payments/bill/${billId}`);
    return response.data;
  },

  confirmPayment: async (paymentId: string): Promise<Payment> => {
    const response = await api.post(`/payments/${paymentId}/confirm`);
    return response.data;
  },

  recordBulkPayment: async (data: BulkPaymentCreate): Promise<Payment[]> => {
    const response = await api.post('/payments/bulk', data);
    return response.data;
  }
};
