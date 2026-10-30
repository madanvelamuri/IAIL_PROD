
import axios from "axios";

// ==========================================
// BACKEND URL CONFIGURATION
// ==========================================

const rawBaseURL = import.meta.env.VITE_API_URL?.trim();

const backendURL =
  rawBaseURL ||
  (import.meta.env.DEV ? "http://localhost:5000" : "");

// Remove trailing slash and optional /api suffix
const cleanBaseURL = backendURL
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

// Create Axios instance
const API = axios.create({
  baseURL: cleanBaseURL ? `${cleanBaseURL}/api` : "/api",
  timeout: 30000,
});

// ==========================================
// REQUEST INTERCEPTOR
// Attach JWT token to authenticated requests
// ==========================================

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    config.headers = config.headers || {};

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// RESPONSE INTERCEPTOR
// Handle API errors
// ==========================================

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestURL = error.config?.url;

    console.error("API Request Failed:", {
      url: requestURL,
      status,
      message: error.message,
      response: error.response?.data,
    });

    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Prevent repeated redirects
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

export default API;
