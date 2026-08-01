import api from './api';

export const register = (userData) =>
  api.post('/api/auth/register', userData);

export const verifyOtp = (data) =>
  api.post('/api/auth/verify-otp', data);

export const resendOtp = (data) =>
  api.post('/api/auth/resend-otp', data);

export const login = (credentials) =>
  api.post('/api/auth/login', credentials);

export const logout = () =>
  api.post('/api/auth/logout');

export const getMe = () =>
  api.get('/api/auth/me');
