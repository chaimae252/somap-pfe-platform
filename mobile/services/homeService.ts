import api from "./api";

const countItems = (items: unknown): number => Array.isArray(items) ? items.length : 0;

type NotificationPayload = { lu?: boolean | number | string };

const isUnread = (notification: NotificationPayload): boolean => (
    notification?.lu === 0 ||
    notification?.lu === "0" ||
    notification?.lu === false
);
export const getHomeStats = async (clientId: number) => {
const [demandesResponse, projetsResponse, notificationsResponse, servicesResponse] = await Promise.all([
        api.get(`/demandes/client/${clientId}`),
        api.get(`/projets/client/${clientId}`),
        api.get(`/notifications/client/${clientId}`),
        api.get("/services"),
    ]);

    const notifications: NotificationPayload[] = Array.isArray(notificationsResponse.data)
        ? notificationsResponse.data
        : [];
        return {
        clients: 1,
        demandes: countItems(demandesResponse.data),
        projets: countItems(projetsResponse.data),
        services: countItems(servicesResponse.data),
        notifications: notifications.filter(isUnread).length,
    };
};