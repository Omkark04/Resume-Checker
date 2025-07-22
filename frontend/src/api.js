import axios from "axios";
import { ACCESS_TOKEN } from "./constants";

const api = axios.create({
  baseURL: "http://localhost:8000/",
  headers: {
    "Content-Type": "application/json",
  },
});

// Modified interceptor to exclude auth header for registration/login
api.interceptors.request.use(
  (config) => {
    // Skip adding token for these endpoints
    if (config.url.includes('/register') || config.url.includes('/login')) {
      return config;
    }
    
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;