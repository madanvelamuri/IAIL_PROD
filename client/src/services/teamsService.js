import api from './api';

export const getNotifications = async (params) => {
  const response = await api.get('/teams/notifications', { params });
  return response.data;
};

export const resendNotification = async (payload) => {
  const response = await api.post('/teams/send', payload);
  return response.data;
};

export const sendTestNotification = async (webhookUrl) => {
  const response = await api.post('/teams/test', { webhookUrl });
  return response.data;
};

export const getTeamsSettings = async () => {
  const response = await api.get('/teams/settings');
  return response.data;
};

export const saveTeamsSettings = async (settings) => {
  const response = await api.post('/teams/settings', settings);
  return response.data;
};