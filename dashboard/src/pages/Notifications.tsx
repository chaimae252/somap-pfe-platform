import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DoneAllOutlinedIcon from "@mui/icons-material/DoneAllOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import Layout from "../components/Layout";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

const SOMAP_BLUE = "#1271b8";
const SOMAP_GREEN = "#7EC933";
const SOMAP_RED = "#ad2324";
const SOMAP_GOLD = "#f6b718";
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

type FilterType = "TOUT" | "NON_LUES" | "DEMANDE" | "PROJET" | "SYSTEME";

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
    if (!type) return "Système";
    return type.toLowerCase().replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
}

export default function Notifications() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<FilterType>("TOUT");
    const [pendingMessagesCount, setPendingMessagesCount] = useState(0);

    const loadNotifications = async () => {
        setLoading(true);
        setError("");
        const adminId = localStorage.getItem("userId");

        try {
            // Load pending contact messages count
            try {
                const countResponse = await api.get<number>("/contact/admin/pending-count");
                setPendingMessagesCount(countResponse.data ?? 0);
            } catch {
                setPendingMessagesCount(0);
            }

            // ✅ Fix: Load notifications specifically for this user to avoid duplications from other admins
            const url = adminId ? `/notifications/client/${adminId}` : "/notifications";
            const response = await api.get<NotificationItem[]>(url);
            
            // ✅ Fix: Sort newest first (by dateEnvoi descending)
            const sorted = (response.data ?? []).sort((a, b) => {
                const dateA = a.dateEnvoi ? new Date(a.dateEnvoi).getTime() : 0;
                const dateB = b.dateEnvoi ? new Date(b.dateEnvoi).getTime() : 0;
                return dateB - dateA;
            });
            setNotifications(sorted);
        } catch {
            setNotifications([]);
            setError("Impossible de charger les notifications.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadNotifications();
    }, []);

    const unreadCount = useMemo(
        () => notifications.filter((n) => !n.lu).length,
        [notifications]
    );

    const markAsRead = async (id: number) => {
        setNotifications((items) =>
            items.map((n) => (n.id === id ? { ...n, lu: true } : n))
        );

        try {
            await api.put(`/notifications/${id}/read`);
        } catch {
            setError("Impossible de marquer la notification comme lue.");
            void loadNotifications();
        }
    };

    const markAllAsRead = async () => {
        const unreadList = notifications.filter((n) => !n.lu);
        if (unreadList.length === 0) return;

        setNotifications((items) => items.map((n) => ({ ...n, lu: true })));

        try {
            await Promise.all(unreadList.map((n) => api.put(`/notifications/${n.id}/read`)));
        } catch {
            setError("Certaines notifications n'ont pas pu être marquées comme lues.");
            void loadNotifications();
        }
    };

    const deleteNotification = async (id: number) => {
        setNotifications((items) => items.filter((n) => n.id !== id));

        try {
            await api.delete(`/notifications/${id}`);
        } catch {
            setError("Impossible de supprimer la notification.");
            void loadNotifications();
        }
    };

    const handleViewDetail = (n: NotificationItem) => {
        if (n.targetType === "DEMANDE" && n.targetId) {
            navigate(`/demandes?id=${n.targetId}`);
        } else if (n.targetType === "PROJET" && n.targetId) {
            navigate(`/projets?id=${n.targetId}`);
        }
    };

    const filteredNotifications = useMemo(() => {
        const q = search.toLowerCase().trim();
        return notifications.filter((n) => {
            const matchSearch =
                !q ||
                n.titre.toLowerCase().includes(q) ||
                n.message.toLowerCase().includes(q) ||
                formatType(n.type).toLowerCase().includes(q);

            const matchFilter =
                filter === "TOUT" ||
                (filter === "NON_LUES" && !n.lu) ||
                (filter === "DEMANDE" && n.type === "DEMANDE") ||
                (filter === "PROJET" && n.type === "PROJET") ||
                (filter === "SYSTEME" && n.type === "SYSTEME");

            return matchSearch && matchFilter;
        });
    }, [notifications, search, filter]);

    const getNotificationIcon = (type?: string) => {
        switch (type) {
            case "DEMANDE":
                return <AssignmentOutlinedIcon sx={{ fontSize: 20 }} />;
            case "PROJET":
                return <WorkOutlineOutlinedIcon sx={{ fontSize: 20 }} />;
            default:
                return <NotificationsNoneOutlinedIcon sx={{ fontSize: 20 }} />;
        }
    };

    const getIconColorStyle = (type?: string, lu?: boolean) => {
        if (lu) {
            return { color: "#7890a8", background: "#f0f4f8" };
        }
        switch (type) {
            case "DEMANDE":
                return { color: SOMAP_GOLD, background: "rgba(246,183,24,0.12)" };
            case "PROJET":
                return { color: SOMAP_BLUE, background: "rgba(18,113,184,0.12)" };
            default:
                return { color: SOMAP_GREEN, background: "rgba(126,201,51,0.14)" };
        }
    };

    return (
        <Layout>
            <div style={styles.page}>
                {/* Header */}
                <section style={styles.header}>
                    <div>
                        <span style={styles.eyebrow}>SOMAP & SERVICE</span>
                        <h1 style={styles.title}>Notifications</h1>
                        <p style={styles.subtitle}>Suivez les alertes, activités récentes et demandes d'assistance.</p>
                    </div>

                    <div style={styles.headerActions}>
                        <button style={styles.contactMessagesButton} onClick={() => navigate("/messages")}>
                            <EmailOutlinedIcon sx={{ fontSize: 18 }} />
                            Messages directs ({pendingMessagesCount})
                        </button>
                        {unreadCount > 0 && (
                            <button style={styles.markAllButton} onClick={() => void markAllAsRead()}>
                                <DoneAllOutlinedIcon sx={{ fontSize: 18 }} />
                                Tout marquer comme lu
                            </button>
                        )}
                        <div style={styles.headerBadge}>
                            <NotificationsNoneOutlinedIcon sx={{ fontSize: 18 }} />
                            {loading ? "..." : `${unreadCount} non lue${unreadCount !== 1 ? "s" : ""}`}
                        </div>
                    </div>
                </section>

                {error && (
                    <section style={styles.errorBox}>
                        <ErrorOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                        <span>{error}</span>
                    </section>
                )}

                {/* Stats row */}
                <section style={styles.statsGrid}>
                    <div style={styles.statCard}>
                        <div style={{ ...styles.statIcon, color: SOMAP_BLUE, background: "rgba(18,113,184,0.10)" }}>
                            <NotificationsNoneOutlinedIcon sx={{ fontSize: 22 }} />
                        </div>
                        <div>
                            <p style={styles.statLabel}>Total notifications</p>
                            <strong style={styles.statValue}>{loading ? "-" : notifications.length}</strong>
                            <p style={styles.statHelper}>Reçues sur votre compte</p>
                        </div>
                    </div>

                    <div style={styles.statCard}>
                        <div style={{ ...styles.statIcon, color: SOMAP_GREEN, background: "rgba(126,201,51,0.10)" }}>
                            <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 22 }} />
                        </div>
                        <div>
                            <p style={styles.statLabel}>Consultées</p>
                            <strong style={styles.statValue}>{loading ? "-" : notifications.length - unreadCount}</strong>
                            <p style={styles.statHelper}>Notifications lues</p>
                        </div>
                    </div>

                    <div style={styles.statCard}>
                        <div style={{ ...styles.statIcon, color: SOMAP_GOLD, background: "rgba(246,183,24,0.10)" }}>
                            <NotificationsNoneOutlinedIcon sx={{ fontSize: 22 }} />
                        </div>
                        <div>
                            <p style={styles.statLabel}>Non lues</p>
                            <strong style={styles.statValue}>{loading ? "-" : unreadCount}</strong>
                            <p style={styles.statHelper}>Nécessitent votre attention</p>
                        </div>
                    </div>
                </section>

                {/* Toolbar (Search & Filter Tabs) */}
                <section style={styles.toolbar}>
                    <div style={styles.searchBox}>
                        <span style={styles.searchIcon}>⌕</span>
                        <input
                            style={styles.searchInput}
                            placeholder="Rechercher une notification..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button style={styles.clearButton} onClick={() => setSearch("")}>×</button>
                        )}
                    </div>

                    <div style={styles.filters}>
                        {(["TOUT", "NON_LUES", "DEMANDE", "PROJET", "SYSTEME"] as FilterType[]).map((f) => (
                            <button
                                key={f}
                                style={{ ...styles.filterButton, ...(filter === f ? styles.filterButtonActive : {}) }}
                                onClick={() => setFilter(f)}
                            >
                                {f === "TOUT" ? "Toutes" : f === "NON_LUES" ? "Non lues" : f === "DEMANDE" ? "Demandes" : f === "PROJET" ? "Projets" : "Système"}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Notification List Container */}
                <section style={styles.listCard}>
                    <div style={styles.listHeader}>
                        <div>
                            <h2 style={styles.sectionTitle}>Boîte de réception</h2>
                            <p style={styles.sectionSubtitle}>
                                {loading
                                    ? "Chargement des notifications..."
                                    : filteredNotifications.length === notifications.length
                                      ? `${notifications.length} notifications enregistrées`
                                      : `${filteredNotifications.length} résultat${filteredNotifications.length !== 1 ? "s" : ""} trouvé${filteredNotifications.length !== 1 ? "s" : ""}`}
                            </p>
                        </div>
                    </div>

                    <div style={styles.cardsContainer}>
                        {loading ? (
                            <div style={styles.loadingState}>Chargement en cours...</div>
                        ) : filteredNotifications.length > 0 ? (
                            filteredNotifications.map((n) => {
                                const iconStyle = getIconColorStyle(n.type, n.lu);
                                return (
                                    <div
                                        key={n.id}
                                        style={{
                                            ...styles.notificationRow,
                                            borderLeft: n.lu ? "4px solid transparent" : `4px solid ${SOMAP_GREEN}`,
                                            background: n.lu ? "#ffffff" : "#f7fcfa"
                                        }}
                                    >
                                        <div style={{ ...styles.iconBadge, ...iconStyle }}>
                                            {getNotificationIcon(n.type)}
                                        </div>

                                        <div style={styles.contentArea}>
                                            <div style={styles.titleRow}>
                                                <strong style={{ ...styles.notifTitle, color: n.lu ? "#4a5568" : TEXT }}>
                                                    {n.titre}
                                                </strong>
                                                <span style={styles.dateLabel}>{formatDate(n.dateEnvoi)}</span>
                                            </div>
                                            <p style={{ ...styles.notifMessage, color: n.lu ? MUTED : "#2d3748" }}>
                                                {n.message}
                                            </p>
                                            
                                            <div style={styles.footerRow}>
                                                <span style={styles.typeLabel}>{formatType(n.type)}</span>
                                                {n.targetType && n.targetId && (
                                                    <button style={styles.inlineLinkButton} onClick={() => handleViewDetail(n)}>
                                                        <VisibilityOutlinedIcon sx={{ fontSize: 13 }} />
                                                        Voir l'élément
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div style={styles.actionsPanel}>
                                            {!n.lu && (
                                                <button
                                                    style={{ ...styles.actionBtn, color: SOMAP_BLUE, background: "rgba(18,113,184,0.06)" }}
                                                    title="Marquer comme lu"
                                                    onClick={() => void markAsRead(n.id)}
                                                >
                                                    <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                                                </button>
                                            )}
                                            <button
                                                style={{ ...styles.actionBtn, color: SOMAP_RED, background: "rgba(173,35,36,0.06)" }}
                                                title="Supprimer"
                                                onClick={() => void deleteNotification(n.id)}
                                            >
                                                <DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={styles.emptyState}>
                                <div style={styles.emptyIcon}>✓</div>
                                <h3>Aucune notification</h3>
                                <p>Votre boîte de réception est complètement à jour !</p>
                            </div>
                        )}
                    </div>
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
        fontFamily: "'Segoe UI', system-ui, sans-serif",
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
        background: "linear-gradient(135deg, #1271b8 0%, #7ec933 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        display: "inline-block",
        fontWeight: 800,
    },
    subtitle: {
        marginTop: 6,
        color: MUTED,
        fontSize: 13,
    },
    headerActions: {
        display: "flex",
        alignItems: "center",
        gap: 12,
    },
    contactMessagesButton: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(246,183,24,0.08)",
        border: "1px solid rgba(246,183,24,0.18)",
        color: SOMAP_GOLD,
        height: 38,
        padding: "0 14px",
        borderRadius: 10,
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer",
        transition: "all 0.2s",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    markAllButton: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(18,113,184,0.08)",
        border: "1px solid rgba(18,113,184,0.18)",
        color: SOMAP_BLUE,
        height: 38,
        padding: "0 14px",
        borderRadius: 10,
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer",
        transition: "all 0.2s",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
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
        gridTemplateColumns: "repeat(3, minmax(180px, 1fr))",
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
        boxShadow: "0 4px 12px rgba(18,113,184,0.02)",
    },
    statIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    statLabel: { margin: 0, color: MUTED, fontSize: 12, fontWeight: 600 },
    statValue: { display: "block", color: TEXT, fontSize: 22, lineHeight: 1.1, marginTop: 2, fontWeight: 800 },
    statHelper: { margin: "3px 0 0", color: "#91a1b2", fontSize: 11, fontWeight: 500 },
    toolbar: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
    },
    searchBox: {
        flex: "1 1 280px",
        height: 44,
        background: "#fff",
        border: "1px solid #dfe9f3",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 14px",
    },
    searchIcon: { color: SOMAP_BLUE, fontSize: 19, fontWeight: 900, flexShrink: 0 },
    searchInput: {
        flex: 1,
        border: "none",
        outline: "none",
        fontSize: 13,
        color: TEXT,
        background: "transparent",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    clearButton: {
        border: "none",
        background: "transparent",
        color: MUTED,
        fontSize: 18,
        cursor: "pointer",
        lineHeight: 1,
    },
    filters: {
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
    },
    filterButton: {
        border: "1px solid #dfe9f3",
        background: "#fff",
        color: MUTED,
        height: 38,
        padding: "0 14px",
        borderRadius: 999,
        fontWeight: 700,
        cursor: "pointer",
        fontSize: 12,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        transition: "all 0.15s ease",
    },
    filterButtonActive: {
        background: "rgba(18,113,184,0.10)",
        color: SOMAP_BLUE,
        borderColor: "rgba(18,113,184,0.22)",
    },
    listCard: {
        background: "#fff",
        border: "1px solid #e5edf5",
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(18,113,184,0.03)",
    },
    listHeader: {
        padding: "16px 20px",
        borderBottom: "1px solid #edf2f7",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    sectionTitle: { margin: 0, color: TEXT, fontSize: 16, fontWeight: 700 },
    sectionSubtitle: { margin: "3px 0 0", color: MUTED, fontSize: 12 },
    cardsContainer: {
        display: "flex",
        flexDirection: "column",
    },
    notificationRow: {
        display: "flex",
        alignItems: "flex-start",
        padding: "18px 20px",
        borderBottom: "1px solid #f0f4f8",
        gap: 14,
        position: "relative",
        transition: "all 0.15s ease",
    },
    iconBadge: {
        width: 38,
        height: 38,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    contentArea: {
        flex: 1,
        minWidth: 0,
    },
    titleRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 12,
    },
    notifTitle: {
        fontSize: 14,
        fontWeight: 700,
        lineHeight: 1.3,
    },
    dateLabel: {
        fontSize: 11,
        color: "#96a6b7",
        fontWeight: 700,
        flexShrink: 0,
    },
    notifMessage: {
        margin: "5px 0 8px",
        fontSize: 12.5,
        lineHeight: 1.45,
    },
    footerRow: {
        display: "flex",
        alignItems: "center",
        gap: 12,
    },
    typeLabel: {
        fontSize: 10,
        fontWeight: 800,
        color: "#7890a8",
        background: "#edf2f7",
        padding: "2px 8px",
        borderRadius: 4,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    inlineLinkButton: {
        border: "none",
        background: "transparent",
        color: SOMAP_BLUE,
        fontSize: 11.5,
        fontWeight: 700,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: 0,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    actionsPanel: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginLeft: 12,
        flexShrink: 0,
    },
    actionBtn: {
        border: "none",
        width: 32,
        height: 32,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.15s",
    },
    loadingState: {
        padding: "48px 20px",
        textAlign: "center",
        color: MUTED,
        fontSize: 14,
    },
    emptyState: {
        padding: "64px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 8,
    },
    emptyIcon: {
        width: 54,
        height: 54,
        borderRadius: "50%",
        background: "rgba(126,201,51,0.12)",
        color: SOMAP_GREEN,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 8,
    },
};
