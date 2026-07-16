import api from '../axios';
import { Bill } from './bills';

const PUBLIC_BILLS_URL = '/public/bills';

export const publicService = {
  getBill: async (token: string): Promise<Bill> => {
    const response = await api.get(`${PUBLIC_BILLS_URL}/${token}`);
    return response.data;
  },

  acceptBill: async (token: string): Promise<Bill> => {
    const response = await api.post(`${PUBLIC_BILLS_URL}/${token}/accept`);
    return response.data;
  },

  downloadPdf: async (token: string): Promise<void> => {
    const response = await api.get(`${PUBLIC_BILLS_URL}/${token}/pdf`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const contentDisposition = response.headers['content-disposition'];
    let fileName = 'bill.pdf';
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (fileNameMatch && fileNameMatch.length === 2) {
        fileName = fileNameMatch[1];
      }
    }
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
