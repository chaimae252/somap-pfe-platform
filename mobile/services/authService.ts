import api from "./api";
import {
    LoginRequest,
    LoginResponse,
} from "@/types/auth";

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