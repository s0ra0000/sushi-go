// lib/axiosInstance.js
import axios from "axios";
import Cookies from "js-cookie";

const axiosInstance = axios.create({
  // Optionally set a baseURL (for example, process.env.API_URL)
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
});

// Attach the access token from cookies to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = Cookies.get("token");
    if (accessToken) {
      // Here we set the token in the Authorization header.
      config.headers.Authorization = `Bearer ${accessToken}`;
      // Or you can use a custom header like x-token if your backend expects that.
      config.headers["x-token"] = accessToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
