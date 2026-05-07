import api from "./api";
import { Client } from "@/types/client";

export const getAllClients = async (): Promise<Client[]> => {

    const response = await api.get("/clients");

    return response.data;
};

export const getClientById = async (
    id: number
): Promise<Client> => {

    const response = await api.get(`/clients/${id}`);

    return response.data;
};

export const updateClient = async (
    id: number,
    client: Client
): Promise<Client> => {

    const response = await api.put(
        `/clients/${id}`,
        client
    );

    return response.data;
};

export const deleteClient = async (
    id: number
) => {

    const response = await api.delete(
        `/clients/${id}`
    );

    return response.data;
};