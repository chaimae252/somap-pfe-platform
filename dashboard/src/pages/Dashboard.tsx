import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import HourglassTopOutlinedIcon from "@mui/icons-material/HourglassTopOutlined";
import Layout from "../components/Layout";
import api from "../api/api";

const SOMAP_BLUE = "#1271b8";
const SOMAP_GREEN = "#7EC933";
const SOMAP_RED = "#ad2324";
const SOMAP_GOLD = "#f6b718";
const TEXT = "#19324f";
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

type Tone = {
    color: string;
    background: string;
    border: string;
};

const emptyStats: DashboardStats = {
    clients: 0,
    demandes: 0,
    projets: 0,
    services: 0,
    notifications: 0,
};

const statusTones: Record<string, Tone> = {
    EN_ATTENTE: { color: "#8a5a00", background: "#fff7df", border: "rgba(246,183,24,0.28)" },
    VALIDEE: { color: "#2f7d32", background: "rgba(126,201,51,0.14)", border: "rgba(126,201,51,0.26)" },
    REJETEE: { color: SOMAP_RED, background: "rgba(173,35,36,0.09)", border: "rgba(173,35,36,0.18)" },
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

function percent(part: number, total: number) {
    if (total <= 0) return 0;
    return Math.round((part / total) * 100);
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

export default function Dashboard() {
    const [adminName, setAdminName] = useState(getStoredAdminName);
    const [stats, setStats] = useState<DashboardStats>(emptyStats);
    const [monthly, setMonthly] = useState<MonthlyStat[]>([]);
    const [statuses, setStatuses] = useState<StatusStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

    useEffect(() => {
        setAdminName(getStoredAdminName());
        let isMounted = true;

        const loadDashboard = async (isInitial = true) => {
            if (isInitial) setLoading(true);
            setError("");

            try {
                const [statsResponse, monthlyResponse, statusResponse] = await Promise.all([
                    api.get<DashboardStats>("/dashboard/stats"),
                    api.get<MonthlyStat[]>("/dashboard/monthly"),
                    api.get<StatusStat[]>("/dashboard/status"),
                ]);

                if (!isMounted) return;

                setStats(statsResponse.data ?? emptyStats);
                setMonthly(monthlyResponse.data ?? []);
                setStatuses(statusResponse.data ?? []);
            } catch (err) {
                if (!isMounted) return;
                if (isInitial) {
                    setStats(emptyStats);
                    setMonthly([]);
                    setStatuses([]);
                    setError(getErrorMessage(err));
                }
            } finally {
                if (isMounted && isInitial) setLoading(false);
            }
        };

        void loadDashboard(true);

        const interval = setInterval(() => {
            void loadDashboard(false);
        }, 10000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const dashboardModel = useMemo(() => {
        const validatedDemandes = statuses.find((item) => item.name === "VALIDEE")?.value ?? 0;
        const pendingDemandes = statuses.find((item) => item.name === "EN_ATTENTE")?.value ?? 0;
        const rejectedDemandes = statuses.find((item) => item.name === "REJETEE")?.value ?? 0;
        const totalStatusDemandes = statuses.reduce((sum, item) => sum + item.value, 0);
        const conversionRate = percent(validatedDemandes, stats.demandes);
        const pendingRate = percent(pendingDemandes, stats.demandes);
        const rejectionRate = percent(rejectedDemandes, stats.demandes);
        const workloadTotal = stats.demandes + stats.projets;
        const projectShare = percent(stats.projets, workloadTotal);
        const demandeShare = percent(stats.demandes, workloadTotal);
        const serviceCoverage = percent(stats.services, Math.max(1, stats.clients));
        const healthScore = clamp(Math.round(conversionRate - rejectionRate + Math.min(20, stats.services * 2)), 0, 100);
        const maxBarValue = Math.max(1, ...monthly.flatMap((item) => [item.demandes, item.projets]));
        const peakMonth = monthly.reduce<MonthlyStat | null>((peak, item) => {
            if (!peak) return item;
            return item.demandes + item.projets > peak.demandes + peak.projets ? item : peak;
        }, null);

        return {
            validatedDemandes,
            pendingDemandes,
            rejectedDemandes,
            totalStatusDemandes,
            conversionRate,
            pendingRate,
            rejectionRate,
            workloadTotal,
            projectShare,
            demandeShare,
            serviceCoverage,
            healthScore,
            maxBarValue,
            peakMonth,
        };
    }, [monthly, stats, statuses]);

    const statCards = [
        {
            label: "Clients",
            value: stats.clients,
            helper: "Comptes actifs",
            icon: GroupsOutlinedIcon,
            color: SOMAP_GREEN,
        },
        {
            label: "Demandes",
            value: stats.demandes,
            helper: `${formatNumber(dashboardModel.pendingDemandes)} en attente`,
            icon: AssignmentOutlinedIcon,
            color: SOMAP_GOLD,
        },
        {
            label: "Projets",
            value: stats.projets,
            helper: "Projets enregistres",
            icon: WorkOutlineOutlinedIcon,
            color: SOMAP_BLUE,
        },
        {
            label: "Services",
            value: stats.services,
            helper: "Catalogue operationnel",
            icon: BuildOutlinedIcon,
            color: SOMAP_RED,
        },
    ];

    const analysisRows = [
        {
            label: "Conversion",
            value: `${dashboardModel.conversionRate}%`,
            helper: `${formatNumber(dashboardModel.validatedDemandes)} demandes validées`,
            color: SOMAP_GREEN,
            icon: CheckCircleOutlineOutlinedIcon,
        },
        {
            label: "En attente",
            value: `${dashboardModel.pendingRate}%`,
            helper: `${formatNumber(dashboardModel.pendingDemandes)} demandes à traiter`,
            color: SOMAP_GOLD,
            icon: HourglassTopOutlinedIcon,
        },
        {
            label: "Rejets",
            value: `${dashboardModel.rejectionRate}%`,
            helper: `${formatNumber(dashboardModel.rejectedDemandes)} demandes rejetées`,
            color: SOMAP_RED,
            icon: ErrorOutlineOutlinedIcon,
        },
    ];

    return (
        <Layout>
            <div style={styles.page}>
                <section style={styles.hero}>
                    <div style={styles.heroContent}>
                        <span style={styles.eyebrow}>SOMAP & SERVICE</span>
                        <h1 style={styles.title}>Bienvenue, {adminName}</h1>
                        <p style={styles.subtitle}>
                            Supervision en temps reel des clients, demandes, projets et services.
                        </p>
                        <div style={styles.heroMeta}>
                            <span>{formatNumber(dashboardModel.workloadTotal)} éléments suivis</span>
                            <span>{dashboardModel.peakMonth ? `${dashboardModel.peakMonth.month} est le mois le plus actif` : "Analyse mensuelle"}</span>
                        </div>
                    </div>

                    <div style={styles.heroPanel}>
                        <span style={styles.heroPanelLabel}>Score d'activité</span>
                        <strong style={styles.heroScore}>{loading ? "-" : dashboardModel.healthScore}</strong>
                        <div style={styles.heroProgress}>
                            <span style={{ ...styles.heroProgressFill, width: `${dashboardModel.healthScore}%` }} />
                        </div>
                        <p style={styles.heroPanelText}>
                            {error ? "Backend indisponible" : loading ? "Chargement des données..." : "Données synchronisées"}
                        </p>
                    </div>
                </section>

                {error && (
                    <section style={styles.errorBox}>
                        <strong>Le backend ne répond pas.</strong>
                        <span>{error}</span>
                    </section>
                )}

                <section style={styles.statsGrid}>
                    {statCards.map((stat) => {
                        const Icon = stat.icon;

                        return (
                            <article key={stat.label} style={styles.statCard}>
                                <div style={{ ...styles.statIcon, color: stat.color, background: `${stat.color}18` }}>
                                    <Icon sx={{ fontSize: 22 }} />
                                </div>
                                <div style={styles.statContent}>
                                    <p style={styles.statLabel}>{stat.label}</p>
                                    <strong style={styles.statValue}>{loading ? "-" : formatNumber(stat.value)}</strong>
                                    <span style={styles.statHelper}>{stat.helper}</span>
                                </div>
                            </article>
                        );
                    })}
                </section>

                <section style={styles.contentGrid}>
                    <div style={styles.leftStack}>
                        <div style={styles.panel}>
                            <div style={styles.panelHeader}>
                                <div>
                                    <span style={styles.panelKicker}>Analyse</span>
                                    <h2 style={styles.panelTitle}>Activité mensuelle</h2>
                                    <p style={styles.panelSubtitle}>Comparaison des demandes et projets par mois</p>
                                </div>
                                <div style={styles.headerIcon}>
                                    <CalendarMonthOutlinedIcon sx={{ fontSize: 22 }} />
                                </div>
                            </div>

                            <div style={styles.chartKeymap}>
                                <span><i style={{ ...styles.legendDot, background: SOMAP_BLUE }} />Demandes</span>
                                <span><i style={{ ...styles.legendDot, background: SOMAP_GREEN }} />Projets</span>
                            </div>

                            <div style={styles.chart}>
                                {monthly.length > 0 ? (
                                    monthly.map((item) => {
                                        const active = hoveredMonth === item.month;

                                        return (
                                        <div
                                            key={item.month}
                                            style={styles.barGroup}
                                            onMouseEnter={() => setHoveredMonth(item.month)}
                                            onMouseLeave={() => setHoveredMonth(null)}
                                            onFocus={() => setHoveredMonth(item.month)}
                                            onBlur={() => setHoveredMonth(null)}
                                            tabIndex={0}
                                        >
                                            {active && (
                                                <>
                                                    <span style={styles.hoverGuide} />
                                                    <div style={styles.chartTooltip}>
                                                        <strong>{item.month}</strong>
                                                        <span><i style={{ ...styles.legendDot, background: SOMAP_BLUE }} />{formatNumber(item.demandes)} demandes</span>
                                                        <span><i style={{ ...styles.legendDot, background: SOMAP_GREEN }} />{formatNumber(item.projets)} projets</span>
                                                        <em>{formatNumber(item.demandes + item.projets)} au total</em>
                                                    </div>
                                                </>
                                            )}
                                            <div style={styles.barTrack}>
                                                <div
                                                    style={{
                                                        ...styles.bar,
                                                        ...(active ? styles.activeBar : {}),
                                                        height: `${Math.max(6, (item.demandes / dashboardModel.maxBarValue) * 170)}px`,
                                                    }}
                                                />
                                                <div
                                                    style={{
                                                        ...styles.projectBar,
                                                        ...(active ? styles.activeBar : {}),
                                                        height: `${Math.max(6, (item.projets / dashboardModel.maxBarValue) * 170)}px`,
                                                    }}
                                                />
                                            </div>
                                            <strong style={{ ...styles.barValue, ...(active ? styles.activeBarValue : {}) }}>
                                                {formatNumber(item.demandes + item.projets)}
                                            </strong>
                                            <span style={{ ...styles.barLabel, ...(active ? styles.activeBarLabel : {}) }}>{item.month}</span>
                                        </div>
                                        );
                                    })
                                ) : (
                                    <div style={styles.emptyState}>Aucune donnée mensuelle disponible.</div>
                                )}
                            </div>

                            <div style={styles.legend}>
                                <strong>{dashboardModel.peakMonth ? `${dashboardModel.peakMonth.month}: pic d'activité` : "Pic non disponible"}</strong>
                            </div>
                        </div>

                        <div style={styles.panel}>
                            <div style={styles.panelHeader}>
                                <div>
                                    <span style={styles.panelKicker}>Statuts</span>
                                    <h2 style={styles.panelTitle}>Demandes par statut</h2>
                                    <p style={styles.panelSubtitle}>Répartition calculée depuis la base de données</p>
                                </div>
                            </div>

                            <div style={styles.statusList}>
                                {statuses.length > 0 ? (
                                    statuses.map((status) => {
                                        const tone = statusTones[status.name] ?? {
                                            color: SOMAP_BLUE,
                                            background: "rgba(18,113,184,0.10)",
                                            border: "rgba(18,113,184,0.18)",
                                        };
                                        const valueRate = percent(status.value, dashboardModel.totalStatusDemandes);

                                        return (
                                            <div key={status.name} style={styles.statusRow}>
                                                <div style={styles.statusNameWrap}>
                                                    <span style={{ ...styles.statusDot, background: tone.color }} />
                                                    <strong style={styles.statusName}>{formatStatus(status.name)}</strong>
                                                </div>
                                                <div style={styles.statusBarTrack}>
                                                    <span style={{ ...styles.statusBarFill, width: `${valueRate}%`, background: tone.color }} />
                                                </div>
                                                <span style={{ ...styles.statusBadge, color: tone.color, background: tone.background, borderColor: tone.border }}>
                                                    {formatNumber(status.value)}
                                                </span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div style={styles.emptyState}>Aucun statut de demande disponible.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <aside style={styles.sideStack}>
                        <div style={styles.analysisPanel}>
                            <div style={styles.panelHeader}>
                                <div>
                                    <span style={styles.panelKicker}>Decision</span>
                                    <h2 style={styles.panelTitle}>Synthese</h2>
                                    <p style={styles.panelSubtitle}>
                                        Lecture rapide du portefeuille
                                    </p>
                                </div>
                                <div style={styles.headerIcon}>
                                    <AnalyticsOutlinedIcon sx={{ fontSize: 22 }} />
                                </div>
                            </div>

                            <div style={styles.donutWrap}>
                                <div
                                    style={{
                                        ...styles.donut,
                                        background: `conic-gradient(${SOMAP_GREEN} 0 ${dashboardModel.conversionRate}%, #eef4fb ${dashboardModel.conversionRate}% 100%)`,
                                    }}
                                >
                                    <span>{loading ? "-" : `${dashboardModel.conversionRate}%`}</span>
                                </div>
                                <div>
                                    <strong style={styles.donutTitle}>Demandes validées</strong>
                                    <p style={styles.donutText}>
                                        {formatNumber(dashboardModel.validatedDemandes)} sur {formatNumber(stats.demandes)} demandes
                                    </p>
                                </div>
                            </div>

                            <div style={styles.analysisList}>
                                {analysisRows.map((row) => {
                                    const Icon = row.icon;

                                    return (
                                        <div key={row.label} style={styles.analysisRow}>
                                            <div style={{ ...styles.analysisIcon, color: row.color }}>
                                                <Icon sx={{ fontSize: 20 }} />
                                            </div>
                                            <div style={styles.analysisText}>
                                                <strong>{row.label}</strong>
                                                <span>{row.helper}</span>
                                            </div>
                                            <strong style={{ color: row.color }}>{loading ? "-" : row.value}</strong>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={styles.panel}>
                            <div style={styles.panelHeader}>
                                <div>
                                    <span style={styles.panelKicker}>Charge</span>
                                    <h2 style={styles.panelTitle}>Volume de travail</h2>
                                    <p style={styles.panelSubtitle}>Equilibre entre demandes et projets</p>
                                </div>
                            </div>

                            <div style={styles.workload}>
                                <div style={styles.workloadSplit}>
                                    <span style={{ ...styles.workloadFill, width: `${dashboardModel.demandeShare}%`, background: SOMAP_BLUE }} />
                                    <span style={{ ...styles.workloadFill, width: `${dashboardModel.projectShare}%`, background: SOMAP_GREEN }} />
                                </div>
                                <div style={styles.workloadRows}>
                                    <div style={{
                                        background: "rgba(18, 113, 184, 0.04)",
                                        border: "1px solid rgba(18, 113, 184, 0.12)",
                                        borderRadius: 12,
                                        padding: "10px 12px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 4
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: SOMAP_BLUE, display: "inline-block" }} />
                                            <span style={{ ...styles.workloadLabel, color: SOMAP_BLUE, marginBottom: 0, fontSize: 11 }}>Demandes</span>
                                        </div>
                                        <strong style={{ fontSize: 18, color: SOMAP_BLUE }}>{formatNumber(stats.demandes)}</strong>
                                    </div>
                                    <div style={{
                                        background: "rgba(126, 201, 51, 0.04)",
                                        border: "1px solid rgba(126, 201, 51, 0.12)",
                                        borderRadius: 12,
                                        padding: "10px 12px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 4
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: SOMAP_GREEN, display: "inline-block" }} />
                                            <span style={{ ...styles.workloadLabel, color: SOMAP_GREEN, marginBottom: 0, fontSize: 11 }}>Projets</span>
                                        </div>
                                        <strong style={{ fontSize: 18, color: SOMAP_GREEN }}>{formatNumber(stats.projets)}</strong>
                                    </div>
                                    <div style={{
                                        background: "rgba(107, 127, 149, 0.04)",
                                        border: "1px solid rgba(107, 127, 149, 0.12)",
                                        borderRadius: 12,
                                        padding: "10px 12px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 4
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#a0aec0", display: "inline-block" }} />
                                            <span style={{ ...styles.workloadLabel, color: MUTED, marginBottom: 0, fontSize: 11 }}>Total</span>
                                        </div>
                                        <strong style={{ fontSize: 18, color: TEXT }}>{formatNumber(dashboardModel.workloadTotal)}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </aside>
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
    hero: {
        marginBottom: 4,
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 270px",
        gap: 18,
        alignItems: "center",
    },
    heroContent: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minWidth: 0,
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
        background: "linear-gradient(135deg, #1271b8 0%, #7ec933 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        display: "inline-block",
        fontSize: 32,
        lineHeight: 1.1,
        fontWeight: 800,
    },
    subtitle: {
        margin: "6px 0 0",
        color: MUTED,
        fontSize: 13,
        maxWidth: 560,
    },
    heroMeta: {
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        marginTop: 14,
        color: "#8b9aad",
        fontSize: 12,
        fontWeight: 700,
    },
    heroPanel: {
        border: "1px solid #e5edf5",
        borderRadius: 16,
        background: "#fff",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        boxShadow: "0 10px 28px rgba(13,45,94,0.06)",
    },
    heroPanelLabel: {
        color: MUTED,
        fontSize: 12,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 0.7,
    },
    heroScore: {
        color: SOMAP_BLUE,
        fontSize: 34,
        lineHeight: 1,
        marginTop: 8,
    },
    heroProgress: {
        height: 8,
        borderRadius: 999,
        background: "#eef4fb",
        marginTop: 12,
        overflow: "hidden",
    },
    heroProgressFill: {
        display: "block",
        height: "100%",
        borderRadius: 999,
        background: SOMAP_GREEN,
    },
    heroPanelText: {
        margin: "10px 0 0",
        color: "#8b9aad",
        fontSize: 12,
        fontWeight: 700,
    },
    errorBox: {
        background: "rgba(173,35,36,0.08)",
        border: "1px solid rgba(173,35,36,0.18)",
        color: "#8f1f20",
        borderRadius: 8,
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        fontSize: 13,
    },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(140px, 1fr))",
        gap: 14,
    },
    statCard: {
        background: "#fff",
        border: "1px solid #e5edf5",
        borderRadius: 16,
        padding: 16,
        minHeight: 116,
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
    statContent: {
        flex: 1,
        minWidth: 0,
    },
    statMetric: {
        fontSize: 11,
        fontWeight: 900,
        textAlign: "right",
        lineHeight: 1.35,
        maxWidth: 86,
        flexShrink: 0,
    },
    statLabel: {
        margin: 0,
        color: MUTED,
        fontSize: 12,
        fontWeight: 600,
    },
    statValue: {
        color: TEXT,
        fontSize: 24,
        lineHeight: 1.1,
        marginTop: 4,
    },
    statHelper: {
        color: "#8fa0b2",
        fontSize: 12,
        fontWeight: 700,
        display: "block",
        marginTop: 4,
    },
    contentGrid: {
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 360px",
        gap: 18,
        alignItems: "start",
    },
    leftStack: {
        display: "flex",
        flexDirection: "column",
        gap: 18,
        minWidth: 0,
    },
    sideStack: {
        display: "flex",
        flexDirection: "column",
        gap: 18,
    },
    panel: {
        background: "#fff",
        border: "1px solid #e5edf5",
        borderRadius: 18,
        padding: 18,
        overflow: "hidden",
    },
    panelHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        marginBottom: 16,
    },
    panelKicker: {
        display: "block",
        color: SOMAP_BLUE,
        fontSize: 10,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 5,
    },
    panelTitle: {
        margin: 0,
        color: TEXT,
        fontSize: 18,
        lineHeight: 1.2,
    },
    panelSubtitle: {
        margin: "5px 0 0",
        color: MUTED,
        fontSize: 12,
    },
    headerIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        background: "rgba(18,113,184,0.10)",
        color: SOMAP_BLUE,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    chart: {
        minHeight: 226,
        display: "flex",
        alignItems: "flex-end",
        gap: 13,
        paddingTop: 12,
    },
    barGroup: {
        position: "relative",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 7,
        minWidth: 32,
        outline: "none",
    },
    barTrack: {
        height: 180,
        width: "100%",
        maxWidth: 58,
        borderRadius: 12,
        background: "linear-gradient(180deg, #f3f7fb, #edf3f8)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: 4,
        overflow: "hidden",
        padding: "0 7px",
        border: "1px solid #e6eef6",
    },
    bar: {
        width: "45%",
        borderRadius: "6px 6px 0 0",
        background: `linear-gradient(180deg, ${SOMAP_BLUE}, #0d5d98)`,
        transition: "height 0.18s ease, filter 0.18s ease, transform 0.18s ease",
    },
    projectBar: {
        width: "45%",
        borderRadius: "6px 6px 0 0",
        background: `linear-gradient(180deg, ${SOMAP_GREEN}, #5ba820)`,
        transition: "height 0.18s ease, filter 0.18s ease, transform 0.18s ease",
    },
    activeBar: {
        filter: "saturate(1.12)",
        transform: "translateY(-2px)",
    },
    hoverGuide: {
        position: "absolute",
        top: -12,
        bottom: 42,
        left: "50%",
        width: 1,
        transform: "translateX(-50%)",
        background: "linear-gradient(180deg, rgba(18,113,184,0), rgba(18,113,184,0.28), rgba(18,113,184,0))",
        pointerEvents: "none",
        zIndex: 1,
    },
    chartTooltip: {
        position: "absolute",
        bottom: "calc(100% - 8px)",
        left: "50%",
        transform: "translateX(-50%)",
        minWidth: 150,
        padding: "10px 12px",
        borderRadius: 12,
        background: "#fff",
        border: "1px solid #dfe9f3",
        boxShadow: "0 14px 30px rgba(13,45,94,0.16)",
        color: TEXT,
        display: "flex",
        flexDirection: "column",
        gap: 5,
        fontSize: 12,
        fontWeight: 700,
        zIndex: 3,
        pointerEvents: "none",
    },
    activeBarValue: {
        color: SOMAP_BLUE,
    },
    activeBarLabel: {
        color: TEXT,
    },
    barValue: {
        color: TEXT,
        fontSize: 12,
    },
    barLabel: {
        color: MUTED,
        fontSize: 12,
        fontWeight: 800,
    },
    legend: {
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 14,
        color: MUTED,
        fontSize: 12,
        fontWeight: 800,
        marginTop: 12,
    },
    chartKeymap: {
        display: "flex",
        alignItems: "center",
        gap: 14,
        color: MUTED,
        fontSize: 12,
        fontWeight: 800,
        padding: "8px 0 2px",
    },
    legendDot: {
        display: "inline-block",
        width: 9,
        height: 9,
        borderRadius: "50%",
        marginRight: 7,
        verticalAlign: "middle",
    },
    analysisPanel: {
        background: "#fff",
        border: "1px solid #e5edf5",
        borderRadius: 18,
        padding: 18,
        color: TEXT,
        overflow: "hidden",
    },
    donutWrap: {
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "8px 0 14px",
        borderBottom: "1px solid #edf2f7",
    },
    donut: {
        width: 88,
        height: 88,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        backgroundColor: "#eef4fb",
        color: TEXT,
        fontWeight: 900,
        boxShadow: "inset 0 0 0 12px #eef4fb",
    },
    donutTitle: {
        display: "block",
        fontSize: 15,
    },
    donutText: {
        margin: "6px 0 0",
        color: MUTED,
        fontSize: 12,
        lineHeight: 1.5,
    },
    analysisList: {
        display: "flex",
        flexDirection: "column",
        gap: 6,
        marginTop: 12,
    },
    analysisRow: {
        display: "grid",
        gridTemplateColumns: "34px minmax(0, 1fr) auto",
        alignItems: "center",
        gap: 10,
        padding: "8px 0",
        borderBottom: "1px solid #edf2f7",
    },
    analysisIcon: {
        width: 34,
        height: 34,
        borderRadius: 12,
        background: "rgba(18,113,184,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    analysisText: {
        display: "flex",
        flexDirection: "column",
        gap: 3,
        minWidth: 0,
        color: TEXT,
    },
    statusList: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
    },
    statusRow: {
        display: "grid",
        gridTemplateColumns: "minmax(140px, 0.8fr) minmax(140px, 1fr) auto",
        alignItems: "center",
        gap: 14,
        padding: "10px 0",
        borderBottom: "1px solid #edf2f7",
    },
    statusNameWrap: {
        display: "flex",
        alignItems: "center",
        gap: 9,
        minWidth: 0,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: "50%",
        flexShrink: 0,
    },
    statusName: {
        color: TEXT,
        fontSize: 13,
    },
    statusBarTrack: {
        height: 8,
        borderRadius: 999,
        background: "#eef4fb",
        overflow: "hidden",
    },
    statusBarFill: {
        display: "block",
        height: "100%",
        borderRadius: 999,
    },
    statusBadge: {
        border: "1px solid",
        borderRadius: 999,
        padding: "5px 10px",
        fontSize: 12,
        fontWeight: 700,
        minWidth: 48,
        textAlign: "center",
    },
    workload: {
        display: "flex",
        flexDirection: "column",
        gap: 18,
    },
    workloadSplit: {
        height: 18,
        borderRadius: 999,
        background: "#eef4fb",
        display: "flex",
        overflow: "hidden",
    },
    workloadFill: {
        height: "100%",
        display: "block",
    },
    workloadRows: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 10,
    },
    workloadLabel: {
        display: "block",
        color: MUTED,
        fontSize: 11,
        fontWeight: 900,
        textTransform: "uppercase",
        marginBottom: 5,
    },
    emptyState: {
        width: "100%",
        padding: "34px 18px",
        color: MUTED,
        textAlign: "center",
        fontSize: 13,
        fontWeight: 800,
    },
};
