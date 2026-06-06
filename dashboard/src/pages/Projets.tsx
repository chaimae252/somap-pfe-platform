import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import SyncOutlinedIcon from "@mui/icons-material/SyncOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import PauseCircleOutlineOutlinedIcon from "@mui/icons-material/PauseCircleOutlineOutlined";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Layout from "../components/Layout";
import api, { API_ORIGIN } from "../api/api";

const SOMAP_BLUE = "#1271b8";
const SOMAP_GREEN = "#7EC933";
const SOMAP_RED = "#ad2324";
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
    adminId?: number;
    adminNom?: string;
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
    images?: Array<{
        id: number;
        imageUrl: string;
    }>;
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

function getImageUrl(imageUrl: string) {
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
        return imageUrl;
    }
    return `${API_ORIGIN}${imageUrl}`;
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
    const [confirmDeleteProjet, setConfirmDeleteProjet] = useState<Projet | null>(null);
    const [deletingProjetId, setDeletingProjetId] = useState<number | null>(null);

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

    const associatedDemande = useMemo(() => {
        if (!selectedProjet || !selectedProjet.demandeId) return null;
        return demandes.find((d) => d.id === selectedProjet.demandeId);
    }, [selectedProjet, demandes]);

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

    const handleDeleteProjet = async () => {
        if (!confirmDeleteProjet) return;
        setDeletingProjetId(confirmDeleteProjet.id);
        setError("");
        setSuccess("");
        try {
            await api.delete(`/projets/${confirmDeleteProjet.id}`);
            setProjets(items => items.filter(p => p.id !== confirmDeleteProjet.id));
            setSelectedProjet(cur => cur?.id === confirmDeleteProjet.id ? null : cur);
            setSuccess("Projet supprimé.");
            setConfirmDeleteProjet(null);
        } catch (err) {
            setError(getErrorMessage(err, "Impossible de supprimer."));
        } finally {
            setDeletingProjetId(null);
        }
    };

    const updateProjetStatus = async (projet: Projet, newStatus: ProjetStatus) => {
        setError("");
        setSuccess("");
        try {
            const payload = {
                titre: projet.titre,
                description: projet.description || "",
                statut: newStatus,
                dateDebut: projet.dateDebut ? projet.dateDebut.slice(0, 19) : null,
                dateFin: projet.dateFin ? projet.dateFin.slice(0, 19) : null,
                clientId: projet.clientId,
                demandeId: projet.demandeId,
            };
            const response = await api.put<Projet>(`/projets/${projet.id}`, payload);
            setProjets(items => items.map(p => p.id === projet.id ? response.data : p));
            setSelectedProjet(response.data);
            setSuccess(`Statut du projet "${projet.titre}" mis à jour.`);
        } catch (err) {
            setError(getErrorMessage(err, "Impossible de mettre à jour le statut."));
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
                    <button style={styles.headerButton} onClick={openCreateModal}>
                        <AddCircleOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                        Nouveau projet
                    </button>
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
                            <div key={stat.label} style={stat.label === "Suspendus" ? { ...styles.statCard, borderLeft: `4px solid ${SOMAP_RED}` } : stat.label === "Terminés" ? { ...styles.statCard, borderLeft: `4px solid ${SOMAP_GREEN}` } : stat.label === "En cours" ? { ...styles.statCard, borderLeft: `4px solid ${SOMAP_BLUE}` } : styles.statCard}>
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
                                        <div style={{ ...styles.demandeIconBox, color: tone.color, background: tone.background }}>
                                            <WorkOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <strong style={styles.demandeTitle}>{projet.titre}</strong>
                                            <p style={styles.demandeDescription}>{projet.description || "Aucune description."}</p>
                                            {projet.serviceTitre && <span style={styles.dateText}>{projet.serviceTitre}</span>}
                                        </div>
                                    </div>
                                    <span style={styles.primaryText}>{projet.clientNom || `Client #${projet.clientId ?? "-"}`}</span>
                                    <span style={styles.secondaryText}>{projet.demandeObjet || `Demande #${projet.demandeId ?? "-"}`}</span>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                                        <span style={{ ...styles.statusBadge, color: tone.color, background: tone.background, borderColor: tone.border }}>
                                            {statusLabels[projet.statut]}
                                        </span>
                                        {projet.adminNom && (
                                            <span style={{ fontSize: 10, color: MUTED, fontWeight: 700, paddingLeft: 4 }}>
                                                par: {projet.adminNom}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                        <span style={styles.primaryText}>{formatDate(projet.dateDebut)}</span>
                                        <span style={styles.dateFinLabel}>Fin: {formatDate(projet.dateFin)}</span>
                                    </div>
                                    <div style={styles.actionCell}>
                                        <button style={styles.detailsButton} onClick={() => setSelectedProjet(projet)} title="Détails">
                                            <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                                        </button>
                                        <button style={styles.editButton} onClick={() => openEditModal(projet)} title="Modifier">
                                            <EditOutlinedIcon sx={{ fontSize: 16 }} />
                                        </button>
                                        <button style={styles.deleteButton} onClick={() => setConfirmDeleteProjet(projet)} title="Supprimer">
                                            <DeleteOutlineOutlinedIcon sx={{ fontSize: 16 }} />
                                        </button>
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
                                    {selectedProjet.serviceTitre || "Service industriel"}
                                </p>
                            </div>
                            <button style={styles.closeButton} onClick={() => setSelectedProjet(null)}>×</button>
                        </div>

                        <div style={{ ...styles.modalMeta, gridTemplateColumns: selectedProjet.adminNom ? "repeat(5, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))" }}>
                            <div>
                                <span style={styles.modalLabel}>Client</span>
                                <strong>{selectedProjet.clientNom || `Client #${selectedProjet.clientId ?? "-"}`}</strong>
                            </div>
                            <div>
                                <span style={styles.modalLabel}>Demande d'origine</span>
                                <strong>{selectedProjet.demandeObjet || `Demande #${selectedProjet.demandeId ?? "-"}`}</strong>
                            </div>
                            <div>
                                <span style={styles.modalLabel}>Statut du Projet</span>
                                <strong>{statusLabels[selectedProjet.statut]}</strong>
                            </div>
                            <div>
                                <span style={styles.modalLabel}>Date de fin prévue</span>
                                <strong>{formatDate(selectedProjet.dateFin)}</strong>
                            </div>
                            {selectedProjet.adminNom && (
                                <div>
                                    <span style={styles.modalLabel}>Assigné / Créé par</span>
                                    <strong>{selectedProjet.adminNom}</strong>
                                </div>
                            )}
                        </div>

                        <div style={styles.modalBody}>
                            <div style={styles.descriptionPanel}>
                                <span style={styles.modalLabel}>Description du Projet</span>
                                <p style={styles.fullDescription}>{selectedProjet.description || "Aucune description fournie pour ce projet."}</p>
                                <span style={styles.dateText}>Débuté le : {formatDate(selectedProjet.dateDebut)}</span>
                            </div>

                            <div style={styles.imagesPanel}>
                                <div style={styles.imagesHeader}>
                                    <span style={styles.modalLabel}>Photos de la Demande Associée</span>
                                    <strong>{formatNumber(associatedDemande?.images?.length ?? 0)}</strong>
                                </div>
                                {associatedDemande?.images?.length ? (
                                    <div style={styles.imageGrid}>
                                        {associatedDemande.images.map((image) => (
                                            <img
                                                key={image.id}
                                                src={getImageUrl(image.imageUrl)}
                                                alt={selectedProjet.titre || "Image demande"}
                                                style={styles.demandeImage}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div style={styles.noImages}>Aucune photo jointe à la demande.</div>
                                )}
                            </div>
                        </div>

                        <div style={{ ...styles.modalFooter, borderTop: "1px solid #edf2f7", paddingTop: 16 }}>
                            <div style={{ display: "flex", gap: 8, marginRight: "auto" }}>
                                {selectedProjet.statut === "EN_COURS" && (
                                    <>
                                        <button
                                            style={styles.modalValidateButton}
                                            onClick={() => void updateProjetStatus(selectedProjet, "TERMINE")}
                                        >
                                            <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 15 }} />
                                            Terminer le projet
                                        </button>
                                        <button
                                            style={styles.modalSuspendButton}
                                            onClick={() => void updateProjetStatus(selectedProjet, "SUSPENDU")}
                                        >
                                            <PauseCircleOutlineOutlinedIcon sx={{ fontSize: 15 }} />
                                            Suspendre
                                        </button>
                                    </>
                                )}
                                {selectedProjet.statut === "SUSPENDU" && (
                                    <>
                                        <button
                                            style={styles.modalResumeButton}
                                            onClick={() => void updateProjetStatus(selectedProjet, "EN_COURS")}
                                        >
                                            <SyncOutlinedIcon sx={{ fontSize: 15 }} />
                                            Reprendre le projet
                                        </button>
                                        <button
                                            style={styles.modalValidateButton}
                                            onClick={() => void updateProjetStatus(selectedProjet, "TERMINE")}
                                        >
                                            <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 15 }} />
                                            Terminer le projet
                                        </button>
                                    </>
                                )}
                                {selectedProjet.statut === "TERMINE" && (
                                    <button
                                        style={styles.modalResumeButton}
                                        onClick={() => void updateProjetStatus(selectedProjet, "EN_COURS")}
                                    >
                                        <SyncOutlinedIcon sx={{ fontSize: 15 }} />
                                        Reprendre le projet
                                    </button>
                                )}
                            </div>

                            <div style={{ display: "flex", gap: 8 }}>
                                <button style={styles.modalEditButton} onClick={() => openEditModal(selectedProjet)} title="Modifier">
                                    <EditOutlinedIcon sx={{ fontSize: 14 }} />
                                    Modifier
                                </button>
                                <button style={styles.modalDeleteButton} onClick={() => setConfirmDeleteProjet(selectedProjet)} title="Supprimer">
                                    <DeleteOutlineOutlinedIcon sx={{ fontSize: 14 }} />
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {/* Modal création/édition */}
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

                        <div style={{ ...styles.formGrid, marginTop: 20 }}>
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
                                <textarea rows={4} style={{ ...styles.formControl, height: "auto", padding: "10px 12px", resize: "vertical" }} value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} />
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

            {confirmDeleteProjet && (
                <div style={styles.modalOverlay} onClick={() => setConfirmDeleteProjet(null)}>
                    <section style={styles.confirmCard} onClick={(event) => event.stopPropagation()}>
                        <h2 style={styles.confirmTitle}>Supprimer ce projet ?</h2>
                        <p style={styles.confirmText}>
                            Cette action supprimera définitivement le projet "{confirmDeleteProjet.titre}" de la liste.
                        </p>
                        <div style={styles.confirmActions}>
                            <button
                                style={styles.cancelButton}
                                onClick={() => setConfirmDeleteProjet(null)}
                                disabled={deletingProjetId === confirmDeleteProjet.id}
                            >
                                Annuler
                            </button>
                            <button
                                style={styles.confirmDeleteButton}
                                onClick={() => void handleDeleteProjet()}
                                disabled={deletingProjetId === confirmDeleteProjet.id}
                            >
                                {deletingProjetId === confirmDeleteProjet.id ? "Suppression..." : "Oui, supprimer"}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </Layout>
    );
}

const styles: Record<string, CSSProperties> = {
    page: { display: "flex", flexDirection: "column", gap: 18, paddingBottom: 28, fontFamily: "'Segoe UI', system-ui, sans-serif" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, marginBottom: 4 },
    eyebrow: { display: "block", color: SOMAP_BLUE, fontSize: 11, fontWeight: 800, letterSpacing: 1.1, marginBottom: 6 },
    title: { margin: 0, fontSize: 32, lineHeight: 1.1, background: "linear-gradient(135deg, #1271b8 0%, #7ec933 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "inline-block", fontWeight: 800 },
    subtitle: { marginTop: 6, color: MUTED, fontSize: 13 },
    headerButton: { height: 42, borderRadius: 12, background: SOMAP_BLUE, color: "#fff", padding: "0 16px", display: "inline-flex", alignItems: "center", gap: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "opacity 0.15s ease", fontFamily: "'Segoe UI', system-ui, sans-serif" },
    errorBox: { display: "flex", alignItems: "center", gap: 8, background: "rgba(173,35,36,0.08)", border: "1px solid rgba(173,35,36,0.18)", color: "#8f1f20", borderRadius: 14, padding: "12px 14px", fontSize: 13, fontWeight: 700 },
    successBox: { display: "flex", alignItems: "center", gap: 8, background: "rgba(126,201,51,0.12)", border: "1px solid rgba(126,201,51,0.25)", color: "#2f7d32", borderRadius: 14, padding: "12px 14px", fontSize: 13, fontWeight: 700 },
    statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, minmax(130px, 1fr))", gap: 14 },
    statCard: { background: "#fff", border: "1px solid #e5edf5", borderRadius: 16, padding: 16, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 4px 12px rgba(18,113,184,0.02)" },
    statIcon: { width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    statLabel: { margin: 0, color: MUTED, fontSize: 12, fontWeight: 600 },
    statValue: { display: "block", color: TEXT, fontSize: 22, lineHeight: 1.1, marginTop: 2, fontWeight: 800 },
    statHelper: { margin: "3px 0 0", color: "#91a1b2", fontSize: 11 },
    toolbar: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
    searchBox: { flex: "1 1 280px", height: 44, background: "#fff", border: "1px solid #dfe9f3", borderRadius: 12, display: "flex", alignItems: "center", gap: 8, padding: "0 14px" },
    searchIcon: { color: SOMAP_BLUE, fontSize: 19, fontWeight: 900, flexShrink: 0 },
    searchInput: { flex: 1, border: "none", outline: "none", fontSize: 13, color: TEXT, background: "transparent", fontFamily: "inherit" },
    clearButton: { border: "none", background: "transparent", color: MUTED, fontSize: 18, cursor: "pointer", lineHeight: 1 },
    filters: { display: "flex", gap: 8, flexWrap: "wrap" },
    filterButton: { border: "1px solid #dfe9f3", background: "#fff", color: MUTED, height: 38, padding: "0 13px", borderRadius: 999, fontWeight: 700, cursor: "pointer", fontSize: 12, fontFamily: "inherit", transition: "all 0.15s ease" },
    filterButtonActive: { background: "rgba(18,113,184,0.10)", color: SOMAP_BLUE, borderColor: "rgba(18,113,184,0.22)" },
    tableCard: { background: "#fff", border: "1px solid #e5edf5", borderRadius: 18, overflow: "hidden", boxShadow: "0 8px 24px rgba(18,113,184,0.03)" },
    tableHeader: { padding: "16px 20px", borderBottom: "1px solid #edf2f7", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
    sectionTitle: { margin: 0, color: TEXT, fontSize: 16, fontWeight: 700 },
    sectionSubtitle: { margin: "3px 0 0", color: MUTED, fontSize: 12 },
    countBadge: { background: "rgba(126,201,51,0.16)", color: "#3f8619", fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "5px 10px" },
    row: { display: "grid", gridTemplateColumns: "minmax(250px, 1.7fr) minmax(120px, 0.8fr) minmax(150px, 0.9fr) minmax(92px, 0.55fr) minmax(130px, 0.8fr) minmax(130px, 0.6fr)", gap: 14, alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #edf2f7" },
    headRow: { background: "#f8fbff", color: "#7890a8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, paddingTop: 11, paddingBottom: 11 },
    demandeCell: { display: "flex", alignItems: "center", gap: 11, minWidth: 0 },
    demandeIconBox: { width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    demandeTitle: { display: "block", color: TEXT, fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    demandeDescription: { margin: "3px 0 0", color: MUTED, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    dateText: { display: "block", marginTop: 4, color: "#96a6b7", fontSize: 11, fontWeight: 700 },
    primaryText: { color: TEXT, fontSize: 13, fontWeight: 700 },
    secondaryText: { color: MUTED, fontSize: 12, fontWeight: 700 },
    dateFinLabel: { display: "block", color: MUTED, fontSize: 11, fontWeight: 600 },
    statusBadge: { justifySelf: "start", border: "1px solid", borderRadius: 999, padding: "5px 10px", fontSize: 11, fontWeight: 800 },
    actionCell: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" },
    detailsButton: { border: "1px solid rgba(18,113,184,0.22)", background: "rgba(18,113,184,0.08)", color: SOMAP_BLUE, width: 34, height: 34, borderRadius: 8, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s ease" },
    editButton: { border: "1px solid rgba(126,201,51,0.28)", background: "rgba(126,201,51,0.14)", color: "#3f8619", width: 34, height: 34, borderRadius: 8, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s ease" },
    deleteButton: { border: "1px solid rgba(173,35,36,0.22)", background: "rgba(173,35,36,0.08)", color: SOMAP_RED, width: 34, height: 34, borderRadius: 8, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s ease" },
    emptyState: { padding: "48px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, color: MUTED, fontSize: 14 },
    resetButton: { border: "none", background: "rgba(18,113,184,0.10)", color: SOMAP_BLUE, padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" },
    modalOverlay: { position: "fixed", inset: 0, zIndex: 20, background: "rgba(10,24,44,0.42)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
    modalCard: { width: "min(820px, 100%)", maxHeight: "84dvh", overflowY: "auto", background: "#fff", border: "1px solid #dfe9f3", borderRadius: 16, boxShadow: "0 24px 70px rgba(13,45,94,0.22)", fontFamily: "'Segoe UI', system-ui, sans-serif" },
    modalHeader: { padding: "22px 24px", background: `linear-gradient(135deg, ${SOMAP_BLUE}, #0f5d98 58%, ${SOMAP_GREEN})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18 },
    modalEyebrow: { display: "block", fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, opacity: 0.78, marginBottom: 5 },
    modalTitle: { margin: 0, color: "#fff", fontSize: 22, lineHeight: 1.15, fontWeight: 800 },
    modalSubtitle: { margin: "6px 0 0", color: "rgba(255,255,255,0.84)", fontSize: 13, fontWeight: 700 },
    closeButton: { width: 34, height: 34, borderRadius: 8, border: "1px solid rgba(255,255,255,0.28)", background: "rgba(255,255,255,0.16)", color: "#fff", fontSize: 22, lineHeight: 1, cursor: "pointer" },
    modalMeta: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, padding: "18px 20px", borderBottom: "1px solid #edf2f7", background: "#f8fbff" },
    modalLabel: { display: "block", color: MUTED, fontSize: 11, fontWeight: 800, textTransform: "uppercase", marginBottom: 5, letterSpacing: 0.5 },
    modalBody: { display: "grid", gridTemplateColumns: "1fr", gap: 16, padding: 20 },
    sidebarValue: { display: "block", fontSize: 13, color: TEXT, marginTop: 4, fontWeight: 700 },
    descriptionPanel: { border: "1px solid #e5edf5", borderRadius: 14, padding: 16, background: "#fbfdff", minHeight: 100 },
    fullDescription: { margin: "8px 0 0", color: TEXT, fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap" },
    modalFooter: { padding: "0 20px 20px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, flexWrap: "wrap" },
    formGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14, padding: "0 20px 20px" },
    fieldLabel: { display: "flex", flexDirection: "column", gap: 7, color: TEXT, fontSize: 12, fontWeight: 900 },
    formControl: { minHeight: 42, border: "1px solid #dfe9f3", borderRadius: 11, padding: "0 12px", color: TEXT, fontWeight: 700, outline: "none", fontFamily: "inherit" },
    cancelButton: { border: "1px solid #dfe9f3", background: "#fff", color: MUTED, minHeight: 40, padding: "0 16px", borderRadius: 10, cursor: "pointer", fontWeight: 900, fontFamily: "inherit" },
    primaryButton: { border: "none", background: `linear-gradient(135deg, ${SOMAP_GREEN}, #5eb81f)`, color: "#fff", minHeight: 40, padding: "0 16px", borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "inherit" },
    imagesPanel: { marginTop: 14, border: "1px solid #e5edf5", borderRadius: 14, padding: 16, background: "#fbfdff" },
    imagesHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    imageGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 },
    demandeImage: { width: "100%", aspectRatio: "1.5", objectFit: "cover", borderRadius: 10, border: "1px solid #edf2f7", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" },
    noImages: { color: MUTED, fontSize: 12, fontWeight: 600, textAlign: "center", padding: "24px 0" },
    modalEditButton: { border: "1px solid rgba(126,201,51,0.28)", background: "rgba(126,201,51,0.14)", color: "#3f8619", height: 36, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit" },
    modalDeleteButton: { border: "1px solid rgba(173,35,36,0.22)", background: "rgba(173,35,36,0.08)", color: SOMAP_RED, height: 36, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit" },
    modalValidateButton: { border: "1px solid rgba(126,201,51,0.28)", background: "rgba(126,201,51,0.14)", color: "#3f8619", height: 36, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit" },
    modalSuspendButton: { border: "1px solid rgba(173,35,36,0.22)", background: "rgba(173,35,36,0.08)", color: SOMAP_RED, height: 36, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit" },
    modalResumeButton: { border: "1px solid rgba(18,113,184,0.22)", background: "rgba(18,113,184,0.08)", color: SOMAP_BLUE, height: 36, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit" },
    confirmCard: {
        width: "min(420px, 100%)",
        background: "#fff",
        border: "1px solid #dfe9f3",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 24px 70px rgba(13,45,94,0.22)",
    },
    confirmTitle: { margin: 0, color: TEXT, fontSize: 18, fontWeight: 700 },
    confirmText: { margin: "10px 0 0", color: MUTED, fontSize: 13, lineHeight: 1.5 },
    confirmActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 18,
    },
    confirmDeleteButton: {
        border: "none",
        background: SOMAP_RED,
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
