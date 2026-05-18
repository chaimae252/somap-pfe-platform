import api from "./api";
import {
    LoginRequest,
    LoginResponse,
} from "@/types/auth";
import { useAuthStore } from '../store/authStore';

export const login = async (
    data: LoginRequest
): Promise<LoginResponse> => {

    const response = await api.post(
        "/auth/login",
        data
    );

    return response.data;
};

export const register = async (data: {
    nom: string;
    email: string;
    motDePasse: string;
    telephone: string;
    adresse?: string;
}) => {

    const response = await api.post(
        "/auth/register",
        data
    );

    return response.data;
};

export const forgotPassword = async (email: string) => {

    const response = await api.post(
        "/auth/forgot-password",
        { email }
    );

    return response.data;
};
export const verifyCode = async (
    email: string,
    code: string
) => {

    const response = await api.post(
        "/auth/verify-code",
        { email, code }
    );

    return response.data;
};
export const resetPassword = async (
    email: string,
    newPassword: string
) => {

    const response = await api.post(
        "/auth/reset-password",
        {
            email,
            newPassword,
        }
    );

    return response.data;
};
export const changePassword = async (oldPassword: string, newPassword: string) => {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('Non authentifié');

   const response = await api.put('/auth/change-password', 
    { currentPassword: oldPassword, newPassword },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};