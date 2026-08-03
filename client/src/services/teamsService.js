import axios from 'axios';

// Dynamically use Vite env variable or fallback to localhost, safely handling trailing '/api'
const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const cleanBase = rawBase.replace(/\/api\/?$/, ''); // Strip trailing /api if present

const API_URL = `${cleanBase}/api/teams`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  };
};

export const getNotifications = async (params = {}) => {
  const response = await axios.get(`${API_URL}/notifications`, {
    ...getAuthHeaders(),
    params: {
      fromDate: params.fromDate || undefined,
      toDate: params.toDate || undefined,
      employee: params.employee && params.employee !== 'All Employees' ? params.employee : undefined,
      teamsGroup: params.teamsGroup && params.teamsGroup !== 'All Groups' ? params.teamsGroup : undefined,
      status: params.status && params.status !== 'All' ? params.status : undefined,
      search: params.search || undefined,
      page: params.page || 1,
      limit: params.limit || 10,
    },
  });
  return response.data;
};

export const resendNotification = async (payload) => {
  const response = await axios.post(`${API_URL}/send`, payload, getAuthHeaders());
  return response.data;
};

export const syncDashboardNotifications = async () => {
  const response = await axios.post(`${API_URL}/sync-dashboard`, {}, getAuthHeaders());
  return response.data;
};

export const getTeamsSettings = async () => {
  const response = await axios.get(`${API_URL}/settings`, getAuthHeaders());
  return response.data;
};

export const saveTeamsSettings = async (settings) => {
  const response = await axios.post(`${API_URL}/settings`, settings, getAuthHeaders());
  return response.data;
};

export const sendTestNotification = async (webhookUrl) => {
  const response = await axios.post(`${API_URL}/test`, { webhookUrl }, getAuthHeaders());
  return response.data;
};