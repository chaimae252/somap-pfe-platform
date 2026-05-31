import type { CSSProperties } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo2.png";

const SOMAP_BLUE = "#1271b8";
const SOMAP_GREEN = "#7EC933";

const navItems = [
    { label: "Dashboard", icon: "📊", path: "/dashboard", group: "Principal" },
    { label: "Clients", icon: "👥", path: "/clients", group: "Principal" },
    { label: "Demandes", icon: "📋", path: "/demandes", group: "Principal", badge: 4 },
    { label: "Projets", icon: "💼", path: "/projets", group: "Gestion" },
    { label: "Services", icon: "🔧", path: "/services", group: "Gestion" },

    { label: "Déconnexion", icon: "🚪", path: "/login", group: "Compte" },
];

const groups = ["Principal", "Gestion", "Compte"];

export default function Navbar() {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const handleLogout = () => {
        localStorage.removeItem("token");
        sessionStorage.clear();

        navigate("/login");
    };

    return (
        <aside style={styles.sidebar}>
            {/* Logo */}
            <div style={styles.logoRow}>
                <img src={logo} alt="SOMAP & SERVICE" style={styles.logo} />
            </div>

            {/* Nav groups */}
            <nav style={styles.nav}>
                {groups.map((group) => (
                    <div key={group} style={styles.section}>
                        <span style={styles.sectionLabel}>{group}</span>
                        {navItems
                            .filter((item) => item.group === group)
                            .map((item) => {
                                const active = pathname === item.path;
                                return (
                                    <button
                                        key={item.label}
                                        onClick={() =>
                                            item.label === "Déconnexion"
                                                ? handleLogout()
                                                : navigate(item.path)
                                        }
                                        style={{
                                            ...styles.navItem,
                                            ...(pathname === item.path ? styles.navItemActive : {}),
                                        }}
                                    >
                                        <span style={styles.navIcon}>{item.icon}</span>
                                        <span style={styles.navLabel}>{item.label}</span>
                                        {item.badge ? (
                                            <span style={styles.badge}>{item.badge}</span>
                                        ) : active ? (
                                            <span style={styles.activeDot} />
                                        ) : null}
                                    </button>
                                );
                            })}
                    </div>
                ))}
            </nav>

            {/* Footer user row */}
            <div style={styles.footer}>
                <div style={styles.userRow} onClick={() => navigate("/profile")}>
                    <div style={styles.avatar}>AD</div>
                    <div style={styles.userInfo}>
                        <span style={styles.userName}>Admin</span>
                        <span style={styles.userRole}>Administrateur</span>
                    </div>
                    <span style={styles.chevron}>›</span>
                </div>
            </div>
        </aside>
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
        padding: "14px 16px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    logo: {
        width: "100%",
        maxWidth: 170,
        height: 52,
        objectFit: "contain",
        filter: "drop-shadow(0 1px 4px rgba(18,113,184,0.10))",
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
        textAlign: "left" as const,
        transition: "background 0.15s, color 0.15s",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    navItemActive: {
        background: "rgba(18,113,184,0.09)",
        color: SOMAP_BLUE,
        fontWeight: 600,
    },
    navIcon: { fontSize: 16, flexShrink: 0 },
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
        padding: "12px 10px",
        flexShrink: 0,
    },
    userRow: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        borderRadius: 10,
        cursor: "pointer",
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
};
