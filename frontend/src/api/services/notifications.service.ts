import api from '../axios';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  priority: string;
  data_json: any;
  created_at: string;
}

export const notificationsService = {
  getNotifications: async (limit: number = 50): Promise<Notification[]> => {
    const response = await api.get('/notifications', { params: { limit } });
    return response.data;
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<{ status: string; message: string }> => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  }
};
