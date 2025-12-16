import axios from 'axios';

/**
 * API Client Configuration
 *
 * INTEGRATION NOTE:
 * - Configured to work with backend API
 * - Credentials included for session cookies
 * - In production, update baseURL to your API domain
 */

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - could redirect to login
      console.error('Unauthorized request');
    }
    return Promise.reject(error);
  }
);

export default api;
