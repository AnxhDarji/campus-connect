import * as authService from "../services/auth.service.js";

export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const setCookieToken = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const verifyOTP = async (req, res, next) => {
  try {
    const result = await authService.verifyOTP(req.body);
    setCookieToken(res, result.token);
    const { token, ...data } = result;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

export const resendOTP = async (req, res, next) => {
  try {
    const result = await authService.resendOTP(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    setCookieToken(res, result.token);
    const { token, ...data } = result;
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'strict' });
  res.json({ success: true, message: 'Logged out successfully.' });
};
