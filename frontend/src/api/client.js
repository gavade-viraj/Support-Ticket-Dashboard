import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const data = error.response.data;
      let message = data?.message || 'An error occurred';
      
      // If zod field errors exist, create a readable message
      if (data?.errors && typeof data.errors === 'object') {
        const errorList = Object.entries(data.errors)
          .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(', ') : errs}`)
          .join(' | ');
        if (errorList) {
          message = `${message} (${errorList})`;
        }
      }

      return Promise.reject({
        message,
        errors: data?.errors || null,
        status: error.response.status,
      });
    } else if (error.request) {
      return Promise.reject({
        message: 'Network error. Could not connect to server.',
      });
    } else {
      return Promise.reject({
        message: error.message || 'An unexpected error occurred',
      });
    }
  }
);

export default apiClient;