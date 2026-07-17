import api from '../axios';
import { LoginFormValues, RegisterFormValues } from '@/schemas/auth';

export const authService = {
  login: async (data: LoginFormValues) => {
    // We only send email and password to backend, rememberMe is handled locally if needed
    const payload = {
      gst_number: data.gstNumber,
      password: data.password
    };
    const response = await api.post('/auth/login', payload);
    return response.data;
  },

  register: async (data: RegisterFormValues) => {
    // Transform frontend schema to backend payload
    const payload = {
      gst_number: data.gstNumber,
      email: data.email,
      phone: data.phone,
      password: data.password
    };
    const response = await api.post('/auth/register', payload);
    return response.data;
  },

  verifyGst: async (gstNumber: string) => {
    const response = await api.get(`/auth/verify-gst/${gstNumber}`);
    return response.data;
  }
};
