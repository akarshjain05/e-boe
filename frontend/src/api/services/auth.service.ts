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
    // Transform camelCase frontend schema to snake_case backend payload
    const payload = {
      email: data.email,
      password: data.password,
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      company_name: data.companyName,
      company_email: data.companyEmail,
      organization_type: data.organizationType,
      company_pan: data.companyPan,
      owner_pan: data.ownerPan,
      company_phone: data.companyPhone,
      company_website: data.companyWebsite,
      gst_number: data.gstNumber,
      address_line1: data.addressLine1,
      city: data.city,
      state: data.state,
      country: data.country,
      postal_code: data.postalCode
    };
    const response = await api.post('/auth/register', payload);
    return response.data;
  }
};
