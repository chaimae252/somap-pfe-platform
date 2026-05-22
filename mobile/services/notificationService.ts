import api from "./api";

export const getNotifications = async (clientId: number) => {
    const response = await api.get(`/notifications/client/${clientId}`);

    console.log("📡 API RESPONSE STATUS:", response.status);
    console.log("📡 API RESPONSE DATA:", response.data);

    return response.data;
};

export const markNotificationAsRead = async (notificationId: string | number) => {
    const response = await api.put(`/notifications/${notificationId}/read`);

    return response.data;
};
