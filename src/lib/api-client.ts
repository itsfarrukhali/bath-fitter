import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle global errors here (e.g., 401 Unauthorized)
    if (error.response?.status === 401) {
      // Redirect to login or show auth modal if needed
      console.warn('Unauthorized access');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
