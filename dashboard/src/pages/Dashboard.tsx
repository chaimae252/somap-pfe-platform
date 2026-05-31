import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import Layout from "../components/Layout";
import api from "../api/api";

const SOMAP_BLUE = "#1271b8";
const SOMAP_GREEN = "#7EC933";
const TEXT = "#1a2e4a";
const MUTED = "#6b7f95";

type DashboardStats = {
    clients: number;
    demandes: number;
    projets: number;
    services: number;
    notifications?: number;
};

type MonthlyStat = {
    month: string;
    demandes: number;
    projets: number;
};

type StatusStat = {
    name: string;
    value: number;
    color?: string | null;
};

const emptyStats: DashboardStats = {
    clients: 0,
    demandes: 0,
    projets: 0,
    services: 0,
    notifications: 0,
};

const statusColors: Record<string, { color: string; background: string }> = {
    EN_ATTENTE: { color: "#8a5a00", background: "#fff4d6" },
    VALIDEE: { color: "#2f7d32", background: "rgba(126,201,51,0.16)" },
    REJETEE: { color: "#ad2324", background: "rgba(173,35,36,0.12)" },
};

function formatNumber(value?: number) {
    return new Intl.NumberFormat("fr-MA").format(value ?? 0);
}

function formatStatus(status: string) {
    return status
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/^\w/, (letter) => letter.toUpperCase());
}

function getStoredAdminName() {
    const name = localStorage.getItem("userName")?.trim();
    return name || "Admin";
}

function getErrorMessage(error: unknown) {
    if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message?: string }).message === "string"
    ) {
        return (error as { message: string }).message;
    }

    return "Impossible de charger les statistiques.";
}

export default function Dashboard() {
    const [adminName, setAdminName] = useState(getStoredAdminName);
    const [stats, setStats] = useState<DashboardStats>(emptyStats);
    const [monthly, setMonthly] = useState<MonthlyStat[]>([]);
    const [statuses, setStatuses] = useState<StatusStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        setAdminName(getStoredAdminName());

        const loadDashboard = async () => {
            setLoading(true);
            setError("");

            try {
                const [statsResponse, monthlyResponse, statusResponse] = await Promise.all([
                    api.get<DashboardStats>("/dashboard/stats"),
                    api.get<MonthlyStat[]>("/dashboard/monthly"),
                    api.get<StatusStat[]>("/dashboard/status"),
                ]);

                setStats(statsResponse.data ?? emptyStats);
                setMonthly(monthlyResponse.data ?? []);
                setStatuses(statusResponse.data ?? []);
            } catch (err) {
                setStats(emptyStats);
                setMonthly([]);
                setStatuses([]);
                setError(getErrorMessage(err));
            } finally {
                setLoading(false);
            }
        };

        void loadDashboard();
    }, []);

    const maxBarValue = useMemo(() => {
        const values = monthly.flatMap((item) => [item.demandes, item.projets]);
        return Math.max(1, ...values);
    }, [monthly]);

    const validatedDemandes = statuses.find((item) => item.name === "VALIDEE")?.value ?? 0;
    const pendingDemandes = statuses.find((item) => item.name === "EN_ATTENTE")?.value ?? 0;
    const conversionRate = stats.demandes > 0 ? Math.round((validatedDemandes / stats.demandes) * 100) : 0;

    const statCards = [
        {
            label: "Clients",
            value: stats.clients,
            helper: "Comptes enregistres",
            icon: GroupsOutlinedIcon,
            color: SOMAP_GREEN,
        },
        {
            label: "Demandes",
            value: stats.demandes,
            helper: `${formatNumber(pendingDemandes)} en attente`,
            icon: AssignmentOutlinedIcon,
            color: "#f6b718",
        },
        {
            label: "Projets",
            value: stats.projets,
            helper: "Projets dans la base",
            icon: WorkOutlineOutlinedIcon,
            color: SOMAP_BLUE,
        },
        {
            label: "Services",
            value: stats.services,
            helper: "Catalogue actif",
            icon: BuildOutlinedIcon,
            color: "#ad2324",
        },
        {
            label: "Notifications",
            value: stats.notifications ?? 0,
            helper: "Alertes creees",
            icon: NotificationsNoneOutlinedIcon,
            color: "#6f42c1",
        },
    ];

    return (
        <Layout>
            <div style={styles.page}>
                <section style={styles.header}>
                    <div>
                        <span style={styles.eyebrow}>SOMAP & SERVICE</span>
                        <h1 style={styles.title}>Bienvenue, {adminName}</h1>
                        <p style={styles.subtitle}>
                            Vue generale de l'activite clients, demandes, projets et services.
                        </p>
                    </div>

                    <div style={styles.statusPill}>
                        {loading ? "Chargement..." : error ? "Backend indisponible" : "Donnees a jour"}
                    </div>
                </section>

                {error && (
                    <section style={styles.errorBox}>
                        <strong>Le backend ne repond pas.</strong>
                        <span>{error}</span>
                    </section>
                )}

                <section style={styles.statsGrid}>
                    {statCards.map((stat) => {
                        const Icon = stat.icon;

                        return (
                            <div key={stat.label} style={styles.statCard}>
                                <div style={{ ...styles.statIcon, color: stat.color, background: `${stat.color}1f` }}>
                                    <Icon sx={{ fontSize: 24 }} />
                                </div>
                                <div style={styles.statBody}>
                                    <p style={styles.statLabel}>{stat.label}</p>
                                    <strong style={{ ...styles.statValue, color: stat.color }}>
                                        {loading ? "-" : formatNumber(stat.value)}
                                    </strong>
                                    <span style={styles.statHelper}>
                                        <TrendingUpOutlinedIcon sx={{ fontSize: 14 }} />
                                        {stat.helper}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </section>

                <section style={styles.grid}>
                    <div style={styles.panel}>
                        <div style={styles.panelHeader}>
                            <div>
                                <h2 style={styles.panelTitle}>Activite mensuelle</h2>
                                <p style={styles.panelSubtitle}>Demandes et projets par mois</p>
                            </div>
                            <CalendarMonthOutlinedIcon sx={{ color: SOMAP_BLUE }} />
                        </div>

                        <div style={styles.chart}>
                            {monthly.length > 0 ? (
                                monthly.map((item) => (
                                    <div key={item.month} style={styles.barGroup}>
                                        <div style={styles.barTrack}>
                                            <div
                                                title={`${item.demandes} demandes`}
                                                style={{
                                                    ...styles.bar,
                                                    height: `${Math.max(4, (item.demandes / maxBarValue) * 150)}px`,
                                                }}
                                            />
                                            <div
                                                title={`${item.projets} projets`}
                                                style={{
                                                    ...styles.projectBar,
                                                    height: `${Math.max(4, (item.projets / maxBarValue) * 150)}px`,
                                                }}
                                            />
                                        </div>
                                        <strong style={styles.barValue}>{formatNumber(item.demandes)}</strong>
                                        <span style={styles.barLabel}>{item.month}</span>
                                    </div>
                                ))
                            ) : (
                                <div style={styles.emptyState}>Aucune donnee mensuelle disponible.</div>
                            )}
                        </div>

                        <div style={styles.legend}>
                            <span><i style={{ background: SOMAP_BLUE }} />Demandes</span>
                            <span><i style={{ background: SOMAP_GREEN }} />Projets</span>
                        </div>
                    </div>

                    <aside style={styles.sidePanel}>
                        <h2 style={{ ...styles.panelTitle, color: "#fff" }}>Conversion</h2>
                        <p style={{ ...styles.panelSubtitle, color: "rgba(255,255,255,0.72)" }}>
                            Demandes validees sur le total
                        </p>

                        <div style={styles.conversion}>
                            <strong>{loading ? "-" : `${conversionRate}%`}</strong>
                            <span>{formatNumber(validatedDemandes)} demandes validees</span>
                        </div>

                        <div style={styles.progressTrack}>
                            <div style={{ ...styles.progressFill, width: `${conversionRate}%` }} />
                        </div>
                    </aside>
                </section>

                <section style={styles.panel}>
                    <div style={styles.panelHeader}>
                        <div>
                            <h2 style={styles.panelTitle}>Demandes par statut</h2>
                            <p style={styles.panelSubtitle}>Repartition calculee depuis la base de donnees</p>
                        </div>
                    </div>

                    <div style={styles.statusGrid}>
                        {statuses.length > 0 ? (
                            statuses.map((status) => {
                                const tone = statusColors[status.name] ?? {
                                    color: SOMAP_BLUE,
                                    background: "rgba(18,113,184,0.12)",
                                };

                                return (
                                    <div key={status.name} style={styles.statusCard}>
                                        <span style={{ ...styles.statusBadge, ...tone }}>{formatStatus(status.name)}</span>
                                        <strong style={styles.statusValue}>{formatNumber(status.value)}</strong>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={styles.emptyState}>Aucun statut de demande disponible.</div>
                        )}
                    </div>
                </section>
            </div>
        </Layout>
    );
}

const styles: Record<string, CSSProperties> = {
    page: {
        position: "relative",
        zIndex: 1,
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
        color: TEXT,
        fontSize: 34,
        lineHeight: 1.1,
    },
    subtitle: {
        marginTop: 8,
        color: MUTED,
        fontSize: 14,
    },
    statusPill: {
        border: "1px solid rgba(18,113,184,0.18)",
        background: "rgba(255,255,255,0.82)",
        color: SOMAP_BLUE,
        height: 38,
        padding: "0 14px",
        borderRadius: 999,
        fontWeight: 800,
        display: "inline-flex",
        alignItems: "center",
        whiteSpace: "nowrap",
        fontSize: 13,
    },
    errorBox: {
        background: "rgba(173,35,36,0.08)",
        border: "1px solid rgba(173,35,36,0.18)",
        color: "#8f1f20",
        borderRadius: 14,
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        fontSize: 13,
    },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(140px, 1fr))",
        gap: 14,
    },
    statCard: {
        background: "rgba(255,255,255,0.92)",
        border: "1px solid #e5edf5",
        borderRadius: 16,
        padding: 16,
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 10px 28px rgba(13,45,94,0.06)",
    },
    statIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    statBody: {
        minWidth: 0,
    },
    statLabel: {
        margin: 0,
        color: MUTED,
        fontSize: 12,
        fontWeight: 700,
    },
    statValue: {
        display: "block",
        fontSize: 25,
        lineHeight: 1.1,
        marginTop: 3,
    },
    statHelper: {
        marginTop: 5,
        color: "#91a1b2",
        fontSize: 11,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 320px",
        gap: 18,
        alignItems: "stretch",
    },
    panel: {
        background: "rgba(255,255,255,0.92)",
        border: "1px solid #e5edf5",
        borderRadius: 18,
        padding: 18,
        boxShadow: "0 12px 30px rgba(13,45,94,0.07)",
        overflow: "hidden",
    },
    panelHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        marginBottom: 16,
    },
    panelTitle: {
        margin: 0,
        color: TEXT,
        fontSize: 18,
    },
    panelSubtitle: {
        margin: "4px 0 0",
        color: MUTED,
        fontSize: 12,
    },
    chart: {
        minHeight: 220,
        display: "flex",
        alignItems: "flex-end",
        gap: 14,
        paddingTop: 20,
    },
    barGroup: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        minWidth: 34,
    },
    barTrack: {
        height: 160,
        width: "100%",
        maxWidth: 54,
        borderRadius: 12,
        background: "#eef4fb",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: 4,
        overflow: "hidden",
        padding: "0 6px",
    },
    bar: {
        width: "45%",
        borderRadius: "999px 999px 0 0",
        background: SOMAP_BLUE,
    },
    projectBar: {
        width: "45%",
        borderRadius: "999px 999px 0 0",
        background: SOMAP_GREEN,
    },
    barValue: {
        color: TEXT,
        fontSize: 12,
    },
    barLabel: {
        color: MUTED,
        fontSize: 12,
        fontWeight: 700,
    },
    legend: {
        display: "flex",
        gap: 14,
        color: MUTED,
        fontSize: 12,
        fontWeight: 700,
        marginTop: 8,
    },
    sidePanel: {
        background: `linear-gradient(135deg, #0d2d5e, ${SOMAP_BLUE})`,
        color: "#fff",
        borderRadius: 18,
        padding: 20,
        boxShadow: "0 12px 30px rgba(13,45,94,0.16)",
    },
    conversion: {
        marginTop: 24,
        display: "flex",
        flexDirection: "column",
        gap: 8,
    },
    progressTrack: {
        height: 8,
        borderRadius: 999,
        background: "rgba(255,255,255,0.22)",
        marginTop: 22,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        background: SOMAP_GREEN,
        borderRadius: 999,
    },
    statusGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(150px, 1fr))",
        gap: 12,
    },
    statusCard: {
        border: "1px solid #edf2f7",
        borderRadius: 14,
        padding: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    statusBadge: {
        justifySelf: "start",
        borderRadius: 999,
        padding: "6px 10px",
        fontSize: 11,
        fontWeight: 900,
    },
    statusValue: {
        color: TEXT,
        fontSize: 22,
    },
    emptyState: {
        width: "100%",
        padding: "34px 18px",
        color: MUTED,
        textAlign: "center",
        fontSize: 13,
        fontWeight: 700,
    },
};
