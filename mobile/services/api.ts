import axios from "axios";
import { getToken, saveToken, getRefreshToken, saveRefreshToken, logoutUser } from "@/utils/storage";
import { useAuthStore } from "@/store/authStore";
import { router } from "expo-router";

// ipconfig Chaimae: http://10.0.2.2:8080/api // // Manal http:// 192.168.1.119:8080/api
export const API_ORIGIN = "https://somap-pfe-platform-production.up.railway.app";

const api = axios.create({
    baseURL: `${API_ORIGIN}/api`,
    headers: {
        "Content-Type": "application/json",
    },
});

// Automatically attach JWT token
api.interceptors.request.use(
    async (config) => {
        const token = await getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Intercept 401 Unauthorized responses to perform silent token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (originalRequest.url?.includes("/auth/refresh")) {
                // If refresh call itself fails, logout user
                await logoutUser();
                useAuthStore.getState().logout();
                router.replace("/login");
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = await getRefreshToken();

            if (!refreshToken) {
                await logoutUser();
                useAuthStore.getState().logout();
                router.replace("/login");
                return Promise.reject(error);
            }

            try {
                const response = await axios.post(`${API_ORIGIN}/api/auth/refresh`, {
                    refreshToken,
                });

                const { accessToken, refreshToken: newRefreshToken } = response.data;

                await saveToken(accessToken);
                await saveRefreshToken(newRefreshToken);

                api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                processQueue(null, accessToken);
                return api(originalRequest);
            } catch (err) {
                processQueue(err, null);
                await logoutUser();
                useAuthStore.getState().logout();
                router.replace("/login");
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
