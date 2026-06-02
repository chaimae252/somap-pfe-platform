import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import Layout from "../components/Layout";
import api from "../api/api";

const SOMAP_BLUE = "#1271b8";
const SOMAP_GREEN = "#7EC933";
const TEXT = "#1a2e4a";
const MUTED = "#6b7f95";

type NotificationItem = {
    id: number;
    titre: string;
    message: string;
    dateEnvoi?: string;
    lu: boolean;
    type?: string;
    targetType?: string;
    targetId?: number;
};

function formatDate(value?: string) {
    if (!value) return "Date non disponible";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("fr-MA", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function formatType(type?: string) {
    if (!type) return "Systeme";
    return type.toLowerCase().replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
}

export default function Notifications() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadNotifications = async () => {
            setLoading(true);
            setError("");

            try {
                const response = await api.get<NotificationItem[]>("/notifications");
                setNotifications(response.data ?? []);
            } catch {
                setNotifications([]);
                setError("Impossible de charger les notifications.");
            } finally {
                setLoading(false);
            }
        };

        void loadNotifications();
    }, []);

    const unreadCount = useMemo(
        () => notifications.filter((notification) => !notification.lu).length,
        [notifications]
    );

    const markAsRead = async (id: number) => {
        setNotifications((items) =>
            items.map((notification) =>
                notification.id === id ? { ...notification, lu: true } : notification
            )
        );

        try {
            await api.put(`/notifications/${id}/read`);
        } catch {
            setError("Notification marquee localement, mais le backend n'a pas confirme la mise a jour.");
        }
    };

    return (
        <Layout>
            <div style={styles.page}>
                <section style={styles.header}>
                    <div>
                        <span style={styles.eyebrow}>SOMAP & SERVICE</span>
                        <h1 style={styles.title}>Notifications</h1>
                        <p style={styles.subtitle}>Suivi des alertes, messages systeme et mises a jour importantes.</p>
                    </div>

                    <div style={styles.headerBadge}>
                        <NotificationsNoneOutlinedIcon sx={{ fontSize: 18 }} />
                        {loading ? "Chargement..." : `${unreadCount} non lue${unreadCount !== 1 ? "s" : ""}`}
                    </div>
                </section>

                {error && (
                    <section style={styles.errorBox}>
                        <ErrorOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                        <span>{error}</span>
                    </section>
                )}

                <section style={styles.statsGrid}>
                    <div style={styles.statCard}>
                        <div style={{ ...styles.statIcon, color: SOMAP_BLUE, background: "rgba(18,113,184,0.12)" }}>
                            <NotificationsNoneOutlinedIcon sx={{ fontSize: 22 }} />
                        </div>
                        <div>
                            <p style={styles.statLabel}>Total notifications</p>
                            <strong style={styles.statValue}>{loading ? "-" : notifications.length}</strong>
                            <p style={styles.statHelper}>Toutes les alertes</p>
                        </div>
                    </div>

                    <div style={styles.statCard}>
                        <div style={{ ...styles.statIcon, color: SOMAP_GREEN, background: "rgba(126,201,51,0.14)" }}>
                            <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 22 }} />
                        </div>
                        <div>
                            <p style={styles.statLabel}>Lues</p>
                            <strong style={styles.statValue}>{loading ? "-" : notifications.length - unreadCount}</strong>
                            <p style={styles.statHelper}>Deja consultees</p>
                        </div>
                    </div>

                    <div style={styles.statCard}>
                        <div style={{ ...styles.statIcon, color: "#8a5a00", background: "#fff4d6" }}>
                            <NotificationsNoneOutlinedIcon sx={{ fontSize: 22 }} />
                        </div>
                        <div>
                            <p style={styles.statLabel}>Non lues</p>
                            <strong style={styles.statValue}>{loading ? "-" : unreadCount}</strong>
                            <p style={styles.statHelper}>A traiter</p>
                        </div>
                    </div>
                </section>

                <section style={styles.tableCard}>
                    <div style={styles.tableHeader}>
                        <div>
                            <h2 style={styles.sectionTitle}>Liste des notifications</h2>
                            <p style={styles.sectionSubtitle}>
                                {loading ? "Chargement en cours" : `${notifications.length} notification${notifications.length !== 1 ? "s" : ""} au total`}
                            </p>
                        </div>
                        <span style={styles.countBadge}>{unreadCount} non lues</span>
                    </div>

                    <div style={{ ...styles.row, ...styles.headRow }}>
                        <span>Notification</span>
                        <span>Type</span>
                        <span>Date</span>
                        <span>Statut</span>
                    </div>

                    {notifications.length > 0 ? (
                        notifications.map((notification, index) => (
                            <div
                                key={notification.id}
                                style={{
                                    ...styles.row,
                                    ...(index === notifications.length - 1 ? { borderBottom: "none" } : {}),
                                }}
                            >
                                <div style={styles.notificationCell}>
                                    <div style={{ ...styles.dot, background: notification.lu ? "#cbd8e5" : SOMAP_GREEN }} />
                                    <div style={{ minWidth: 0 }}>
                                        <strong style={styles.notificationTitle}>{notification.titre}</strong>
                                        <p style={styles.notificationMessage}>{notification.message}</p>
                                    </div>
                                </div>

                                <span style={styles.typeBadge}>{formatType(notification.type)}</span>
                                <span style={styles.secondaryText}>{formatDate(notification.dateEnvoi)}</span>
                                {notification.lu ? (
                                    <span style={{ ...styles.statusBadge, ...styles.readBadge }}>Lue</span>
                                ) : (
                                    <button style={styles.markButton} onClick={() => void markAsRead(notification.id)}>
                                        Marquer lue
                                    </button>
                                )}
                            </div>
                        ))
                    ) : (
                        <div style={styles.emptyState}>
                            <p style={{ margin: 0, color: MUTED, fontSize: 14 }}>
                                {loading ? "Chargement des notifications..." : "Aucune notification disponible."}
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </Layout>
    );
}

const styles: Record<string, CSSProperties> = {
    page: {
        display: "flex",
        flexDirection: "column",
        gap: 18,
        minWidth: 0,
        paddingBottom: 28,
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 18,
        marginBottom: 4,
    },
    eyebrow: {
        display: "block",
        color: SOMAP_BLUE,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 1.1,
        marginBottom: 6,
    },
    title: {
        margin: 0,
        fontSize: 32,
        lineHeight: 1.1,
        color: TEXT,
    },
    subtitle: {
        marginTop: 6,
        color: MUTED,
        fontSize: 13,
    },
    headerBadge: {
        height: 42,
        borderRadius: 12,
        background: SOMAP_BLUE,
        color: "#fff",
        padding: "0 16px",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
        fontWeight: 700,
        flexShrink: 0,
    },
    errorBox: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(173,35,36,0.08)",
        border: "1px solid rgba(173,35,36,0.18)",
        color: "#8f1f20",
        borderRadius: 14,
        padding: "12px 14px",
        fontSize: 13,
        fontWeight: 700,
    },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(150px, 1fr))",
        gap: 14,
    },
    statCard: {
        background: "#fff",
        border: "1px solid #e5edf5",
        borderRadius: 16,
        padding: 16,
        display: "flex",
        alignItems: "center",
        gap: 12,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    statLabel: { margin: 0, color: MUTED, fontSize: 12, fontWeight: 600 },
    statValue: { display: "block", color: TEXT, fontSize: 22, lineHeight: 1.1, marginTop: 2 },
    statHelper: { margin: "3px 0 0", color: "#91a1b2", fontSize: 11 },
    tableCard: {
        background: "#fff",
        border: "1px solid #e5edf5",
        borderRadius: 18,
        overflow: "hidden",
    },
    tableHeader: {
        padding: "16px 20px",
        borderBottom: "1px solid #edf2f7",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
    },
    sectionTitle: { margin: 0, color: TEXT, fontSize: 16, fontWeight: 600 },
    sectionSubtitle: { margin: "3px 0 0", color: MUTED, fontSize: 12 },
    countBadge: {
        background: "rgba(126,201,51,0.16)",
        color: "#3f8619",
        fontSize: 12,
        fontWeight: 700,
        borderRadius: 999,
        padding: "5px 10px",
    },
    row: {
        display: "grid",
        gridTemplateColumns: "minmax(260px, 1.8fr) minmax(110px, 0.7fr) minmax(160px, 0.9fr) minmax(100px, 0.6fr)",
        gap: 14,
        alignItems: "center",
        padding: "13px 20px",
        borderBottom: "1px solid #edf2f7",
    },
    headRow: {
        background: "#f8fbff",
        color: "#7890a8",
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 0.7,
        paddingTop: 11,
        paddingBottom: 11,
    },
    notificationCell: {
        display: "flex",
        alignItems: "center",
        gap: 11,
        minWidth: 0,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: "50%",
        flexShrink: 0,
    },
    notificationTitle: {
        display: "block",
        color: TEXT,
        fontSize: 13,
        fontWeight: 700,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    notificationMessage: {
        margin: "3px 0 0",
        color: MUTED,
        fontSize: 12,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    secondaryText: {
        color: MUTED,
        fontSize: 12,
        fontWeight: 700,
    },
    typeBadge: {
        justifySelf: "start",
        background: "rgba(18,113,184,0.10)",
        color: SOMAP_BLUE,
        borderRadius: 999,
        padding: "5px 10px",
        fontSize: 11,
        fontWeight: 700,
    },
    statusBadge: {
        justifySelf: "start",
        borderRadius: 999,
        padding: "5px 10px",
        fontSize: 11,
        fontWeight: 700,
    },
    readBadge: {
        color: "#2f7d32",
        background: "rgba(126,201,51,0.15)",
    },
    markButton: {
        justifySelf: "start",
        border: "none",
        background: "rgba(18,113,184,0.10)",
        color: SOMAP_BLUE,
        borderRadius: 999,
        padding: "7px 11px",
        fontSize: 11,
        fontWeight: 800,
        cursor: "pointer",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    emptyState: {
        padding: "48px 20px",
        display: "flex",
        justifyContent: "center",
    },
};
