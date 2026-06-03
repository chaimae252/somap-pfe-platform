import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import SyncOutlinedIcon from "@mui/icons-material/SyncOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import PauseCircleOutlineOutlinedIcon from "@mui/icons-material/PauseCircleOutlineOutlined";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import Layout from "../components/Layout";
import api from "../api/api";

const SOMAP_BLUE = "#1271b8";
const SOMAP_GREEN = "#7EC933";
const SOMAP_RED = "#ad2324";
const SOMAP_GOLD = "#f6b718";
const TEXT = "#1a2e4a";
const MUTED = "#6b7f95";

type ProjetStatus = "EN_COURS" | "TERMINE" | "SUSPENDU";
type StatusFilter = "TOUS" | ProjetStatus;

type Projet = {
    id: number;
    titre: string;
    description: string;
    statut: ProjetStatus;
    dateDebut?: string;
    dateFin?: string;
    clientId?: number;
    clientNom?: string;
    demandeId?: number;
    demandeObjet?: string;
    demandeStatut?: string;
    serviceTitre?: string;
};

type Client = { id: number; nom: string; email?: string };
type Demande = {
    id: number;
    objet: string;
    description?: string;
    statut: "EN_ATTENTE" | "VALIDEE" | "REJETEE";
    clientId?: number;
    clientNom?: string;
    serviceTitre?: string;
};

type ProjetForm = {
    titre: string;
    description: string;
    statut: ProjetStatus;
    dateFin: string;
    clientId: string;
    demandeId: string;
};

const emptyForm: ProjetForm = {
    titre: "",
    description: "",
    statut: "EN_COURS",
    dateFin: "",
    clientId: "",
    demandeId: "",
};

const statusLabels: Record<ProjetStatus, string> = {
    EN_COURS: "En cours",
    TERMINE: "Terminé",
    SUSPENDU: "Suspendu",
};

const statusTone: Record<ProjetStatus, { color: string; background: string; border: string }> = {
    EN_COURS: { color: SOMAP_BLUE, background: "rgba(18,113,184,0.10)", border: "rgba(18,113,184,0.22)" },
    TERMINE: { color: "#3f8619", background: "rgba(126,201,51,0.16)", border: "rgba(126,201,51,0.28)" },
    SUSPENDU: { color: SOMAP_RED, background: "rgba(173,35,36,0.08)", border: "rgba(173,35,36,0.20)" },
};

function formatNumber(value?: number) {
    return new Intl.NumberFormat("fr-MA").format(value ?? 0);
}

function formatDate(value?: string) {
    if (!value) return "Non définie";
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("fr-MA", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}

function toDateInput(value?: string) {
    if (!value) return "";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
}

function getErrorMessage(error: unknown, fallback: string) {
    if (typeof error === "object" && error !== null && "message" in error && typeof (error as { message?: string }).message === "string") {
        return (error as { message: string }).message;
    }
    return fallback;
}

function buildPayload(form: ProjetForm) {
    return {
        titre: form.titre.trim(),
        description: form.description.trim(),
        statut: form.statut,
        dateFin: form.dateFin ? `${form.dateFin}T00:00:00` : null,
        clientId: Number(form.clientId),
        demandeId: Number(form.demandeId),
    };
}

export default function Projets() {
    const [projets, setProjets] = useState<Projet[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [demandes, setDemandes] = useState<Demande[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("TOUS");
    const [selectedProjet, setSelectedProjet] = useState<Projet | null>(null);
    const [editingProjet, setEditingProjet] = useState<Projet | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [form, setForm] = useState<ProjetForm>(emptyForm);

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const [projetsResponse, clientsResponse, demandesResponse] = await Promise.all([
                api.get<Projet[]>("/projets"),
                api.get<Client[]>("/clients"),
                api.get<Demande[]>("/demandes"),
            ]);
            setProjets(projetsResponse.data ?? []);
            setClients(clientsResponse.data ?? []);
            setDemandes(demandesResponse.data ?? []);
        } catch (err) {
            setProjets([]);
            setClients([]);
            setDemandes([]);
            setError(getErrorMessage(err, "Impossible de charger les projets."));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => void loadData(), 0);
        return () => clearTimeout(timer);
    }, []);

    const projetStats = useMemo(() => {
        const total = projets.length;
        const inProgress = projets.filter((p) => p.statut === "EN_COURS").length;
        const completed = projets.filter((p) => p.statut === "TERMINE").length;
        const suspended = projets.filter((p) => p.statut === "SUSPENDU").length;
        return { total, inProgress, completed, suspended };
    }, [projets]);

    const filteredProjets = useMemo(() => {
        const query = search.trim().toLowerCase();
        return projets.filter((projet) => {
            const matchesStatus = statusFilter === "TOUS" || projet.statut === statusFilter;
            const matchesSearch = !query ||
                [projet.titre, projet.description, projet.clientNom, projet.demandeObjet, projet.serviceTitre, projet.clientId?.toString(), projet.demandeId?.toString()]
                    .some((val) => val?.toLowerCase().includes(query));
            return matchesStatus && matchesSearch;
        });
    }, [projets, search, statusFilter]);

    const linkedDemandeIds = useMemo(() => {
        return new Set(
            projets
                .filter((p) => !editingProjet || p.id !== editingProjet.id)
                .map((p) => p.demandeId)
                .filter((id): id is number => typeof id === "number")
        );
    }, [editingProjet, projets]);

    const demandesForSelect = useMemo(() => {
        const statusOrder: Record<Demande["statut"], number> = {
            VALIDEE: 0,
            EN_ATTENTE: 1,
            REJETEE: 2,
        };

        return [...demandes].sort((a, b) => {
            const statusDiff = statusOrder[a.statut] - statusOrder[b.statut];
            if (statusDiff !== 0) return statusDiff;
            return a.id - b.id;
        });
    }, [demandes]);


    const statCards = [
        { label: "Total projets", value: projetStats.total, helper: "Projets enregistrés", icon: WorkOutlineOutlinedIcon, color: SOMAP_BLUE },
        { label: "En cours", value: projetStats.inProgress, helper: "Suivi actif", icon: SyncOutlinedIcon, color: SOMAP_BLUE },
        { label: "Terminés", value: projetStats.completed, helper: "Clôturés", icon: CheckCircleOutlineOutlinedIcon, color: SOMAP_GREEN },
        { label: "Suspendus", value: projetStats.suspended, helper: "En pause", icon: PauseCircleOutlineOutlinedIcon, color: SOMAP_RED },
    ];

    const openCreateModal = () => {
        setEditingProjet(null);
        setForm(emptyForm);
        setShowCreateModal(true);
        setError("");
        setSuccess("");
    };

    const openEditModal = (projet: Projet) => {
        setEditingProjet(projet);
        setForm({
            titre: projet.titre ?? "",
            description: projet.description ?? "",
            statut: projet.statut,
            dateFin: toDateInput(projet.dateFin),
            clientId: projet.clientId?.toString() ?? "",
            demandeId: projet.demandeId?.toString() ?? "",
        });
        setShowCreateModal(true);
        setError("");
        setSuccess("");
    };

    const closeFormModal = () => {
        setShowCreateModal(false);
        setEditingProjet(null);
        setForm(emptyForm);
    };

    const handleDemandeChange = (demandeId: string) => {
        const selected = demandes.find(d => d.id === Number(demandeId));
        setForm(prev => ({
            ...prev,
            demandeId,
            clientId: selected?.clientId?.toString() ?? prev.clientId,
            titre: prev.titre || selected?.objet || "",
            description: prev.description || selected?.description || "",
        }));
    };

    const saveProjet = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");
        try {
            const payload = buildPayload(form);
            const response = editingProjet
                ? await api.put<Projet>(`/projets/${editingProjet.id}`, payload)
                : await api.post<Projet>("/projets", payload);
            setProjets(items => editingProjet
                ? items.map(p => p.id === editingProjet.id ? response.data : p)
                : [response.data, ...items]);
            setSelectedProjet(cur => cur?.id === response.data.id ? response.data : cur);
            setSuccess(editingProjet ? "Projet mis à jour." : "Projet créé.");
            closeFormModal();
        } catch (err) {
            setError(getErrorMessage(err, "Impossible d'enregistrer le projet."));
        } finally {
            setSaving(false);
        }
    };

    const deleteProjet = async (projet: Projet) => {
        if (!window.confirm(`Supprimer le projet "${projet.titre}" ?`)) return;
        setError("");
        setSuccess("");
        try {
            await api.delete(`/projets/${projet.id}`);
            setProjets(items => items.filter(p => p.id !== projet.id));
            setSelectedProjet(cur => cur?.id === projet.id ? null : cur);
            setSuccess("Projet supprimé.");
        } catch (err) {
            setError(getErrorMessage(err, "Impossible de supprimer."));
        }
    };

    return (
        <Layout>
            <div style={styles.page}>
                {/* Header simplifié, comme Demandes */}
                <section style={styles.header}>
                    <div>
                        <span style={styles.eyebrow}>SOMAP & SERVICE</span>
                        <h1 style={styles.title}>Projets</h1>
                        <p style={styles.subtitle}>Créez, suivez et mettez à jour les projets validés par les demandes clients.</p>
                    </div>
                    <div style={styles.headerBadge}>
                        <AddCircleOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                        <button style={styles.headerButton} onClick={openCreateModal}>Nouveau projet</button>
                    </div>
                </section>

                {error && (
                    <section style={styles.errorBox}>
                        <ErrorOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                        <span>{error}</span>
                    </section>
                )}
                {success && (
                    <section style={styles.successBox}>
                        <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                        <span>{success}</span>
                    </section>
                )}

                {/* Stats cards – style identique à Demandes */}
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

                {/* Toolbar avec recherche à icône et filtres en boutons */}
                <section style={styles.toolbar}>
                    <div style={styles.searchBox}>
                        <span style={styles.searchIcon}>⌕</span>
                        <input
                            style={styles.searchInput}
                            placeholder="Rechercher par titre, client, demande..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button style={styles.clearButton} onClick={() => setSearch("")}>×</button>
                        )}
                    </div>

                    <div style={styles.filters}>
                        {(["TOUS", "EN_COURS", "TERMINE", "SUSPENDU"] as StatusFilter[]).map((status) => (
                            <button
                                key={status}
                                style={{ ...styles.filterButton, ...(statusFilter === status ? styles.filterButtonActive : {}) }}
                                onClick={() => setStatusFilter(status)}
                            >
                                {status === "TOUS" ? "Tous" : statusLabels[status]}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Tableau des projets */}
                <section style={styles.tableCard}>
                    <div style={styles.tableHeader}>
                        <div>
                            <h2 style={styles.sectionTitle}>Liste des projets</h2>
                            <p style={styles.sectionSubtitle}>
                                {loading ? "Chargement..." :
                                    filteredProjets.length === projets.length
                                        ? `${formatNumber(projets.length)} projets au total`
                                        : `${formatNumber(filteredProjets.length)} résultat(s) sur ${formatNumber(projets.length)}`}
                            </p>
                        </div>
                        <span style={styles.countBadge}>{formatNumber(filteredProjets.length)} visible(s)</span>
                    </div>

                    <div style={{ ...styles.row, ...styles.headRow }}>
                        <span>Projet</span>
                        <span>Client</span>
                        <span>Demande</span>
                        <span>Statut</span>
                        <span>Dates</span>
                        <span>Actions</span>
                    </div>

                    {loading ? (
                        <div style={styles.emptyState}>Chargement des projets...</div>
                    ) : filteredProjets.length ? (
                        filteredProjets.map((projet, idx) => {
                            const tone = statusTone[projet.statut];
                            return (
                                <div key={projet.id} style={{ ...styles.row, ...(idx === filteredProjets.length - 1 ? { borderBottom: "none" } : {}) }}>
                                    <div style={styles.demandeCell}>
                                        <div style={{ ...styles.demandeIcon, background: tone.color }} />
                                        <div style={{ minWidth: 0 }}>
                                            <strong style={styles.demandeTitle}>{projet.titre}</strong>
                                            <p style={styles.demandeDescription}>{projet.description || "Aucune description."}</p>
                                            {projet.serviceTitre && <span style={styles.dateText}>{projet.serviceTitre}</span>}
                                        </div>
                                    </div>
                                    <span style={styles.primaryText}>{projet.clientNom || `Client #${projet.clientId ?? "-"}`}</span>
                                    <span style={styles.secondaryText}>{projet.demandeObjet || `Demande #${projet.demandeId ?? "-"}`}</span>
                                    <span style={{ ...styles.statusBadge, color: tone.color, background: tone.background, borderColor: tone.border }}>
                                        {statusLabels[projet.statut]}
                                    </span>
                                    <div>
                                        <span style={styles.primaryText}>{formatDate(projet.dateDebut)}</span>
                                        <span style={styles.secondaryText}>Fin: {formatDate(projet.dateFin)}</span>
                                    </div>
                                    <div style={styles.actionCell}>
                                        <button style={styles.detailsButton} onClick={() => setSelectedProjet(projet)}>Détails</button>
                                        <button style={styles.editButton} onClick={() => openEditModal(projet)}>Modifier</button>
                                        <button style={styles.deleteButton} onClick={() => void deleteProjet(projet)}>Supprimer</button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div style={styles.emptyState}>
                            <p>Aucun projet trouvé.</p>
                            <button style={styles.resetButton} onClick={() => { setSearch(""); setStatusFilter("TOUS"); }}>
                                Réinitialiser
                            </button>
                        </div>
                    )}
                </section>
            </div>

            {/* Modal Détails (style Demandes) */}
            {selectedProjet && (
                <div style={styles.modalOverlay} onClick={() => setSelectedProjet(null)}>
                    <section style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <div>
                                <span style={styles.modalEyebrow}>Projet #{selectedProjet.id}</span>
                                <h2 style={styles.modalTitle}>{selectedProjet.titre}</h2>
                                <p style={styles.modalSubtitle}>
                                    {selectedProjet.clientNom || `Client #${selectedProjet.clientId ?? "-"}`} · {selectedProjet.serviceTitre || "Service non défini"}
                                </p>
                            </div>
                            <button style={styles.closeButton} onClick={() => setSelectedProjet(null)}>×</button>
                        </div>

                        <div style={styles.modalMeta}>
                            <div><span style={styles.modalLabel}>Client</span><strong>{selectedProjet.clientNom || `#${selectedProjet.clientId ?? "-"}`}</strong></div>
                            <div><span style={styles.modalLabel}>Demande liée</span><strong>{selectedProjet.demandeObjet || `#${selectedProjet.demandeId ?? "-"}`}</strong></div>
                            <div><span style={styles.modalLabel}>Statut</span><strong>{statusLabels[selectedProjet.statut]}</strong></div>
                            <div><span style={styles.modalLabel}>Date fin</span><strong>{formatDate(selectedProjet.dateFin)}</strong></div>
                        </div>

                        <div style={styles.modalBody}>
                            <div style={styles.descriptionPanel}>
                                <span style={styles.modalLabel}>Description</span>
                                <p style={styles.fullDescription}>{selectedProjet.description || "Aucune description."}</p>
                                <span style={styles.dateText}>Début : {formatDate(selectedProjet.dateDebut)}</span>
                            </div>
                        </div>

                        <div style={styles.modalFooter}>
                            <button style={styles.editButton} onClick={() => openEditModal(selectedProjet)}>Modifier</button>
                            <button style={styles.deleteButton} onClick={() => void deleteProjet(selectedProjet)}>Supprimer</button>
                        </div>
                    </section>
                </div>
            )}

            {/* Modal création/édition – gardée pragmatique mais avec touches Demandes */}
            {showCreateModal && (
                <div style={styles.modalOverlay} onClick={closeFormModal}>
                    <form style={styles.modalCard} onSubmit={(e) => void saveProjet(e)} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <div>
                                <span style={styles.modalEyebrow}>{editingProjet ? "Modification" : "Création"}</span>
                                <h2 style={styles.modalTitle}>{editingProjet ? "Modifier le projet" : "Nouveau projet"}</h2>
                            </div>
                            <button type="button" style={styles.closeButton} onClick={closeFormModal}>×</button>
                        </div>

                        <div style={styles.formGrid}>
                            <label style={styles.fieldLabel}>Demande validée
                                <select required style={styles.formControl} value={form.demandeId} onChange={(e) => handleDemandeChange(e.target.value)}>
                                    <option value="">Choisir une demande</option>
                                    {editingProjet?.demandeId && (
                                        <option value={editingProjet.demandeId}>{editingProjet.demandeObjet || `Demande #${editingProjet.demandeId}`}</option>
                                    )}
                                     {demandesForSelect.length === 0 && (
                                        <option value="" disabled>Aucune demande disponible</option>
                                    )}
                                    {demandesForSelect.map(d => {
                                        const alreadyLinked = linkedDemandeIds.has(d.id);
                                        if (alreadyLinked) {
                                            return (
                                                <option key={d.id} value={d.id} disabled>
                                                    #{d.id} - {d.objet || "Demande sans objet"} - deja liee a un projet
                                                </option>
                                            );
                                        }
                                        return (
                                        <option key={d.id} value={d.id}>{d.objet} — {d.clientNom || `Client #${d.clientId}`}</option>
                                        );
                                    })}
                                </select>
                            </label>
                            <label style={styles.fieldLabel}>Client
                                <select required style={styles.formControl} value={form.clientId} onChange={(e) => setForm(prev => ({ ...prev, clientId: e.target.value }))}>
                                    <option value="">Choisir un client</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.nom} — #{c.id}</option>)}
                                </select>
                            </label>
                            <label style={styles.fieldLabel}>Titre
                                <input required style={styles.formControl} value={form.titre} onChange={(e) => setForm(prev => ({ ...prev, titre: e.target.value }))} />
                            </label>
                            <label style={styles.fieldLabel}>Statut
                                <select style={styles.formControl} value={form.statut} onChange={(e) => setForm(prev => ({ ...prev, statut: e.target.value as ProjetStatus }))}>
                                    <option value="EN_COURS">En cours</option>
                                    <option value="TERMINE">Terminé</option>
                                    <option value="SUSPENDU">Suspendu</option>
                                </select>
                            </label>
                            <label style={{ ...styles.fieldLabel, gridColumn: "1 / -1" }}>Description
                                <textarea rows={4} style={{ ...styles.formControl, resize: "vertical" }} value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} />
                            </label>
                            <label style={styles.fieldLabel}>Date fin
                                <input type="date" style={styles.formControl} value={form.dateFin} onChange={(e) => setForm(prev => ({ ...prev, dateFin: e.target.value }))} />
                            </label>
                        </div>

                        <div style={styles.modalFooter}>
                            <button type="button" style={styles.cancelButton} onClick={closeFormModal}>Annuler</button>
                            <button type="submit" style={styles.primaryButton} disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</button>
                        </div>
                    </form>
                </div>
            )}
        </Layout>
    );
}

const styles: Record<string, CSSProperties> = {
    page: { display: "flex", flexDirection: "column", gap: 18, paddingBottom: 28 },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, marginBottom: 4 },
    eyebrow: { display: "block", color: SOMAP_BLUE, fontSize: 11, fontWeight: 800, letterSpacing: 1.1, marginBottom: 6 },
    title: { margin: 0, fontSize: 32, lineHeight: 1.1, color: TEXT },
    subtitle: { marginTop: 6, color: MUTED, fontSize: 13 },
    headerBadge: { height: 42, borderRadius: 12, background: SOMAP_BLUE, color: "#fff", padding: "0 12px", display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0 },
    headerButton: { background: "none", border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },
    errorBox: { display: "flex", alignItems: "center", gap: 8, background: "rgba(173,35,36,0.08)", border: "1px solid rgba(173,35,36,0.18)", color: "#8f1f20", borderRadius: 14, padding: "12px 14px", fontSize: 13, fontWeight: 700 },
    successBox: { display: "flex", alignItems: "center", gap: 8, background: "rgba(126,201,51,0.12)", border: "1px solid rgba(126,201,51,0.25)", color: "#2f7d32", borderRadius: 14, padding: "12px 14px", fontSize: 13, fontWeight: 700 },
    statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, minmax(130px, 1fr))", gap: 14 },
    statCard: { background: "#fff", border: "1px solid #e5edf5", borderRadius: 16, padding: 16, display: "flex", alignItems: "center", gap: 12 },
    statIcon: { width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    statLabel: { margin: 0, color: MUTED, fontSize: 12, fontWeight: 600 },
    statValue: { display: "block", color: TEXT, fontSize: 22, lineHeight: 1.1, marginTop: 2 },
    statHelper: { margin: "3px 0 0", color: "#91a1b2", fontSize: 11 },
    toolbar: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
    searchBox: { flex: "1 1 280px", height: 44, background: "#fff", border: "1px solid #dfe9f3", borderRadius: 12, display: "flex", alignItems: "center", gap: 8, padding: "0 14px" },
    searchIcon: { color: SOMAP_BLUE, fontSize: 19, fontWeight: 900, flexShrink: 0 },
    searchInput: { flex: 1, border: "none", outline: "none", fontSize: 13, color: TEXT, background: "transparent", fontFamily: "inherit" },
    clearButton: { border: "none", background: "transparent", color: MUTED, fontSize: 18, cursor: "pointer", lineHeight: 1 },
    filters: { display: "flex", gap: 8, flexWrap: "wrap" },
    filterButton: { border: "1px solid #dfe9f3", background: "#fff", color: MUTED, height: 38, padding: "0 13px", borderRadius: 999, fontWeight: 700, cursor: "pointer", fontSize: 12, fontFamily: "inherit" },
    filterButtonActive: { background: "rgba(18,113,184,0.10)", color: SOMAP_BLUE, borderColor: "rgba(18,113,184,0.22)" },
    tableCard: { background: "#fff", border: "1px solid #e5edf5", borderRadius: 18, overflow: "hidden" },
    tableHeader: { padding: "16px 20px", borderBottom: "1px solid #edf2f7", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
    sectionTitle: { margin: 0, color: TEXT, fontSize: 16, fontWeight: 600 },
    sectionSubtitle: { margin: "3px 0 0", color: MUTED, fontSize: 12 },
    countBadge: { background: "rgba(126,201,51,0.16)", color: "#3f8619", fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "5px 10px" },
    row: { display: "grid", gridTemplateColumns: "minmax(250px, 1.7fr) minmax(120px, 0.8fr) minmax(150px, 0.9fr) minmax(92px, 0.55fr) minmax(130px, 0.8fr) minmax(160px, 0.9fr)", gap: 14, alignItems: "center", padding: "13px 20px", borderBottom: "1px solid #edf2f7" },
    headRow: { background: "#f8fbff", color: "#7890a8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, paddingTop: 11, paddingBottom: 11 },
    demandeCell: { display: "flex", alignItems: "center", gap: 11, minWidth: 0 },
    demandeIcon: { width: 10, height: 42, borderRadius: 999, boxShadow: "0 0 0 4px rgba(18,113,184,0.06)", flexShrink: 0 },
    demandeTitle: { display: "block", color: TEXT, fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    demandeDescription: { margin: "3px 0 0", color: MUTED, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    dateText: { display: "block", marginTop: 4, color: "#96a6b7", fontSize: 11, fontWeight: 700 },
    primaryText: { color: TEXT, fontSize: 13, fontWeight: 700 },
    secondaryText: { color: MUTED, fontSize: 12, fontWeight: 700 },
    statusBadge: { justifySelf: "start", border: "1px solid", borderRadius: 999, padding: "5px 10px", fontSize: 11, fontWeight: 800 },
    actionCell: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
    detailsButton: { border: "1px solid rgba(18,113,184,0.22)", background: "rgba(18,113,184,0.08)", color: SOMAP_BLUE, height: 32, padding: "0 11px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" },
    editButton: { border: "1px solid rgba(126,201,51,0.28)", background: "rgba(126,201,51,0.14)", color: "#3f8619", height: 32, padding: "0 11px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer" },
    deleteButton: { border: "1px solid rgba(173,35,36,0.22)", background: "rgba(173,35,36,0.08)", color: SOMAP_RED, height: 32, padding: "0 11px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer" },
    emptyState: { padding: "48px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, color: MUTED, fontSize: 14 },
    resetButton: { border: "none", background: "rgba(18,113,184,0.10)", color: SOMAP_BLUE, padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" },
    modalOverlay: { position: "fixed", inset: 0, zIndex: 20, background: "rgba(10,24,44,0.42)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
    modalCard: { width: "min(820px, 100%)", maxHeight: "84dvh", overflowY: "auto", background: "#fff", border: "1px solid #dfe9f3", borderRadius: 16, boxShadow: "0 24px 70px rgba(13,45,94,0.22)" },
    modalHeader: { padding: "22px 24px", background: `linear-gradient(135deg, ${SOMAP_BLUE}, #0f5d98 58%, ${SOMAP_GREEN})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18 },
    modalEyebrow: { display: "block", fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, opacity: 0.78, marginBottom: 5 },
    modalTitle: { margin: 0, color: "#fff", fontSize: 22, lineHeight: 1.15 },
    modalSubtitle: { margin: "6px 0 0", color: "rgba(255,255,255,0.84)", fontSize: 13, fontWeight: 700 },
    closeButton: { width: 34, height: 34, borderRadius: 8, border: "1px solid rgba(255,255,255,0.28)", background: "rgba(255,255,255,0.16)", color: "#fff", fontSize: 22, lineHeight: 1, cursor: "pointer" },
    modalMeta: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, padding: "18px 20px", borderBottom: "1px solid #edf2f7", background: "#f8fbff" },
    modalLabel: { display: "block", color: MUTED, fontSize: 11, fontWeight: 800, textTransform: "uppercase", marginBottom: 5 },
    modalBody: { display: "grid", gridTemplateColumns: "1fr", gap: 16, padding: 20 },
    descriptionPanel: { border: "1px solid #e5edf5", borderRadius: 14, padding: 16, background: "#fbfdff", minHeight: 180 },
    fullDescription: { margin: "8px 0 0", color: TEXT, fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap" },
    modalFooter: { padding: "0 20px 20px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, flexWrap: "wrap" },
    formGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14, padding: "0 20px 20px" },
    fieldLabel: { display: "flex", flexDirection: "column", gap: 7, color: TEXT, fontSize: 12, fontWeight: 900 },
    formControl: { minHeight: 42, border: "1px solid #dfe9f3", borderRadius: 11, padding: "0 12px", color: TEXT, fontWeight: 700, outline: "none", fontFamily: "inherit" },
    cancelButton: { border: "1px solid #dfe9f3", background: "#fff", color: MUTED, minHeight: 40, padding: "0 16px", borderRadius: 10, cursor: "pointer", fontWeight: 900 },
    primaryButton: { border: "none", background: `linear-gradient(135deg, ${SOMAP_GREEN}, #5eb81f)`, color: "#fff", minHeight: 40, padding: "0 16px", borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 },
};
