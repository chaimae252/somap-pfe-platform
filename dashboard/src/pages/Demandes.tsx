import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import HourglassTopOutlinedIcon from "@mui/icons-material/HourglassTopOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import PriorityHighOutlinedIcon from "@mui/icons-material/PriorityHighOutlined";
import Layout from "../components/Layout";
import api, { API_ORIGIN } from "../api/api";
import { useSearchParams } from "react-router-dom";

const SOMAP_BLUE = "#1271b8";
const SOMAP_GREEN = "#7EC933";
const SOMAP_RED = "#ad2324";
const SOMAP_GOLD = "#f6b718";
const TEXT = "#1a2e4a";
const MUTED = "#6b7f95";

type DemandeStatus = "EN_ATTENTE" | "VALIDEE" | "REJETEE";
type Urgence = "FAIBLE" | "NORMAL" | "URGENT";
type StatusFilter = "TOUS" | DemandeStatus;
type UrgencyFilter = "TOUS" | Urgence;

type Demande = {
    id: number;
    objet: string;
    description: string;
    statut: DemandeStatus;
    dateCreation?: string;
    urgence?: Urgence;
    clientId?: number;
    serviceId?: number;
    clientNom?: string;
    serviceTitre?: string;
    adminId?: number;
    adminNom?: string;
    images?: Array<{
        id: number;
        imageUrl: string;
    }>;
};

const statusLabels: Record<DemandeStatus, string> = {
    EN_ATTENTE: "En attente",
    VALIDEE: "Validée",
    REJETEE: "Rejetée",
};

const urgencyLabels: Record<Urgence, string> = {
    FAIBLE: "Faible",
    NORMAL: "Normal",
    URGENT: "Urgent",
};

const statusTone: Record<DemandeStatus, { color: string; background: string; border: string }> = {
    EN_ATTENTE: { color: "#8a5a00", background: "#fff7df", border: "rgba(246,183,24,0.30)" },
    VALIDEE: { color: "#2f7d32", background: "rgba(126,201,51,0.15)", border: "rgba(126,201,51,0.25)" },
    REJETEE: { color: SOMAP_RED, background: "rgba(173,35,36,0.09)", border: "rgba(173,35,36,0.18)" },
};

const urgencyTone: Record<Urgence, { color: string; background: string }> = {
    FAIBLE: { color: SOMAP_BLUE, background: "rgba(18,113,184,0.10)" },
    NORMAL: { color: "#557086", background: "#edf3f8" },
    URGENT: { color: SOMAP_RED, background: "rgba(173,35,36,0.09)" },
};

function formatNumber(value?: number) {
    return new Intl.NumberFormat("fr-MA").format(value ?? 0);
}

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

function getErrorMessage(error: unknown, fallback: string) {
    if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message?: string }).message === "string"
    ) {
        return (error as { message: string }).message;
    }

    return fallback;
}

function getImageUrl(imageUrl: string) {
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
        return imageUrl;
    }

    return `${API_ORIGIN}${imageUrl}`;
}

export default function Demandes() {
    const [demandes, setDemandes] = useState<Demande[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("TOUS");
    const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>("TOUS");
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null);
    const [searchParams] = useSearchParams();

    const loadDemandes = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get<Demande[]>("/demandes");
            setDemandes(response.data ?? []);
        } catch (err) {
            setDemandes([]);
            setError(getErrorMessage(err, "Impossible de charger les demandes."));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadDemandes();
    }, []);

    useEffect(() => {
        const idParam = searchParams.get("id");
        if (idParam && demandes.length > 0) {
            const found = demandes.find((d) => String(d.id) === idParam);
            if (found) {
                setSelectedDemande(found);
            }
        }
    }, [searchParams, demandes]);

    const updateStatus = async (id: number, status: DemandeStatus) => {
        setUpdatingId(id);
        setError("");

        try {
            const response = await api.put<Demande>(`/demandes/${id}/status`, null, {
                params: { status },
            });

            setDemandes((items) =>
                items.map((demande) => (demande.id === id ? response.data : demande))
            );
            setSelectedDemande((current) => (current?.id === id ? response.data : current));
        } catch (err) {
            setError(getErrorMessage(err, "Impossible de mettre a jour le statut."));
        } finally {
            setUpdatingId(null);
        }
    };

    const model = useMemo(() => {
        const pending = demandes.filter((demande) => demande.statut === "EN_ATTENTE").length;
        const validated = demandes.filter((demande) => demande.statut === "VALIDEE").length;
        const rejected = demandes.filter((demande) => demande.statut === "REJETEE").length;
        const urgent = demandes.filter((demande) => demande.urgence === "URGENT").length;

        return { pending, validated, rejected, urgent };
    }, [demandes]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();

        return demandes.filter((demande) => {
            const matchStatus = statusFilter === "TOUS" || demande.statut === statusFilter;
            const matchUrgency = urgencyFilter === "TOUS" || demande.urgence === urgencyFilter;
            const matchSearch =
                !q ||
                demande.objet?.toLowerCase().includes(q) ||
                demande.description?.toLowerCase().includes(q) ||
                demande.clientNom?.toLowerCase().includes(q) ||
                demande.serviceTitre?.toLowerCase().includes(q) ||
                String(demande.id).includes(q);

            return matchStatus && matchUrgency && matchSearch;
        });
    }, [demandes, search, statusFilter, urgencyFilter]);

    const statCards = [
        { label: "Total demandes", value: demandes.length, helper: "Toutes les demandes", icon: AssignmentOutlinedIcon, color: SOMAP_BLUE },
        { label: "En attente", value: model.pending, helper: "À traiter", icon: HourglassTopOutlinedIcon, color: SOMAP_GOLD },
        { label: "Validées", value: model.validated, helper: "Acceptées", icon: CheckCircleOutlineOutlinedIcon, color: SOMAP_GREEN },
        { label: "Rejetées", value: model.rejected, helper: "Non retenues", icon: ErrorOutlineOutlinedIcon, color: SOMAP_RED },
        { label: "Urgentes", value: model.urgent, helper: "Priorité haute", icon: PriorityHighOutlinedIcon, color: SOMAP_RED },
    ];

    return (
        <Layout>
            <div style={styles.page}>
                <section style={styles.header}>
                    <div>
                        <span style={styles.eyebrow}>SOMAP & SERVICE</span>
                        <h1 style={styles.title}>Demandes</h1>
                        <p style={styles.subtitle}>Pilotage des demandes clients, priorités et décisions administrateur.</p>
                    </div>

                    <div style={styles.headerBadge}>
                        <HourglassTopOutlinedIcon sx={{ fontSize: 18 }} />
                        {loading ? "Chargement..." : `${formatNumber(model.pending)} en attente`}
                    </div>
                </section>

                {error && (
                    <section style={styles.errorBox}>
                        <ErrorOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                        <span>{error}</span>
                    </section>
                )}

                <section style={styles.statsGrid}>
                    {statCards.map((stat) => {
                        const Icon = stat.icon;

                        return (
                            <div key={stat.label} style={styles.statCard}>
                                <div style={{ ...styles.statIcon, color: stat.color, background: `${stat.color}18` }}>
                                    <Icon sx={{ fontSize: 22 }} />
                                </div>
                                <div>
                                    <p style={styles.statLabel}>{stat.label}</p>
                                    <strong style={styles.statValue}>{loading ? "-" : formatNumber(stat.value)}</strong>
                                    <p style={styles.statHelper}>{stat.helper}</p>
                                </div>
                            </div>
                        );
                    })}
                </section>

                <section style={styles.toolbar}>
                    <div style={styles.searchBox}>
                        <span style={styles.searchIcon}>⌕</span>
                        <input
                            style={styles.searchInput}
                            placeholder="Rechercher par objet, client, service ou description..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                        {search && (
                            <button style={styles.clearButton} onClick={() => setSearch("")}>×</button>
                        )}
                    </div>

                    <div style={styles.filters}>
                        {(["TOUS", "EN_ATTENTE", "VALIDEE", "REJETEE"] as StatusFilter[]).map((status) => (
                            <button
                                key={status}
                                style={{ ...styles.filterButton, ...(statusFilter === status ? styles.filterButtonActive : {}) }}
                                onClick={() => setStatusFilter(status)}
                            >
                                {status === "TOUS" ? "Tous" : statusLabels[status]}
                            </button>
                        ))}
                    </div>

                    <select
                        style={styles.select}
                        value={urgencyFilter}
                        onChange={(event) => setUrgencyFilter(event.target.value as UrgencyFilter)}
                    >
                        <option value="TOUS">Toutes urgences</option>
                        <option value="URGENT">Urgent</option>
                        <option value="NORMAL">Normal</option>
                        <option value="FAIBLE">Faible</option>
                    </select>
                </section>

                <section style={styles.tableCard}>
                    <div style={styles.tableHeader}>
                        <div>
                            <h2 style={styles.sectionTitle}>Liste des demandes</h2>
                            <p style={styles.sectionSubtitle}>
                                {loading
                                    ? "Chargement des demandes..."
                                    : filtered.length === demandes.length
                                      ? `${formatNumber(demandes.length)} demandes au total`
                                      : `${formatNumber(filtered.length)} résultat${filtered.length !== 1 ? "s" : ""} sur ${formatNumber(demandes.length)}`}
                            </p>
                        </div>
                        <span style={styles.countBadge}>{formatNumber(filtered.length)} visibles</span>
                    </div>

                    <div style={{ ...styles.row, ...styles.headRow }}>
                        <span>Demande</span>
                        <span>Client</span>
                        <span>Service</span>
                        <span>Priorité</span>
                        <span>Statut</span>
                        <span>Actions</span>
                    </div>

                    {loading ? (
                        <div style={styles.emptyState}>
                            <p>Chargement des demandes...</p>
                        </div>
                    ) : filtered.length > 0 ? (
                        filtered.map((demande, index) => {
                            const status = statusTone[demande.statut] ?? statusTone.EN_ATTENTE;
                            const urgency = demande.urgence ? urgencyTone[demande.urgence] : urgencyTone.NORMAL;

                            return (
                                <div
                                    key={demande.id}
                                    style={{ ...styles.row, ...(index === filtered.length - 1 ? { borderBottom: "none" } : {}) }}
                                >
                                    <div style={styles.demandeCell}>
                                        <div style={{ ...styles.demandeIcon, background: status.color }} />
                                        <div style={{ minWidth: 0 }}>
                                            <strong style={styles.demandeTitle}>{demande.objet || "Demande sans objet"}</strong>
                                            <p style={styles.demandeDescription}>{demande.description || "Aucune description."}</p>
                                            <span style={styles.dateText}>{formatDate(demande.dateCreation)}</span>
                                        </div>
                                    </div>

                                    <span style={styles.primaryText}>{demande.clientNom || `Client #${demande.clientId ?? "-"}`}</span>
                                    <span style={styles.secondaryText}>{demande.serviceTitre || `Service #${demande.serviceId ?? "-"}`}</span>
                                    <span style={{ ...styles.urgencyBadge, color: urgency.color, background: urgency.background }}>
                                        {demande.urgence ? urgencyLabels[demande.urgence] : "Normal"}
                                    </span>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                                        <span style={{ ...styles.statusBadge, color: status.color, background: status.background, borderColor: status.border }}>
                                            {statusLabels[demande.statut] ?? demande.statut}
                                        </span>
                                        {demande.adminNom && (
                                            <span style={{ fontSize: 10, color: MUTED, fontWeight: 700, paddingLeft: 4 }}>
                                                par: {demande.adminNom}
                                            </span>
                                        )}
                                    </div>

                                    <div style={styles.actionCell}>
                                        <button style={styles.detailsButton} onClick={() => setSelectedDemande(demande)}>
                                            Détails
                                        </button>
                                        {demande.statut !== "EN_ATTENTE" && (
                                            <span style={styles.doneText}>Traitée</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div style={styles.emptyState}>
                            <p>Aucune demande ne correspond à votre recherche.</p>
                            <button
                                style={styles.resetButton}
                                onClick={() => {
                                    setSearch("");
                                    setStatusFilter("TOUS");
                                    setUrgencyFilter("TOUS");
                                }}
                            >
                                Réinitialiser les filtres
                            </button>
                        </div>
                    )}
                </section>

                {selectedDemande && (
                    <div style={styles.modalOverlay} onClick={() => setSelectedDemande(null)}>
                        <section style={styles.modalCard} onClick={(event) => event.stopPropagation()}>
                            <div style={styles.modalHeader}>
                                <div>
                                    <span style={styles.modalEyebrow}>Détail demande</span>
                                    <h2 style={styles.modalTitle}>{selectedDemande.objet || "Demande sans objet"}</h2>
                                    <p style={styles.modalSubtitle}>
                                        {selectedDemande.clientNom || `Client #${selectedDemande.clientId ?? "-"}`} · {selectedDemande.serviceTitre || `Service #${selectedDemande.serviceId ?? "-"}`}
                                    </p>
                                </div>
                                <button style={styles.closeButton} onClick={() => setSelectedDemande(null)}>×</button>
                            </div>

                            <div style={{ ...styles.modalMeta, gridTemplateColumns: selectedDemande.adminNom ? "repeat(5, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))" }}>
                                <div>
                                    <span style={styles.modalLabel}>Client</span>
                                    <strong>{selectedDemande.clientNom || `Client #${selectedDemande.clientId ?? "-"}`}</strong>
                                </div>
                                <div>
                                    <span style={styles.modalLabel}>Service</span>
                                    <strong>{selectedDemande.serviceTitre || `Service #${selectedDemande.serviceId ?? "-"}`}</strong>
                                </div>
                                <div>
                                    <span style={styles.modalLabel}>Priorité</span>
                                    <strong>{selectedDemande.urgence ? urgencyLabels[selectedDemande.urgence] : "Normal"}</strong>
                                </div>
                                <div>
                                    <span style={styles.modalLabel}>Statut</span>
                                    <strong>{statusLabels[selectedDemande.statut] ?? selectedDemande.statut}</strong>
                                </div>
                                {selectedDemande.adminNom && (
                                    <div>
                                        <span style={styles.modalLabel}>Traité par</span>
                                        <strong>{selectedDemande.adminNom}</strong>
                                    </div>
                                )}
                            </div>

                            <div style={styles.modalBody}>
                                <div style={styles.descriptionPanel}>
                                    <span style={styles.modalLabel}>Description complète</span>
                                    <p style={styles.fullDescription}>{selectedDemande.description || "Aucune description."}</p>
                                    <span style={styles.dateText}>{formatDate(selectedDemande.dateCreation)}</span>
                                </div>

                                <div style={styles.imagesPanel}>
                                    <div style={styles.imagesHeader}>
                                        <span style={styles.modalLabel}>Images</span>
                                        <strong>{formatNumber(selectedDemande.images?.length ?? 0)}</strong>
                                    </div>
                                    {selectedDemande.images?.length ? (
                                        <div style={styles.imageGrid}>
                                            {selectedDemande.images.map((image) => (
                                                <img
                                                    key={image.id}
                                                    src={getImageUrl(image.imageUrl)}
                                                    alt={selectedDemande.objet || "Image demande"}
                                                    style={styles.demandeImage}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={styles.noImages}>Aucune image jointe.</div>
                                    )}
                                </div>
                            </div>

                            <div style={styles.modalFooter}>
                                {selectedDemande.statut === "EN_ATTENTE" ? (
                                    <>
                                        <button
                                            style={styles.validateButton}
                                            disabled={updatingId === selectedDemande.id}
                                            onClick={() => void updateStatus(selectedDemande.id, "VALIDEE")}
                                        >
                                            Valider la demande
                                        </button>
                                        <button
                                            style={styles.rejectButton}
                                            disabled={updatingId === selectedDemande.id}
                                            onClick={() => void updateStatus(selectedDemande.id, "REJETEE")}
                                        >
                                            Rejeter la demande
                                        </button>
                                    </>
                                ) : (
                                    <span style={styles.doneText}>Demande traitée</span>
                                )}
                            </div>
                        </section>
                    </div>
                )}
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
        gridTemplateColumns: "repeat(5, minmax(130px, 1fr))",
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
        padding: "0 13px",
        borderRadius: 999,
        fontWeight: 700,
        cursor: "pointer",
        fontSize: 12,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    filterButtonActive: {
        background: "rgba(18,113,184,0.10)",
        color: SOMAP_BLUE,
        borderColor: "rgba(18,113,184,0.22)",
    },
    select: {
        height: 38,
        border: "1px solid #dfe9f3",
        background: "#fff",
        color: TEXT,
        borderRadius: 10,
        padding: "0 12px",
        fontSize: 12,
        fontWeight: 700,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        outline: "none",
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
        gridTemplateColumns: "minmax(250px, 1.7fr) minmax(120px, 0.8fr) minmax(140px, 0.9fr) minmax(90px, 0.55fr) minmax(92px, 0.55fr) minmax(140px, 0.8fr)",
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
    demandeCell: {
        display: "flex",
        alignItems: "center",
        gap: 11,
        minWidth: 0,
    },
    demandeIcon: {
        width: 10,
        height: 42,
        borderRadius: 999,
        boxShadow: "0 0 0 4px rgba(18,113,184,0.06)",
        flexShrink: 0,
    },
    demandeTitle: {
        display: "block",
        color: TEXT,
        fontSize: 13,
        fontWeight: 700,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    demandeDescription: {
        margin: "3px 0 0",
        color: MUTED,
        fontSize: 12,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    dateText: {
        display: "block",
        marginTop: 4,
        color: "#96a6b7",
        fontSize: 11,
        fontWeight: 700,
    },
    primaryText: { color: TEXT, fontSize: 13, fontWeight: 700 },
    secondaryText: { color: MUTED, fontSize: 12, fontWeight: 700 },
    urgencyBadge: {
        justifySelf: "start",
        borderRadius: 999,
        padding: "5px 10px",
        fontSize: 11,
        fontWeight: 800,
    },
    statusBadge: {
        justifySelf: "start",
        border: "1px solid",
        borderRadius: 999,
        padding: "5px 10px",
        fontSize: 11,
        fontWeight: 800,
    },
    actionCell: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
    },
    detailsButton: {
        border: "1px solid rgba(18,113,184,0.22)",
        background: "rgba(18,113,184,0.08)",
        color: SOMAP_BLUE,
        height: 32,
        padding: "0 11px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 800,
        cursor: "pointer",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    validateButton: {
        border: "1px solid rgba(126,201,51,0.28)",
        background: "rgba(126,201,51,0.14)",
        color: "#3f8619",
        height: 32,
        padding: "0 11px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 800,
        cursor: "pointer",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    rejectButton: {
        border: "1px solid rgba(173,35,36,0.22)",
        background: "rgba(173,35,36,0.08)",
        color: SOMAP_RED,
        height: 32,
        padding: "0 11px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 800,
        cursor: "pointer",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    doneText: {
        justifySelf: "start",
        color: MUTED,
        background: "#edf3f8",
        borderRadius: 999,
        padding: "6px 10px",
        fontSize: 11,
        fontWeight: 800,
    },
    emptyState: {
        padding: "48px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        color: MUTED,
        fontSize: 14,
    },
    resetButton: {
        border: "none",
        background: "rgba(18,113,184,0.10)",
        color: SOMAP_BLUE,
        padding: "8px 16px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 700,
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
        width: "min(820px, 100%)",
        maxHeight: "84dvh",
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
    modalSubtitle: { margin: "6px 0 0", color: "rgba(255,255,255,0.84)", fontSize: 13, fontWeight: 700 },
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
    modalBody: {
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 300px",
        gap: 16,
        padding: 20,
    },
    descriptionPanel: {
        border: "1px solid #e5edf5",
        borderRadius: 14,
        padding: 16,
        background: "#fbfdff",
        minHeight: 180,
    },
    fullDescription: {
        margin: "8px 0 0",
        color: TEXT,
        fontSize: 14,
        lineHeight: 1.65,
        whiteSpace: "pre-wrap",
    },
    imagesPanel: {
        border: "1px solid #e5edf5",
        borderRadius: 14,
        padding: 16,
        background: "linear-gradient(180deg, #fbfdff, #ffffff)",
        minHeight: 180,
    },
    imagesHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    imageGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 10,
    },
    demandeImage: {
        width: "100%",
        aspectRatio: "1 / 1",
        objectFit: "cover",
        borderRadius: 10,
        border: "1px solid #edf2f7",
        background: "#edf3f8",
    },
    noImages: {
        border: "1px dashed #dfe9f3",
        borderRadius: 10,
        padding: 14,
        color: MUTED,
        fontSize: 13,
        fontWeight: 700,
        textAlign: "center",
    },
    modalFooter: {
        padding: "0 20px 20px",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
    },
};
