import api from "./api";

export const getCurrentProject = async (
    clientId: number
) => {

    const response = await api.get(
        `/projets/current/${clientId}`
    );

    return response.data;
};