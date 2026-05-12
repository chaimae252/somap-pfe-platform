import api from "./api";

export const getNotifications = async (clientId: number) => {

    const response = await api.get(
        `/notifications/client/${clientId}`
    );

    return response.data;
};