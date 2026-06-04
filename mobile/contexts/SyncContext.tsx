import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useAuthStore } from "@/store/authStore";

const SYNC_INTERVAL_MS = 10000;

type SyncContextValue = {
    version: number;
    refreshNow: () => void;
};

const SyncContext = createContext<SyncContextValue>({
    version: 0,
    refreshNow: () => {},
});

export function SyncProvider({ children }: { children: React.ReactNode }) {
    const token = useAuthStore((state) => state.token);
    const userId = useAuthStore((state) => state.user?.id);
    const [version, setVersion] = useState(0);
    const notifiedIdsRef = React.useRef<Set<string | number>>(new Set());

    const refreshNow = () => setVersion((current) => current + 1);

    // Clear tracked notification IDs if the user changes or logs out
    useEffect(() => {
        notifiedIdsRef.current.clear();
    }, [userId]);

    useEffect(() => {
        const isAuthenticated = Boolean(token || userId);
        if (!isAuthenticated) return;

        const handleAppStateChange = (nextState: AppStateStatus) => {
            if (nextState === "active") {
                refreshNow();
            }
        };

        const subscription = AppState.addEventListener("change", handleAppStateChange);
        const interval = setInterval(() => {
            if (AppState.currentState === "active") {
                refreshNow();
            }
        }, SYNC_INTERVAL_MS);

        return () => {
            subscription.remove();
            clearInterval(interval);
        };
    }, [token, userId]);

    // Check for new notifications and trigger local push notifications
    useEffect(() => {
        if (!userId) return;

        const checkNewNotifications = async () => {
            try {
                const { getNotifications } = await import("../services/notificationService");
                const { showLocalNotification } = await import("../services/pushNotificationService");

                const data = await getNotifications(userId);
                if (!Array.isArray(data)) return;

                // If notifiedIdsRef is empty, initialize it with all current unread notifications
                // to avoid alerting for historical unread notifications.
                const isInitializing = notifiedIdsRef.current.size === 0;

                data.forEach((n: any) => {
                    const id = n.id;
                    const isUnread = n.lu === 0 || n.lu === "0" || n.lu === false;

                    if (isUnread) {
                        if (isInitializing) {
                            notifiedIdsRef.current.add(id);
                        } else if (!notifiedIdsRef.current.has(id)) {
                            notifiedIdsRef.current.add(id);
                            // Trigger local alert in phone status bar
                            void showLocalNotification(
                                n.titre || "SOMAP & SERVICE",
                                n.message || "Nouvelle notification reçue."
                            );
                        }
                    }
                });
            } catch (error) {
                console.log("❌ Error checking notifications in SyncContext:", error);
            }
        };

        void checkNewNotifications();
    }, [version, userId]);

    const value = useMemo(() => ({ version, refreshNow }), [version]);

    return (
        <SyncContext.Provider value={value}>
            {children}
        </SyncContext.Provider>
    );
}

export function useSyncVersion() {
    return useContext(SyncContext).version;
}

export function useSyncActions() {
    return useContext(SyncContext);
}
