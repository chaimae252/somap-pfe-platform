import api from "./api";

export const getHomeStats = async (clientId: number) => {

    const response = await api.get(
        `/dashboard/stats/${clientId}`
    );

    return response.data;
};