import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo2.png";
import api from "../api/api";

const SOMAP_BLUE = "#1271b8";
const SOMAP_GREEN = "#7EC933";
const TEXT = "#1a2e4a";
const MUTED = "#6b7f95";

const navItems = [
    { label: "Dashboard", icon: DashboardOutlinedIcon, path: "/dashboard", group: "Principal" },
    { label: "Clients", icon: GroupsOutlinedIcon, path: "/clients", group: "Principal" },
    { label: "Demandes", icon: AssignmentOutlinedIcon, path: "/demandes", group: "Principal", badgeKey: "pendingDemandes" },
    { label: "Notifications", icon: NotificationsNoneOutlinedIcon, path: "/notifications", group: "Principal", badgeKey: "unreadNotifications" },
    { label: "Projets", icon: WorkOutlineOutlinedIcon, path: "/projets", group: "Gestion" },
    { label: "Services", icon: BuildOutlinedIcon, path: "/services", group: "Gestion" },
    { label: "Déconnexion", icon: LogoutOutlinedIcon, path: "/login", group: "Compte", isLogout: true },
];

const groups = ["Principal", "Gestion", "Compte"];

export default function Navbar() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [badges, setBadges] = useState({
        pendingDemandes: 0,
        unreadNotifications: 0,
    });
    const [adminName, setAdminName] = useState(localStorage.getItem("userName")?.trim() || "Admin");
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const adminInitials = adminName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    useEffect(() => {
        const refreshAdminName = () => {
            setAdminName(localStorage.getItem("userName")?.trim() || "Admin");
        };

        window.addEventListener("somap-admin-profile-updated", refreshAdminName);

        const loadBadges = async () => {
            const adminId = localStorage.getItem("userId");

            try {
                const [pendingResponse, unreadResponse] = await Promise.all([
                    api.get<number>("/demandes/pending-count"),
                    adminId ? api.get<number>(`/notifications/unread-count/${adminId}`) : Promise.resolve({ data: 0 }),
                ]);

                setBadges({
                    pendingDemandes: pendingResponse.data ?? 0,
                    unreadNotifications: unreadResponse.data ?? 0,
                });
            } catch {
                setBadges({ pendingDemandes: 0, unreadNotifications: 0 });
            }
        };

        void loadBadges();

        return () => {
            window.removeEventListener("somap-admin-profile-updated", refreshAdminName);
        };
    }, [pathname]);

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = async () => {
        const userId = localStorage.getItem("userId");
        if (userId) {
            try {
                await api.post("/auth/logout", { userId: Number(userId) });
            } catch {
                // Ignore
            }
        }
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userName");
        localStorage.removeItem("userId");
        localStorage.removeItem("userEmail");
        sessionStorage.clear();
        setShowLogoutModal(false);
        navigate("/");
    };

    return (
        <>
            <aside style={styles.sidebar}>
                <div style={styles.logoRow}>
                    <img src={logo} alt="SOMAP & SERVICE" style={styles.logo} />
                </div>

                <nav style={styles.nav}>
                    {groups.map((group) => (
                        <div key={group} style={styles.section}>
                            <span style={styles.sectionLabel}>{group}</span>
                            {navItems
                                .filter((item) => item.group === group)
                                .map((item) => {
                                    const active = pathname === item.path;
                                    const Icon = item.icon;
                                    const badge =
                                        item.badgeKey === "pendingDemandes"
                                            ? badges.pendingDemandes
                                            : item.badgeKey === "unreadNotifications"
                                              ? badges.unreadNotifications
                                              : 0;

                                    return (
                                        <button
                                            key={item.label}
                                            onClick={() =>
                                                item.isLogout
                                                    ? handleLogout()
                                                    : navigate(item.path)
                                            }
                                            style={{
                                                ...styles.navItem,
                                                ...(active ? styles.navItemActive : {}),
                                            }}
                                        >
                                            <span style={styles.navIcon}>
                                                <Icon sx={{ fontSize: 19 }} />
                                            </span>
                                            <span style={styles.navLabel}>{item.label}</span>
                                            {badge > 0 ? (
                                                <span style={styles.badge}>{badge}</span>
                                            ) : active ? (
                                                <span style={styles.activeDot} />
                                            ) : null}
                                        </button>
                                    );
                                })}
                        </div>
                    ))}
                </nav>

                <div style={styles.footer}>
                    <div style={styles.userRow} onClick={() => navigate("/profile")}>
                        <div style={styles.avatar}>{adminInitials || "AD"}</div>
                        <div style={styles.userInfo}>
                            <span style={styles.userName}>{adminName}</span>
                            <span style={styles.userRole}>Administrateur</span>
                        </div>
                        <span style={styles.chevron}>›</span>
                    </div>
                </div>
            </aside>

            {showLogoutModal && (
                <div style={styles.modalOverlay} onClick={() => setShowLogoutModal(false)}>
                    <section style={styles.confirmCard} onClick={(event) => event.stopPropagation()}>
                        <h2 style={styles.confirmTitle}>Se déconnecter ?</h2>
                        <p style={styles.confirmText}>
                            Voulez-vous vraiment vous déconnecter de la plateforme SOMAP ?
                        </p>
                        <div style={styles.confirmActions}>
                            <button
                                style={styles.cancelButton}
                                onClick={() => setShowLogoutModal(false)}
                            >
                                Annuler
                            </button>
                            <button
                                style={styles.confirmLogoutButton}
                                onClick={confirmLogout}
                            >
                                Se déconnecter
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}

const styles: Record<string, CSSProperties> = {
    sidebar: {
        width: "220px",
        height: "100dvh",
        position: "sticky",
        top: 0,
        backgroundColor: "#ffffff",
        borderRight: "1px solid rgba(0,0,0,0.07)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        boxShadow: "2px 0 12px rgba(18,113,184,0.06)",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        overflow: "hidden",
    },
    logoRow: {
        padding: "24px 8px 12px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },

    logo: {
        width: "100%",
        maxWidth: "160px",
        height: "auto",
        maxHeight: "105px",
        objectFit: "contain",
        filter: "drop-shadow(0 1px 4px rgba(18,113,184,0.06))",
    },
    nav: { flex: 1, overflowY: "hidden", padding: "8px 0" },
    section: { padding: "10px 10px 4px" },
    sectionLabel: {
        display: "block",
        fontSize: 10,
        letterSpacing: "1px",
        textTransform: "uppercase",
        color: "#b0bec8",
        padding: "0 8px",
        marginBottom: 4,
    },
    navItem: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "9px 10px",
        borderRadius: 10,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontSize: 13.5,
        fontWeight: 500,
        color: "#5a6e82",
        marginBottom: 2,
        textAlign: "left",
        transition: "background 0.15s, color 0.15s",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    navItemActive: {
        background: "rgba(18,113,184,0.09)",
        color: SOMAP_BLUE,
        fontWeight: 600,
    },
    navIcon: {
        width: 24,
        height: 24,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: "currentColor",
    },
    navLabel: { flex: 1 },
    badge: {
        marginLeft: "auto",
        background: SOMAP_GREEN,
        color: "#fff",
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 6px",
        borderRadius: 20,
        lineHeight: 1.4,
    },
    activeDot: {
        marginLeft: "auto",
        width: 6,
        height: 6,
        borderRadius: "50%",
        backgroundColor: SOMAP_GREEN,
        flexShrink: 0,
    },
    footer: {
        borderTop: "1px solid rgba(0,0,0,0.06)",
        padding: "8px 10px 10px",
        flexShrink: 0,
    },
    userRow: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        borderRadius: 10,
        cursor: "pointer",
        transform: "translateY(3px)",
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${SOMAP_BLUE}, ${SOMAP_GREEN})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 700,
        color: "#fff",
        flexShrink: 0,
    },
    userInfo: { display: "flex", flexDirection: "column", lineHeight: 1.2, flex: 1 },
    userName: { fontSize: 12, fontWeight: 600, color: "#1a2e4a" },
    userRole: { fontSize: 10, color: "#9aabb8" },
    chevron: { color: "#b0bec8", fontSize: 18, lineHeight: 1 },
    modalOverlay: {
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(10,24,44,0.42)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    confirmCard: {
        width: "min(420px, 100%)",
        background: "#fff",
        border: "1px solid #dfe9f3",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 24px 70px rgba(13,45,94,0.22)",
    },
    confirmTitle: { margin: 0, color: TEXT, fontSize: 18, fontWeight: 700 },
    confirmText: { margin: "10px 0 0", color: MUTED, fontSize: 13.5, lineHeight: 1.5 },
    confirmActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 18,
    },
    cancelButton: {
        border: "1px solid #dfe9f3",
        background: "#fff",
        color: MUTED,
        height: 36,
        padding: "0 14px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    confirmLogoutButton: {
        border: "none",
        background: "#ad2324",
        color: "#fff",
        height: 36,
        padding: "0 14px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 800,
        cursor: "pointer",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
};
