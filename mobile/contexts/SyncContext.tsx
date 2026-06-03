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

    const refreshNow = () => setVersion((current) => current + 1);

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
