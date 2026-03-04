import axios from "axios";

const API = axios.create({
  baseURL: "https://iailgo-production.up.railway.app/api",
});

/* REQUEST INTERCEPTOR */
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/*  RESPONSE INTERCEPTOR Handles session expiry */
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      alert("Session expired. Please login again.");

      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default API;