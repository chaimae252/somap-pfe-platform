import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ipconfig Chaimae: http://10.0.2.2:8080/api // // Manal http://192.168.1.105:8080/api
const api = axios.create({
    baseURL: "http://10.0.2.2:8080/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Automatically attach JWT token
api.interceptors.request.use(
    async (config) => {

        const token = await AsyncStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default api;