// src/services/apiService.js
import axios from 'axios';
import { getToken } from './LoginApis';
import BASE_URL from './apiConfig';

const apiClient = axios.create({
  baseURL: '/api',
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('Request config:', config);
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default apiClient;
