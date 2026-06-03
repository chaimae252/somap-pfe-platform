import { useCallback, useEffect, useRef, type DependencyList } from "react";
import { useFocusEffect } from "expo-router";
import { useSyncVersion } from "@/contexts/SyncContext";

export function useAutoRefresh(refresh: () => void | Promise<void>, deps: DependencyList = []) {
    const syncVersion = useSyncVersion();
    const focusedRef = useRef(false);
    const refreshRef = useRef(refresh);

    useEffect(() => {
        refreshRef.current = refresh;
    }, [refresh]);

    useFocusEffect(
        useCallback(() => {
            focusedRef.current = true;
            void refreshRef.current();

            return () => {
                focusedRef.current = false;
            };
        }, deps)
    );

    useEffect(() => {
        if (focusedRef.current) {
            void refreshRef.current();
        }
    }, [syncVersion]);
}
