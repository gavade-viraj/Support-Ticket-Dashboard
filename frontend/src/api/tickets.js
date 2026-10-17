import apiClient from './client';

export const ticketsAPI = {
  getAllTickets: async (params = {}) => {
    const response = await apiClient.get('/ticket', { params });
    return response.data;
  },

  getSingleTicket: async (id) => {
    const response = await apiClient.get(`/ticket/${id}`);
    return response.data;
  },

  createTicket: async (ticketData) => {
    const response = await apiClient.post('/ticket', ticketData);
    return response.data;
  },

  updateTicket: async (id, ticketData) => {
    const response = await apiClient.patch(`/ticket/${id}`, ticketData);
    return response.data;
  },

  updateTicketStatus: async (id, status) => {
    const response = await apiClient.patch(`/ticket/${id}/status`, { status });
    return response.data;
  },

  deleteTicket: async (id) => {
    const response = await apiClient.delete(`/ticket/${id}`);
    return response.data;
  },

  getDashboard: async () => {
    const response = await apiClient.get('/ticket/dashboard');
    return response.data;
  },

  getTicketActivity: async (id) => {
    const response = await apiClient.get(`/ticket/${id}/activity`);
    return response.data;
  },
};