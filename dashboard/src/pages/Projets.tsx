import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import SyncOutlinedIcon from "@mui/icons-material/SyncOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import PauseCircleOutlineOutlinedIcon from "@mui/icons-material/PauseCircleOutlineOutlined";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import Layout from "../components/Layout";
import api from "../api/api";

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
};

type Client = {
    id: number;
    nom: string;
    email?: string;
};

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
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("fr-MA", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}

function toDateInput(value?: string) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
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
        const timer = window.setTimeout(() => {
            void loadData();
        }, 0);

        return () => window.clearTimeout(timer);
    }, []);

    const projetStats = useMemo(() => {
        const total = projets.length;
        const inProgress = projets.filter((projet) => projet.statut === "EN_COURS").length;
        const completed = projets.filter((projet) => projet.statut === "TERMINE").length;
        const suspended = projets.filter((projet) => projet.statut === "SUSPENDU").length;

        return { total, inProgress, completed, suspended };
    }, [projets]);

    const filteredProjets = useMemo(() => {
        const query = search.trim().toLowerCase();

        return projets.filter((projet) => {
            const matchesStatus = statusFilter === "TOUS" || projet.statut === statusFilter;
            const matchesSearch = !query || [
                projet.titre,
                projet.description,
                projet.clientNom,
                projet.demandeObjet,
                projet.serviceTitre,
                projet.clientId?.toString(),
                projet.demandeId?.toString(),
            ].some((value) => value?.toLowerCase().includes(query));

            return matchesStatus && matchesSearch;
        });
    }, [projets, search, statusFilter]);

    const availableDemandes = useMemo(() => {
        const usedDemandeIds = new Set(
            projets
                .filter((projet) => !editingProjet || projet.id !== editingProjet.id)
                .map((projet) => projet.demandeId)
                .filter(Boolean)
        );

        return demandes.filter((demande) => demande.statut === "VALIDEE" && !usedDemandeIds.has(demande.id));
    }, [demandes, editingProjet, projets]);

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
        const selectedDemande = demandes.find((demande) => demande.id === Number(demandeId));

        setForm((current) => ({
            ...current,
            demandeId,
            clientId: selectedDemande?.clientId?.toString() ?? current.clientId,
            titre: current.titre || selectedDemande?.objet || "",
            description: current.description || selectedDemande?.description || "",
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

            setProjets((items) => editingProjet
                ? items.map((projet) => (projet.id === editingProjet.id ? response.data : projet))
                : [response.data, ...items]
            );
            setSelectedProjet((current) => (current?.id === response.data.id ? response.data : current));
            setSuccess(editingProjet ? "Projet mis à jour avec succès." : "Projet créé avec succès.");
            closeFormModal();
        } catch (err) {
            setError(getErrorMessage(err, "Impossible d'enregistrer le projet."));
        } finally {
            setSaving(false);
        }
    };

    const deleteProjet = async (projet: Projet) => {
        const confirmed = window.confirm(`Supprimer le projet "${projet.titre}" ?`);
        if (!confirmed) return;

        setError("");
        setSuccess("");

        try {
            await api.delete(`/projets/${projet.id}`);
            setProjets((items) => items.filter((item) => item.id !== projet.id));
            setSelectedProjet((current) => (current?.id === projet.id ? null : current));
            setSuccess("Projet supprimé avec succès.");
        } catch (err) {
            setError(getErrorMessage(err, "Impossible de supprimer le projet."));
        }
    };

    return (
        <Layout>
            <div style={styles.pageShell}>
                <section style={styles.hero}>
                    <div>
                        <span style={styles.eyebrow}>Gestion administrative</span>
                        <h1 style={styles.title}>Projets</h1>
                        <p style={styles.subtitle}>Créez, suivez et mettez à jour les projets validés par les demandes clients.</p>
                    </div>
                    <button style={styles.primaryButton} onClick={openCreateModal}>
                        <AddCircleOutlineOutlinedIcon fontSize="small" /> Nouveau projet
                    </button>
                </section>

                {error && <div style={styles.errorBanner}>{error}</div>}
                {success && <div style={styles.successBanner}>{success}</div>}

                <section style={styles.statsGrid}>
                    {statCards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <article key={card.label} style={styles.statCard}>
                                <div style={{ ...styles.statIcon, color: card.color, background: `${card.color}18` }}>
                                    <Icon fontSize="small" />
                                </div>
                                <div>
                                    <span style={styles.statLabel}>{card.label}</span>
                                    <strong style={styles.statValue}>{formatNumber(card.value)}</strong>
                                    <p style={styles.statHelper}>{card.helper}</p>
                                </div>
                            </article>
                        );
                    })}
                </section>

                <section style={styles.toolbar}>
                    <input
                        style={styles.searchInput}
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Rechercher par titre, client, demande, service..."
                    />
                    <select style={styles.select} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
                        <option value="TOUS">Tous les statuts</option>
                        <option value="EN_COURS">En cours</option>
                        <option value="TERMINE">Terminés</option>
                        <option value="SUSPENDU">Suspendus</option>
                    </select>
                </section>

                <section style={styles.tableCard}>
                    <div style={styles.tableHeader}>
                        <div>
                            <h2 style={styles.sectionTitle}>Liste des projets</h2>
                            <p style={styles.sectionSubtitle}>Vue complète des projets liés aux clients et demandes.</p>
                        </div>
                        <span style={styles.countBadge}>{formatNumber(filteredProjets.length)} affiché(s)</span>
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
                        filteredProjets.map((projet) => {
                            const tone = statusTone[projet.statut];
                            return (
                                <div key={projet.id} style={styles.row}>
                                    <div style={styles.projectCell}>
                                        <span style={{ ...styles.projectIcon, background: tone.color }} />
                                        <div style={styles.truncateWrap}>
                                            <strong style={styles.projectTitle}>{projet.titre}</strong>
                                            <p style={styles.projectDescription}>{projet.description || "Aucune description."}</p>
                                            {projet.serviceTitre && <span style={styles.dateText}>{projet.serviceTitre}</span>}
                                        </div>
                                    </div>
                                    <div>
                                        <span style={styles.primaryText}>{projet.clientNom || `Client #${projet.clientId ?? "-"}`}</span>
                                        <span style={styles.secondaryText}>ID {projet.clientId ?? "-"}</span>
                                    </div>
                                    <div>
                                        <span style={styles.primaryText}>{projet.demandeObjet || `Demande #${projet.demandeId ?? "-"}`}</span>
                                        <span style={styles.secondaryText}>#{projet.demandeId ?? "-"}</span>
                                    </div>
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
                            <WorkOutlineOutlinedIcon />
                            <span>Aucun projet trouvé.</span>
                            <button style={styles.resetButton} onClick={() => { setSearch(""); setStatusFilter("TOUS"); }}>Réinitialiser</button>
                        </div>
                    )}
                </section>
            </div>

            {selectedProjet && (
                <div style={styles.modalBackdrop} onClick={() => setSelectedProjet(null)}>
                    <div style={styles.modalCard} onClick={(event) => event.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <div>
                                <span style={styles.eyebrow}>Projet #{selectedProjet.id}</span>
                                <h2 style={styles.modalTitle}>{selectedProjet.titre}</h2>
                            </div>
                            <button style={styles.closeButton} onClick={() => setSelectedProjet(null)}>×</button>
                        </div>
                        <p style={styles.modalDescription}>{selectedProjet.description || "Aucune description."}</p>
                        <div style={styles.detailsGrid}>
                            <div style={styles.detailBox}><span>Client</span><strong>{selectedProjet.clientNom || `#${selectedProjet.clientId ?? "-"}`}</strong></div>
                            <div style={styles.detailBox}><span>Demande liée</span><strong>{selectedProjet.demandeObjet || `#${selectedProjet.demandeId ?? "-"}`}</strong></div>
                            <div style={styles.detailBox}><span>Service</span><strong>{selectedProjet.serviceTitre || "Non défini"}</strong></div>
                            <div style={styles.detailBox}><span>Statut</span><strong>{statusLabels[selectedProjet.statut]}</strong></div>
                            <div style={styles.detailBox}><span>Date début</span><strong>{formatDate(selectedProjet.dateDebut)}</strong></div>
                            <div style={styles.detailBox}><span>Date fin</span><strong>{formatDate(selectedProjet.dateFin)}</strong></div>
                        </div>
                        <div style={styles.modalActions}>
                            <button style={styles.editButton} onClick={() => openEditModal(selectedProjet)}>Modifier</button>
                            <button style={styles.deleteButton} onClick={() => void deleteProjet(selectedProjet)}>Supprimer</button>
                        </div>
                    </div>
                </div>
            )}

            {showCreateModal && (
                <div style={styles.modalBackdrop} onClick={closeFormModal}>
                    <form style={styles.modalCard} onSubmit={(event) => void saveProjet(event)} onClick={(event) => event.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <div>
                                <span style={styles.eyebrow}>{editingProjet ? "Modification" : "Création"}</span>
                                <h2 style={styles.modalTitle}>{editingProjet ? "Modifier le projet" : "Nouveau projet"}</h2>
                            </div>
                            <button type="button" style={styles.closeButton} onClick={closeFormModal}>×</button>
                        </div>

                        <div style={styles.formGrid}>
                            <label style={styles.fieldLabel}>Demande validée
                                <select required style={styles.formControl} value={form.demandeId} onChange={(event) => handleDemandeChange(event.target.value)}>
                                    <option value="">Choisir une demande</option>
                                    {editingProjet?.demandeId && (
                                        <option value={editingProjet.demandeId}>{editingProjet.demandeObjet || `Demande #${editingProjet.demandeId}`}</option>
                                    )}
                                    {availableDemandes.map((demande) => (
                                        <option key={demande.id} value={demande.id}>{demande.objet} — {demande.clientNom || `Client #${demande.clientId}`}</option>
                                    ))}
                                </select>
                            </label>
                            <label style={styles.fieldLabel}>Client
                                <select required style={styles.formControl} value={form.clientId} onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value }))}>
                                    <option value="">Choisir un client</option>
                                    {clients.map((client) => (
                                        <option key={client.id} value={client.id}>{client.nom} — #{client.id}</option>
                                    ))}
                                </select>
                            </label>
                            <label style={styles.fieldLabel}>Titre
                                <input required style={styles.formControl} value={form.titre} onChange={(event) => setForm((current) => ({ ...current, titre: event.target.value }))} />
                            </label>
                            <label style={styles.fieldLabel}>Statut
                                <select style={styles.formControl} value={form.statut} onChange={(event) => setForm((current) => ({ ...current, statut: event.target.value as ProjetStatus }))}>
                                    <option value="EN_COURS">En cours</option>
                                    <option value="TERMINE">Terminé</option>
                                    <option value="SUSPENDU">Suspendu</option>
                                </select>
                            </label>
                            <label style={{ ...styles.fieldLabel, gridColumn: "1 / -1" }}>Description
                                <textarea required rows={4} style={{ ...styles.formControl, resize: "vertical", height: "auto", paddingTop: 10 }} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
                            </label>
                            <label style={styles.fieldLabel}>Date fin
                                <input type="date" style={styles.formControl} value={form.dateFin} onChange={(event) => setForm((current) => ({ ...current, dateFin: event.target.value }))} />
                            </label>
                        </div>

                        <div style={styles.modalActions}>
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
    pageShell: { display: "flex", flexDirection: "column", gap: 22 },
    hero: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, background: "linear-gradient(135deg, rgba(18,113,184,0.95), rgba(22,156,204,0.88))", color: "#fff", borderRadius: 24, padding: "26px 28px", boxShadow: "0 18px 42px rgba(18,113,184,0.20)" },
    eyebrow: { display: "block", fontSize: 12, textTransform: "uppercase", letterSpacing: 1.4, fontWeight: 800, opacity: 0.78, marginBottom: 6 },
    title: { margin: 0, fontSize: 34, lineHeight: 1.1, fontWeight: 800 },
    subtitle: { margin: "8px 0 0", maxWidth: 680, fontSize: 14, lineHeight: 1.6, opacity: 0.88 },
    statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 },
    statCard: { background: "rgba(255,255,255,0.96)", border: "1px solid #e5edf5", borderRadius: 18, padding: 18, display: "flex", alignItems: "center", gap: 14, boxShadow: "0 14px 32px rgba(18,48,78,0.08)" },
    statIcon: { width: 46, height: 46, borderRadius: 14, display: "grid", placeItems: "center", flexShrink: 0 },
    statLabel: { display: "block", color: MUTED, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.6 },
    statValue: { display: "block", color: TEXT, fontSize: 25, marginTop: 2 },
    statHelper: { margin: "2px 0 0", color: "#91a4b8", fontSize: 12, fontWeight: 700 },
    toolbar: { display: "flex", gap: 12, alignItems: "center", background: "rgba(255,255,255,0.92)", border: "1px solid #e5edf5", borderRadius: 16, padding: 14 },
    searchInput: { flex: 1, height: 42, border: "1px solid #dfe9f3", borderRadius: 12, padding: "0 14px", color: TEXT, outline: "none", fontWeight: 700 },
    select: { height: 42, border: "1px solid #dfe9f3", background: "#fff", color: TEXT, borderRadius: 12, padding: "0 12px", fontWeight: 800, outline: "none" },
    primaryButton: { border: "none", background: `linear-gradient(135deg, ${SOMAP_GREEN}, #5eb81f)`, color: "#fff", minHeight: 42, padding: "0 16px", borderRadius: 12, fontSize: 13, fontWeight: 900, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 12px 22px rgba(94,184,31,0.22)" },
    tableCard: { background: "#fff", border: "1px solid #e5edf5", borderRadius: 18, overflow: "hidden", boxShadow: "0 14px 32px rgba(18,48,78,0.07)" },
    tableHeader: { padding: "16px 20px", borderBottom: "1px solid #edf2f7", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
    sectionTitle: { margin: 0, color: TEXT, fontSize: 16, fontWeight: 700 },
    sectionSubtitle: { margin: "3px 0 0", color: MUTED, fontSize: 12 },
    countBadge: { background: "rgba(126,201,51,0.16)", color: "#3f8619", fontSize: 12, fontWeight: 800, borderRadius: 999, padding: "5px 10px" },
    row: { display: "grid", gridTemplateColumns: "minmax(260px, 1.6fr) minmax(130px, 0.8fr) minmax(150px, 0.9fr) minmax(105px, 0.6fr) minmax(130px, 0.8fr) minmax(210px, 1fr)", gap: 14, alignItems: "center", padding: "13px 20px", borderBottom: "1px solid #edf2f7" },
    headRow: { background: "#f8fbff", color: "#7890a8", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.7, paddingTop: 11, paddingBottom: 11 },
    projectCell: { display: "flex", alignItems: "center", gap: 11, minWidth: 0 },
    projectIcon: { width: 10, height: 42, borderRadius: 999, boxShadow: "0 0 0 4px rgba(18,113,184,0.06)", flexShrink: 0 },
    truncateWrap: { minWidth: 0 },
    projectTitle: { display: "block", color: TEXT, fontSize: 13, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    projectDescription: { margin: "3px 0 0", color: MUTED, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    primaryText: { display: "block", color: TEXT, fontSize: 13, fontWeight: 800 },
    secondaryText: { display: "block", color: MUTED, fontSize: 12, fontWeight: 700, marginTop: 3 },
    dateText: { display: "block", marginTop: 4, color: "#96a6b7", fontSize: 11, fontWeight: 800 },
    statusBadge: { justifySelf: "start", border: "1px solid", borderRadius: 999, padding: "5px 10px", fontSize: 11, fontWeight: 900 },
    actionCell: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
    detailsButton: { border: "1px solid rgba(18,113,184,0.22)", background: "rgba(18,113,184,0.08)", color: SOMAP_BLUE, height: 32, padding: "0 10px", borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: "pointer" },
    editButton: { border: "1px solid rgba(126,201,51,0.28)", background: "rgba(126,201,51,0.14)", color: "#3f8619", height: 32, padding: "0 10px", borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: "pointer" },
    deleteButton: { border: "1px solid rgba(173,35,36,0.22)", background: "rgba(173,35,36,0.08)", color: SOMAP_RED, height: 32, padding: "0 10px", borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: "pointer" },
    emptyState: { padding: "48px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, color: MUTED, fontSize: 14 },
    resetButton: { border: "none", background: "rgba(18,113,184,0.10)", color: SOMAP_BLUE, padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: "pointer" },
    errorBanner: { border: "1px solid rgba(173,35,36,0.20)", background: "rgba(173,35,36,0.08)", color: SOMAP_RED, borderRadius: 14, padding: "12px 14px", fontWeight: 800 },
    successBanner: { border: "1px solid rgba(126,201,51,0.28)", background: "rgba(126,201,51,0.14)", color: "#3f8619", borderRadius: 14, padding: "12px 14px", fontWeight: 800 },
    modalBackdrop: { position: "fixed", inset: 0, background: "rgba(9,24,40,0.48)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 40, padding: 20 },
    modalCard: { width: "min(760px, 96vw)", maxHeight: "90vh", overflowY: "auto", background: "#fff", borderRadius: 22, padding: 24, boxShadow: "0 30px 80px rgba(0,0,0,0.25)" },
    modalHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, borderBottom: "1px solid #edf2f7", paddingBottom: 14, marginBottom: 16 },
    modalTitle: { margin: 0, color: TEXT, fontSize: 24 },
    modalDescription: { color: MUTED, lineHeight: 1.7, margin: "0 0 18px" },
    closeButton: { border: "none", background: "#edf3f8", color: TEXT, width: 34, height: 34, borderRadius: 10, cursor: "pointer", fontSize: 22, lineHeight: 1 },
    detailsGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 },
    detailBox: { border: "1px solid #e5edf5", background: "#f8fbff", borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 5, color: MUTED, fontSize: 12 },
    modalActions: { display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, marginTop: 20 },
    formGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 },
    fieldLabel: { display: "flex", flexDirection: "column", gap: 7, color: TEXT, fontSize: 12, fontWeight: 900 },
    formControl: { minHeight: 42, border: "1px solid #dfe9f3", borderRadius: 11, padding: "0 12px", color: TEXT, fontWeight: 700, outline: "none", fontFamily: "'Segoe UI', system-ui, sans-serif" },
    cancelButton: { border: "1px solid #dfe9f3", background: "#fff", color: MUTED, minHeight: 40, padding: "0 16px", borderRadius: 10, cursor: "pointer", fontWeight: 900 },
};
