import api from '../axios';

export interface RecentPayment {
  id: string;
  receipt_number: string;
  amount: number;
  payment_date: string;
  status: string;
}

export interface DashboardSummary {
  total_receivable: number;
  total_received: number;
  total_payable: number;
  total_paid: number;
  active_bills: number;
  total_customers: number;
  overdue_count: number;
  due_this_week: number;
  recent_payments: RecentPayment[];
}

export const dashboardService = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  }
};
