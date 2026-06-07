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
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("userId");
                localStorage.removeItem("userName");
                localStorage.removeItem("userRole");
                localStorage.removeItem("userEmail");
                sessionStorage.clear();
                window.location.href = "/";
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

            const refreshToken = localStorage.getItem("refreshToken");

            if (!refreshToken) {
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("userId");
                localStorage.removeItem("userName");
                localStorage.removeItem("userRole");
                localStorage.removeItem("userEmail");
                sessionStorage.clear();
                window.location.href = "/";
                return Promise.reject(error);
            }

            try {
                const response = await axios.post(`${API_ORIGIN}/api/auth/refresh`, {
                    refreshToken,
                });

                const { accessToken, refreshToken: newRefreshToken } = response.data;

                localStorage.setItem("token", accessToken);
                localStorage.setItem("refreshToken", newRefreshToken);

                api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                processQueue(null, accessToken);
                return api(originalRequest);
            } catch (err) {
                processQueue(err, null);
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("userId");
                localStorage.removeItem("userName");
                localStorage.removeItem("userRole");
                localStorage.removeItem("userEmail");
                sessionStorage.clear();
                window.location.href = "/";
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
