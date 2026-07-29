import axios from 'axios';

const API_URL = 'http://localhost:5000/api/teams';

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export const getNotifications = async (params) => {
  const response = await axios.get(`${API_URL}/notifications`, {
    ...getAuthHeaders(),
    params: {
      fromDate: params.fromDate || undefined,
      toDate: params.toDate || undefined,
      employee: params.employee !== 'All Employees' && params.employee ? params.employee : undefined,
      teamsGroup: params.teamsGroup !== 'All Groups' ? params.teamsGroup : undefined,
      status: params.status !== 'All' ? params.status : undefined,
      search: params.search || undefined,
      page: params.page,
      limit: params.limit
    }
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