import api from './api';

export const register = (userData) =>
  api.post('/api/auth/register', userData);

export const login = (credentials) =>
  api.post('/api/auth/login', credentials);
