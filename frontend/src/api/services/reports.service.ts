import api from '../axios';

export const reportsService = {
  getDashboardReports: async () => {
    const response = await api.get('/reports/dashboard');
    return response.data;
  },
};
