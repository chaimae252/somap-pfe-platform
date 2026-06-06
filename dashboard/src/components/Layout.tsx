import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import SomapBackground from "./SomapBackground";
import api from "../api/api";

const SOMAP_BLUE = "#1271b8";
const SOMAP_GREEN = "#7EC933";
const SOMAP_GOLD = "#f6b718";

interface LayoutProps {
    children: React.ReactNode;
}

type NotificationItem = {
    id: number;
    titre: string;
    message: string;
    lu: boolean;
    type?: string;
};

const toastStyles = `
@keyframes somapSlideIn {
  from {
    transform: translateX(120%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
@keyframes somapFadeOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(120%);
    opacity: 0;
  }
}
.somap-toast-container {
  animation: somapSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.somap-toast-container.fade-out {
  animation: somapFadeOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
`;

export default function Layout({ children }: LayoutProps) {
    const navigate = useNavigate();
    const [toast, setToast] = useState<NotificationItem | null>(null);
    const [isFading, setIsFading] = useState(false);
    const lastNotificationIdRef = useRef<number | null>(null);
    const toastTimeoutRef = useRef<number | null>(null);
    const fadeTimeoutRef = useRef<number | null>(null);

    const triggerToast = (notif: NotificationItem) => {
        if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
        if (fadeTimeoutRef.current) window.clearTimeout(fadeTimeoutRef.current);

        setToast(notif);
        setIsFading(false);

        // Transition out slightly before clearing state
        fadeTimeoutRef.current = window.setTimeout(() => {
            setIsFading(true);
        }, 4600);

        toastTimeoutRef.current = window.setTimeout(() => {
            setToast(null);
        }, 5000);
    };

    useEffect(() => {
        // Inject styles
        const styleTag = document.createElement("style");
        styleTag.innerHTML = toastStyles;
        document.head.appendChild(styleTag);

        const adminId = localStorage.getItem("userId");
        if (!adminId) {
            return () => {
                document.head.removeChild(styleTag);
            };
        }

        let isMounted = true;
        let activeInterval: any = null;

        const fetchNotifications = async () => {
            try {
                const url = `/notifications/client/${adminId}`;
                const response = await api.get<NotificationItem[]>(url);
                return response.data ?? [];
            } catch {
                return [];
            }
        };

        const initializeAndPoll = async () => {
            const list = await fetchNotifications();
            if (!isMounted) return;

            const maxId = list.length > 0 ? Math.max(...list.map((n) => n.id)) : 0;

            const storedLastId = sessionStorage.getItem("lastSeenNotifId");
            if (storedLastId) {
                lastNotificationIdRef.current = Number(storedLastId);
            } else {
                lastNotificationIdRef.current = maxId;
                sessionStorage.setItem("lastSeenNotifId", maxId.toString());
            }

            activeInterval = setInterval(async () => {
                const currentList = await fetchNotifications();
                if (!isMounted) return;

                if (currentList.length > 0) {
                    const newMaxId = Math.max(...currentList.map((n) => n.id));
                    const baseline = lastNotificationIdRef.current ?? 0;

                    if (newMaxId > baseline) {
                        const newNotifs = currentList
                            .filter((n) => n.id > baseline)
                            .sort((a, b) => a.id - b.id);
                        if (newNotifs.length > 0) {
                            triggerToast(newNotifs[newNotifs.length - 1]);
                        }
                        lastNotificationIdRef.current = newMaxId;
                        sessionStorage.setItem("lastSeenNotifId", newMaxId.toString());
                    }
                }
            }, 4000);
        };

        void initializeAndPoll();

        return () => {
            isMounted = false;
            document.head.removeChild(styleTag);
            if (activeInterval) clearInterval(activeInterval);
            if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
            if (fadeTimeoutRef.current) window.clearTimeout(fadeTimeoutRef.current);
        };
    }, []);

    const getToastBorderColor = (type?: string) => {
        if (type === "DEMANDE") return SOMAP_GOLD;
        if (type === "PROJET") return SOMAP_BLUE;
        return SOMAP_GREEN;
    };

    return (
        <SomapBackground showWatermark style={styles.shell}>
            <Navbar />

            <main style={styles.main}>
                {children}
            </main>

            {toast && (
                <div
                    className={`somap-toast-container ${isFading ? "fade-out" : ""}`}
                    onClick={() => {
                        navigate("/notifications");
                        setToast(null);
                    }}
                    style={{
                        ...styles.toast,
                        borderLeftColor: getToastBorderColor(toast.type),
                    }}
                >
                    <div style={styles.toastHeader}>
                        <div style={styles.toastTitleRow}>
                            <span style={{ ...styles.toastIcon, color: getToastBorderColor(toast.type) }}>🔔</span>
                            <strong style={styles.toastTitle}>{toast.titre}</strong>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setToast(null);
                            }}
                            style={styles.toastClose}
                        >
                            ×
                        </button>
                    </div>
                    <p style={styles.toastBody}>{toast.message}</p>
                </div>
            )}
        </SomapBackground>
    );
}

const styles: Record<string, CSSProperties> = {
    shell: {
        display: "flex",
        height: "100dvh",
        minHeight: "100dvh",
        overflow: "hidden",
        alignItems: "stretch",
        justifyContent: "flex-start",
    },
    main: {
        flex: 1,
        minWidth: 0,
        height: "100dvh",
        overflowY: "auto",
        overflowX: "hidden",
        padding: 28,
        position: "relative",
        zIndex: 1,
    },
    toast: {
        position: "fixed",
        top: "24px",
        right: "24px",
        zIndex: 9999,
        width: "350px",
        backgroundColor: "rgba(255, 255, 255, 0.96)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(18, 113, 184, 0.14)",
        borderLeftWidth: "5px",
        borderRadius: "12px",
        boxShadow: "0 12px 32px rgba(10, 24, 44, 0.12)",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        cursor: "pointer",
        transition: "all 0.3s ease",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    toastHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
    },
    toastTitleRow: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    toastIcon: {
        fontSize: "15px",
    },
    toastTitle: {
        fontSize: "13.5px",
        fontWeight: 700,
        color: "#1a2e4a",
    },
    toastClose: {
        border: "none",
        background: "transparent",
        color: "#a0aec0",
        fontSize: "18px",
        cursor: "pointer",
        padding: 0,
        lineHeight: 1,
    },
    toastBody: {
        margin: 0,
        fontSize: "12px",
        color: "#4a5568",
        lineHeight: 1.4,
    },
};
