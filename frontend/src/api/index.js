import axios from 'axios';

// Create an axios instance with base URL
// In production, REACT_APP_API_URL is set to your Railway backend URL
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
});

// INTERCEPTOR: automatically adds the JWT token to every request
// This is like automatically showing your ID card every time you enter a building
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// INTERCEPTOR: if the server says "unauthorized", log the user out automatically
API.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
