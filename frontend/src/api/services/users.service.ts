import api from '../axios';

export interface UserUpdate {
  first_name: string;
  last_name: string;
  phone?: string;
  pan_number?: string;
}

export const usersService = {
  getUsers: async () => {
    const response = await api.get('/users/');
    return response.data;
  },
  createUser: async (data: any) => {
    const response = await api.post('/users/', data);
    return response.data;
  },
  updateMe: async (data: UserUpdate) => {
    const response = await api.put('/users/me', data);
    return response.data;
  },
};
