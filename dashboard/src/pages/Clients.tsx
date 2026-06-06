import { useEffect, useState } from "react";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import Navbar from "../components/Navbar";
import SomapBackground from "../components/SomapBackground";
import api from "../api/api";

const SOMAP_BLUE = "#1271b8";
const SOMAP_GREEN = "#7EC933";
const TEXT = "#1a2e4a";
const MUTED = "#6b7f95";

interface Client {
    id: number;
    nom: string;
    email: string;
    telephone: string;
    adresse: string;
    demandesCount: number;
    projetsCount: number;
    demandeTitres: string[];
    projetTitres: string[];
}

type ClientStats = {
    clients: number;
    demandes: number;
    projets: number;
    services: number;
    notifications?: number;
};

const emptyStats: ClientStats = {
    clients: 0,
    demandes: 0,
    projets: 0,
    services: 0,
    notifications: 0,
};

function initials(name: string) {
    return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function formatNumber(value?: number) {
    return new Intl.NumberFormat("fr-MA").format(value ?? 0);
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

    return "Impossible de charger les statistiques clients.";
}

export default function Clients() {
    const [search, setSearch]     = useState("");
    const [clients, setClients] = useState<Client[]>([]);
    const [stats, setStats] = useState<ClientStats>(emptyStats);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [confirmDeleteClient, setConfirmDeleteClient] = useState<Client | null>(null);
    const [deletingClientId, setDeletingClientId] = useState<number | null>(null);

    const loadClientsPage = async () => {
        setLoading(true);
        setError("");

        try {
            const [clientsResponse, statsResponse] = await Promise.all([
                api.get<Client[]>("/clients"),
                api.get<ClientStats>("/clients/stats"),
            ]);

            setClients(clientsResponse.data ?? []);
            setStats(statsResponse.data ?? emptyStats);
        } catch (err) {
            setClients([]);
            setStats(emptyStats);
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadClientsPage();
    }, []);

    const handleDeleteClient = async () => {
        if (!confirmDeleteClient) return;

        setDeletingClientId(confirmDeleteClient.id);
        setError("");

        try {
            await api.delete(`/clients/${confirmDeleteClient.id}`);
            setSelectedClient((current) => current?.id === confirmDeleteClient.id ? null : current);
            setConfirmDeleteClient(null);
            await loadClientsPage();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setDeletingClientId(null);
        }
    };

    const filtered = clients.filter((c) => {
        const q = search.toLowerCase();
        return (
            !q ||
            c.nom?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q) ||
            c.telephone?.toLowerCase().includes(q) ||
            c.adresse?.toLowerCase().includes(q) ||
            c.demandeTitres?.some((title) => title.toLowerCase().includes(q)) ||
            c.projetTitres?.some((title) => title.toLowerCase().includes(q)) ||
            String(c.id).includes(q)
        );
    });

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
            helper: "Toutes periodes",
            icon: AssignmentOutlinedIcon,
            color: "#f6b718",
        },
        {
            label: "Projets",
            value: stats.projets,
            helper: "Projets lies",
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
    ];

    return (
        <SomapBackground style={styles.shell}>
            <Navbar />

            <main style={styles.main}>
                {/* Header */}
                <section style={styles.header}>
                    <div>
                        <span style={styles.eyebrow}>SOMAP & SERVICE</span>
                        <h1 style={styles.title}>Clients</h1>
                        <p style={styles.subtitle}>Suivi des comptes clients, demandes et projets associés.</p>
                    </div>
                </section>

                {/* Stats */}
                <section style={styles.statsGrid}>
                    {statCards.map((s) => {
                        const Icon = s.icon;

                        return (
                            <div key={s.label} style={styles.statCard}>
                                <div style={{ ...styles.statIcon, background: `${s.color}18`, color: s.color }}>
                                    <Icon sx={{ fontSize: 22 }} />
                                </div>
                                <div>
                                    <p style={styles.statLabel}>{s.label}</p>
                                    <strong style={styles.statValue}>{loading ? "-" : formatNumber(s.value)}</strong>
                                    <p style={styles.statHelper}>{s.helper}</p>
                                </div>
                            </div>
                        );
                    })}
                </section>

                {error && (
                    <section style={styles.errorBox}>
                        <strong>Le backend ne repond pas.</strong>
                        <span>{error}</span>
                    </section>
                )}

                {/* Toolbar */}
                <section style={styles.toolbar}>
                    <div style={styles.searchBox}>
                        <span style={styles.searchIconEl}>⌕</span>
                        <input
                            style={styles.searchInput}
                            placeholder="Rechercher par nom, email, téléphone, adresse, demande ou projet..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button style={styles.clearBtn} onClick={() => setSearch("")}>✕</button>
                        )}
                    </div>
                </section>

                {/* Table card */}
                <section style={styles.tableCard}>
                    <div style={styles.tableHeader}>
                        <div>
                            <h2 style={styles.sectionTitle}>Liste des clients</h2>
                            <p style={styles.sectionSubtitle}>
                                {loading
                                    ? "Chargement des clients..."
                                    : filtered.length === clients.length
                                      ? `${clients.length} clients au total`
                                      : `${filtered.length} résultat${filtered.length !== 1 ? "s" : ""} sur ${clients.length}`}
                            </p>
                        </div>
                        <span style={styles.countBadge}>{filtered.length} clients</span>
                    </div>

                    {/* Head row */}
                    <div style={{ ...styles.row, ...styles.headRow }}>
                        <span>Client</span>
                        <span>Contact</span>
                        <span>Adresse</span>
                        <span>Activité</span>
                        <span>Actions</span>
                    </div>

                    {loading ? (
                        <div style={styles.emptyState}>
                            <p style={{ margin: 0, color: MUTED, fontSize: 14 }}>Chargement des clients...</p>
                        </div>
                    ) : filtered.length > 0 ? filtered.map((client, i) => (
                        <div
                            key={client.id}
                            style={{ ...styles.row, ...(i === filtered.length - 1 ? { borderBottom: "none" } : {}) }}
                        >
                            <div style={styles.clientCell}>
                                <div style={styles.avatar}>{initials(client.nom ?? "")}</div>
                                <div style={{ minWidth: 0 }}>
                                    <strong style={styles.clientName}>{client.nom || "Client sans nom"}</strong>
                                    <p style={styles.company}>#{client.id}</p>
                                </div>
                            </div>

                            <div style={{ minWidth: 0 }}>
                                <p style={{ ...styles.primaryText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.email || "-"}</p>
                                <p style={styles.secondaryText}>{client.telephone || "-"}</p>
                            </div>

                            <span style={styles.primaryText}>{client.adresse || "-"}</span>

                            <div style={styles.activityCell}>
                                <span style={styles.primaryText}>{formatNumber(client.demandesCount)} demandes</span>
                                <span style={styles.secondaryText}>{formatNumber(client.projetsCount)} projets</span>
                            </div>

                            <div style={styles.actionCell}>
                                <button style={styles.detailsButton} onClick={() => setSelectedClient(client)}>
                                    Détails
                                </button>
                                <button style={styles.blockButton} onClick={() => setConfirmDeleteClient(client)}>
                                    Bloquer
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div style={styles.emptyState}>
                            <p style={{ margin: 0, color: MUTED, fontSize: 14 }}>Aucun client ne correspond à votre recherche.</p>
                            <button style={styles.resetBtn} onClick={() => setSearch("")}>Réinitialiser la recherche</button>
                        </div>
                    )}
                </section>
            </main>

            {selectedClient && (
                <div style={styles.modalOverlay} onClick={() => setSelectedClient(null)}>
                    <section style={styles.modalCard} onClick={(event) => event.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <div style={styles.modalIdentity}>
                                <div style={styles.modalAvatar}>{initials(selectedClient.nom ?? "")}</div>
                                <div>
                                    <span style={styles.modalEyebrow}>Fiche client</span>
                                    <h2 style={styles.modalTitle}>{selectedClient.nom || "Client sans nom"}</h2>
                                    <p style={styles.modalSubtitle}>{selectedClient.email || "-"}</p>
                                </div>
                            </div>
                            <button style={styles.closeButton} onClick={() => setSelectedClient(null)}>×</button>
                        </div>

                        <div style={styles.modalMeta}>
                            <div>
                                <span style={styles.modalLabel}>Téléphone</span>
                                <strong>{selectedClient.telephone || "-"}</strong>
                            </div>
                            <div>
                                <span style={styles.modalLabel}>Adresse</span>
                                <strong>{selectedClient.adresse || "-"}</strong>
                            </div>
                            <div>
                                <span style={styles.modalLabel}>Demandes</span>
                                <strong>{formatNumber(selectedClient.demandesCount)} demandes</strong>
                            </div>
                            <div>
                                <span style={styles.modalLabel}>Projets</span>
                                <strong>{formatNumber(selectedClient.projetsCount)} projets</strong>
                            </div>
                        </div>

                        <div style={styles.modalLists}>
                            <div style={styles.modalList}>
                                <div style={styles.modalListHeader}>
                                    <h3 style={styles.modalListTitle}>Demandes</h3>
                                    <span style={styles.listCountBadge}>{formatNumber(selectedClient.demandesCount)}</span>
                                </div>
                                {selectedClient.demandeTitres?.length ? (
                                    selectedClient.demandeTitres.map((title, index) => (
                                        <p key={`${title}-${index}`} style={styles.modalListItem}>
                                            <span style={styles.listMarker}>{index + 1}</span>
                                            {title}
                                        </p>
                                    ))
                                ) : (
                                    <p style={styles.modalEmpty}>Aucune demande.</p>
                                )}
                            </div>

                            <div style={styles.modalList}>
                                <div style={styles.modalListHeader}>
                                    <h3 style={styles.modalListTitle}>Projets</h3>
                                    <span style={{ ...styles.listCountBadge, background: "rgba(126,201,51,0.16)", color: "#3f8619" }}>{formatNumber(selectedClient.projetsCount)}</span>
                                </div>
                                {selectedClient.projetTitres?.length ? (
                                    selectedClient.projetTitres.map((title, index) => (
                                        <p key={`${title}-${index}`} style={styles.modalListItem}>
                                            <span style={{ ...styles.listMarker, background: "rgba(126,201,51,0.16)", color: "#3f8619" }}>{index + 1}</span>
                                            {title}
                                        </p>
                                    ))
                                ) : (
                                    <p style={styles.modalEmpty}>Aucun projet.</p>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {confirmDeleteClient && (
                <div style={styles.modalOverlay} onClick={() => setConfirmDeleteClient(null)}>
                    <section style={styles.confirmCard} onClick={(event) => event.stopPropagation()}>
                        <h2 style={styles.confirmTitle}>Bloquer ce client ?</h2>
                        <p style={styles.confirmText}>
                            Cette action supprimera {confirmDeleteClient.nom || "ce client"} de la liste des clients.
                        </p>
                        <div style={styles.confirmActions}>
                            <button
                                style={styles.cancelButton}
                                onClick={() => setConfirmDeleteClient(null)}
                                disabled={deletingClientId === confirmDeleteClient.id}
                            >
                                Annuler
                            </button>
                            <button
                                style={styles.confirmDeleteButton}
                                onClick={handleDeleteClient}
                                disabled={deletingClientId === confirmDeleteClient.id}
                            >
                                {deletingClientId === confirmDeleteClient.id ? "Suppression..." : "Oui, bloquer"}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </SomapBackground>
    );
}

const styles: Record<string, React.CSSProperties> = {
    shell: {
        display: "flex",
        alignItems: "stretch",
        justifyContent: "flex-start",
        width: "100%",
        height: "100dvh",
        minHeight: "100dvh",
        overflow: "hidden",
    },
    main: {
        flex: 1,
        padding: 28,
        overflowY: "auto",
        overflowX: "hidden",
        height: "100dvh",
        minWidth: 0,
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 18,
        marginBottom: 22,
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
    primaryButton: {
        border: "none",
        background: SOMAP_BLUE,
        color: "#fff",
        height: 42,
        padding: "0 18px",
        borderRadius: 12,
        fontWeight: 700,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: 14,
        flexShrink: 0,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    btnPlus: {
        width: 20,
        height: 20,
        borderRadius: 10,
        background: "rgba(255,255,255,0.22)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        lineHeight: 1,
    },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(130px, 1fr))",
        gap: 14,
        marginBottom: 18,
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
        fontSize: 18,
        fontWeight: 900,
        flexShrink: 0,
    },
    statLabel: { margin: 0, color: MUTED, fontSize: 12, fontWeight: 600 },
    statValue: { display: "block", color: TEXT, fontSize: 22, lineHeight: 1.1, marginTop: 2 },
    statHelper: { margin: "3px 0 0", color: "#91a1b2", fontSize: 11 },
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
        marginBottom: 18,
    },
    toolbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 14,
        marginBottom: 18,
    },
    searchBox: {
        flex: 1,
        height: 44,
        background: "#fff",
        border: "1px solid #dfe9f3",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 14px",
    },
    searchIconEl: { color: SOMAP_BLUE, fontSize: 19, fontWeight: 900, flexShrink: 0 },
    searchInput: {
        flex: 1,
        border: "none",
        outline: "none",
        fontSize: 13,
        color: TEXT,
        background: "transparent",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    clearBtn: {
        border: "none",
        background: "none",
        cursor: "pointer",
        color: MUTED,
        fontSize: 13,
        padding: "0 2px",
        lineHeight: 1,
        flexShrink: 0,
    },
    filters: { display: "flex", gap: 8 },
    filterButton: {
        border: "1px solid #dfe9f3",
        background: "#fff",
        color: MUTED,
        height: 38,
        padding: "0 14px",
        borderRadius: 999,
        fontWeight: 600,
        cursor: "pointer",
        fontSize: 13,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    filterButtonActive: {
        background: "rgba(18,113,184,0.10)",
        color: SOMAP_BLUE,
        borderColor: "rgba(18,113,184,0.22)",
        fontWeight: 700,
    },
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
        gridTemplateColumns: "minmax(180px, 1.45fr) minmax(190px, 1.45fr) minmax(140px, 1fr) minmax(110px, 0.8fr) minmax(92px, 0.55fr)",
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
    clientCell: { display: "flex", alignItems: "center", gap: 11, minWidth: 0 },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 12,
        background: `linear-gradient(135deg, ${SOMAP_BLUE}, ${SOMAP_GREEN})`,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 13,
        flexShrink: 0,
    },
    clientName: { color: TEXT, fontSize: 13, fontWeight: 600 },
    company: { margin: "2px 0 0", color: MUTED, fontSize: 12 },
    primaryText: { margin: 0, color: TEXT, fontSize: 13, fontWeight: 600 },
    secondaryText: { margin: "3px 0 0", color: "#8b9aad", fontSize: 12 },
    activityCell: { display: "flex", flexDirection: "column" },
    actionCell: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
    },
    detailsButton: {
        justifySelf: "start",
        border: "1px solid rgba(18,113,184,0.22)",
        background: "rgba(18,113,184,0.08)",
        color: SOMAP_BLUE,
        height: 32,
        padding: "0 12px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    blockButton: {
        border: "1px solid rgba(173,35,36,0.22)",
        background: "rgba(173,35,36,0.08)",
        color: "#ad2324",
        height: 32,
        padding: "0 12px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    statusBadge: {
        justifySelf: "start",
        borderRadius: 999,
        padding: "5px 10px",
        fontSize: 11,
        fontWeight: 700,
    },
    emptyState: {
        padding: "48px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
    },
    resetBtn: {
        border: "none",
        background: "rgba(18,113,184,0.10)",
        color: SOMAP_BLUE,
        padding: "8px 16px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    modalOverlay: {
        position: "fixed",
        inset: 0,
        zIndex: 20,
        background: "rgba(10,24,44,0.42)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    modalCard: {
        width: "min(760px, 100%)",
        maxHeight: "82dvh",
        overflowY: "auto",
        background: "#fff",
        border: "1px solid #dfe9f3",
        borderRadius: 16,
        boxShadow: "0 24px 70px rgba(13,45,94,0.22)",
    },
    modalHeader: {
        padding: "22px 24px",
        background: `linear-gradient(135deg, ${SOMAP_BLUE}, #0f5d98 58%, ${SOMAP_GREEN})`,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 18,
    },
    modalIdentity: { display: "flex", alignItems: "center", gap: 14, minWidth: 0 },
    modalAvatar: {
        width: 54,
        height: 54,
        borderRadius: 14,
        background: "rgba(255,255,255,0.18)",
        border: "1px solid rgba(255,255,255,0.35)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: 17,
        flexShrink: 0,
    },
    modalEyebrow: {
        display: "block",
        fontSize: 10,
        fontWeight: 900,
        textTransform: "uppercase",
        letterSpacing: 1,
        opacity: 0.78,
        marginBottom: 5,
    },
    modalTitle: { margin: 0, color: "#fff", fontSize: 22, lineHeight: 1.15 },
    modalSubtitle: { margin: "5px 0 0", color: "rgba(255,255,255,0.82)", fontSize: 13 },
    closeButton: {
        width: 34,
        height: 34,
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.28)",
        background: "rgba(255,255,255,0.16)",
        color: "#fff",
        fontSize: 22,
        lineHeight: 1,
        cursor: "pointer",
    },
    modalMeta: {
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 12,
        padding: "18px 20px",
        borderBottom: "1px solid #edf2f7",
        background: "#f8fbff",
    },
    modalLabel: {
        display: "block",
        color: MUTED,
        fontSize: 11,
        fontWeight: 800,
        textTransform: "uppercase",
        marginBottom: 5,
    },
    modalLists: {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 16,
        padding: 20,
    },
    modalList: {
        border: "1px solid #e5edf5",
        borderRadius: 14,
        padding: 16,
        minHeight: 150,
        background: "linear-gradient(180deg, #fbfdff, #ffffff)",
    },
    modalListHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 12,
    },
    modalListTitle: { margin: 0, color: TEXT, fontSize: 15 },
    listCountBadge: {
        background: "rgba(18,113,184,0.10)",
        color: SOMAP_BLUE,
        borderRadius: 999,
        padding: "4px 9px",
        fontSize: 12,
        fontWeight: 800,
    },
    modalListItem: {
        margin: "0 0 9px",
        padding: "9px 10px",
        borderRadius: 10,
        background: "#fff",
        border: "1px solid #edf2f7",
        color: TEXT,
        fontSize: 13,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 9,
    },
    listMarker: {
        width: 24,
        height: 24,
        borderRadius: 8,
        background: "rgba(18,113,184,0.10)",
        color: SOMAP_BLUE,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 900,
        flexShrink: 0,
    },
    modalEmpty: {
        margin: 0,
        color: MUTED,
        fontSize: 13,
        background: "#fff",
        border: "1px dashed #dfe9f3",
        borderRadius: 10,
        padding: 12,
    },
    confirmCard: {
        width: "min(420px, 100%)",
        background: "#fff",
        border: "1px solid #dfe9f3",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 24px 70px rgba(13,45,94,0.22)",
    },
    confirmTitle: { margin: 0, color: TEXT, fontSize: 18 },
    confirmText: { margin: "10px 0 0", color: MUTED, fontSize: 13, lineHeight: 1.5 },
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
    confirmDeleteButton: {
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
