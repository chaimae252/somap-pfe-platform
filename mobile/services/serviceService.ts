import api from "./api";

export const getAllServices = async () => {
    const response = await api.get("/services");
    return response.data;
};

export const getServiceById = async (id: string) => {
    const response = await api.get(`/services/${id}`);
    return response.data;
};

