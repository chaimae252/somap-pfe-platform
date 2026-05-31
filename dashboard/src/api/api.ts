import axios from "axios";

export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? "http://localhost:8080";

const api = axios.create({
    baseURL: `${API_ORIGIN}/api`,
    headers: {
        "Content-Type": "application/json",
    },
});

// Attach JWT token from localStorage (WEB version)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
