import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import Layout from "../components/Layout";
import api, { API_ORIGIN } from "../api/api";

const SOMAP_BLUE = "#1271b8";
const SOMAP_RED = "#ad2324";
const TEXT = "#1a2e4a";
const MUTED = "#6b7f95";

type ServiceItem = {
    id: number;
    titre: string;
    description: string;
    adminId?: number;
    adminNom?: string;
    images?: Array<{
        id: number;
        imageUrl: string;
    }>;
};

type ServiceForm = {
    titre: string;
    description: string;
};

const emptyForm: ServiceForm = {
    titre: "",
    description: "",
};

function getImageUrl(imageUrl: string) {
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
        return imageUrl;
    }
    return `${API_ORIGIN}${imageUrl}`;
}

export default function Services() {
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    
    // Modal states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingService, setEditingService] = useState<ServiceItem | null>(null);
    const [confirmDeleteService, setConfirmDeleteService] = useState<ServiceItem | null>(null);
    
    // Form and upload states
    const [form, setForm] = useState<ServiceForm>(emptyForm);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const loadServices = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await api.get<ServiceItem[]>("/services");
            setServices(response.data ?? []);
        } catch (err) {
            setServices([]);
            setError("Impossible de charger le catalogue des services.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadServices();
    }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return services.filter((s) => {
            return (
                !q ||
                s.titre?.toLowerCase().includes(q) ||
                s.description?.toLowerCase().includes(q)
            );
        });
    }, [services, search]);

    const handleCreateOpen = () => {
        setForm(emptyForm);
        setSelectedFiles([]);
        setError("");
        setIsCreateOpen(true);
    };

    const handleEditOpen = (service: ServiceItem) => {
        setForm({
            titre: service.titre,
            description: service.description,
        });
        setSelectedFiles([]);
        setError("");
        setEditingService(service);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        const existingCount = editingService?.images?.length ?? 0;
        
        if (existingCount + selectedFiles.length + files.length > 4) {
            setError("Vous pouvez ajouter un maximum de 4 images par service.");
            return;
        }
        
        setSelectedFiles((prev) => [...prev, ...files]);
    };

    const handleDeleteExistingImage = async (imageId: number) => {
        setError("");
        try {
            await api.delete(`/images/${imageId}`);
            setEditingService((prev) => {
                if (!prev) return null;
                return {
                    ...prev,
                    images: prev.images?.filter((img) => img.id !== imageId),
                };
            });
            setServices((prev) =>
                prev.map((s) => {
                    if (s.id === editingService?.id) {
                        return {
                            ...s,
                            images: s.images?.filter((img) => img.id !== imageId),
                        };
                    }
                    return s;
                })
            );
        } catch (err) {
            setError("Impossible de supprimer l'image.");
        }
    };

    const handleSubmitCreate = async (e: FormEvent) => {
        e.preventDefault();
        if (!form.titre.trim()) {
            setError("Le titre du service est requis.");
            return;
        }

        setSubmitting(true);
        setError("");
        try {
            const response = await api.post<ServiceItem>("/services", form);
            const newService = response.data;
            
            // Upload images if selected
            if (selectedFiles.length > 0) {
                const uploadedImages = [];
                for (const file of selectedFiles) {
                    const formData = new FormData();
                    formData.append("file", file);
                    const imgRes = await api.post(`/images/upload`, formData, {
                        params: { serviceId: newService.id },
                        headers: { "Content-Type": "multipart/form-data" },
                    });
                    uploadedImages.push(imgRes.data);
                }
                newService.images = uploadedImages;
            }

            setServices((prev) => [newService, ...prev]);
            setIsCreateOpen(false);
            setForm(emptyForm);
            setSelectedFiles([]);
        } catch (err) {
            setError("Une erreur est survenue lors de la création du service.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitEdit = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingService) return;
        if (!form.titre.trim()) {
            setError("Le titre du service est requis.");
            return;
        }

        setSubmitting(true);
        setError("");
        try {
            const response = await api.put<ServiceItem>(`/services/${editingService.id}`, form);
            const updatedService = response.data;
            
            // Upload new images if selected
            if (selectedFiles.length > 0) {
                const uploadedImages = [...(editingService.images ?? [])];
                for (const file of selectedFiles) {
                    const formData = new FormData();
                    formData.append("file", file);
                    const imgRes = await api.post(`/images/upload`, formData, {
                        params: { serviceId: updatedService.id },
                        headers: { "Content-Type": "multipart/form-data" },
                    });
                    uploadedImages.push(imgRes.data);
                }
                updatedService.images = uploadedImages;
            } else {
                updatedService.images = editingService.images;
            }

            setServices((prev) =>
                prev.map((s) => (s.id === editingService.id ? updatedService : s))
            );
            setEditingService(null);
            setForm(emptyForm);
            setSelectedFiles([]);
        } catch (err) {
            setError("Une erreur est survenue lors de la mise à jour du service.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!confirmDeleteService) return;

        setDeletingId(confirmDeleteService.id);
        setError("");
        try {
            await api.delete(`/services/${confirmDeleteService.id}`);
            setServices((prev) => prev.filter((s) => s.id !== confirmDeleteService.id));
            setConfirmDeleteService(null);
        } catch (err) {
            setError("Impossible de supprimer le service. Il est possible qu'il soit lié à des demandes.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <Layout>
            <div style={styles.page}>
                <section style={styles.header}>
                    <div>
                        <span style={styles.eyebrow}>SOMAP & SERVICE</span>
                        <h1 style={styles.title}>Services</h1>
                        <p style={styles.subtitle}>Catalogue des expertises et prestations industrielles de la SOMAP.</p>
                    </div>

                    <button style={styles.createButton} onClick={handleCreateOpen}>
                        <AddCircleOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                        Nouveau Service
                    </button>
                </section>

                {error && (
                    <section style={styles.errorBox}>
                        <ErrorOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                        <span>{error}</span>
                    </section>
                )}

                <section style={styles.toolbar}>
                    <div style={styles.searchBox}>
                        <span style={styles.searchIcon}>⌕</span>
                        <input
                            style={styles.searchInput}
                            placeholder="Rechercher un service..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button style={styles.clearButton} onClick={() => setSearch("")}>×</button>
                        )}
                    </div>
                </section>

                {loading ? (
                    <div style={styles.loadingState}>
                        <p>Chargement du catalogue des services...</p>
                    </div>
                ) : filtered.length > 0 ? (
                    <section style={styles.servicesGrid}>
                        {filtered.map((service) => (
                            <article key={service.id} style={styles.serviceCard}>
                                {service.images && service.images.length > 0 ? (
                                    <img
                                        src={getImageUrl(service.images[0].imageUrl)}
                                        alt={service.titre}
                                        style={styles.cardImage}
                                    />
                                ) : (
                                    <div style={styles.cardNoImage}>
                                        <BuildOutlinedIcon sx={{ fontSize: 24 }} />
                                    </div>
                                )}

                                <div style={styles.cardHeader}>
                                    <h3 style={styles.serviceTitle}>{service.titre}</h3>
                                    <div style={styles.actionGroup}>
                                        <button
                                            style={styles.actionBtn}
                                            onClick={() => handleEditOpen(service)}
                                            title="Modifier"
                                        >
                                            <EditOutlinedIcon sx={{ fontSize: 15 }} />
                                        </button>
                                        <button
                                            style={{ ...styles.actionBtn, color: SOMAP_RED }}
                                            onClick={() => setConfirmDeleteService(service)}
                                            title="Supprimer"
                                        >
                                            <DeleteOutlineOutlinedIcon sx={{ fontSize: 15 }} />
                                        </button>
                                    </div>
                                </div>

                                <div style={styles.cardBody}>
                                    <p style={styles.serviceDescription}>
                                        {service.description || "Aucune description fournie pour ce service."}
                                    </p>
                                </div>

                                <div style={styles.cardFooter}>
                                    <span style={styles.adminBadge}>
                                        {service.adminNom ? `par: ${service.adminNom}` : "par: Système"}
                                    </span>
                                </div>
                            </article>
                        ))}
                    </section>
                ) : (
                    <div style={styles.emptyState}>
                        <p>Aucun service ne correspond à votre recherche.</p>
                    </div>
                )}

                {/* CREATE MODAL */}
                {isCreateOpen && (
                    <div style={styles.modalOverlay} onClick={() => setIsCreateOpen(false)}>
                        <section style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                            <div style={styles.modalHeaderStyle}>
                                <h2 style={styles.modalTitle}>Nouveau Service</h2>
                                <button style={styles.closeBtn} onClick={() => setIsCreateOpen(false)}>×</button>
                            </div>
                            <form onSubmit={handleSubmitCreate} style={styles.form}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Titre du service</label>
                                    <input
                                        type="text"
                                        style={styles.input}
                                        placeholder="Ex: Chaudronnerie Industrielle"
                                        value={form.titre}
                                        onChange={(e) => setForm((p) => ({ ...p, titre: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Description</label>
                                    <textarea
                                        style={styles.textarea}
                                        placeholder="Décrivez les compétences, équipements et livrables associés..."
                                        value={form.description}
                                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                        rows={4}
                                    />
                                </div>
                                
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Images (Max 4)</label>
                                    <div style={styles.fileInputWrapper}>
                                        <label htmlFor="create-file-upload" style={styles.fileInputButton}>
                                            <FileUploadOutlinedIcon sx={{ fontSize: 18 }} />
                                            Choisir des photos
                                        </label>
                                        <input
                                            id="create-file-upload"
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            style={styles.fileInputHidden}
                                            onChange={handleFileChange}
                                        />
                                    </div>

                                    {selectedFiles.length > 0 && (
                                        <div style={styles.previewGrid}>
                                            {selectedFiles.map((file, idx) => (
                                                <div key={idx} style={styles.previewThumbnailWrap}>
                                                    <img src={URL.createObjectURL(file)} style={styles.previewThumbnail} alt="preview" />
                                                    <button
                                                        type="button"
                                                        style={styles.removePreviewBtn}
                                                        onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div style={styles.formActions}>
                                    <button
                                        type="button"
                                        style={styles.cancelBtn}
                                        onClick={() => setIsCreateOpen(false)}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        style={styles.submitBtn}
                                        disabled={submitting}
                                    >
                                        {submitting ? "Création..." : "Créer le service"}
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>
                )}

                {/* EDIT MODAL */}
                {editingService && (
                    <div style={styles.modalOverlay} onClick={() => setEditingService(null)}>
                        <section style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                            <div style={styles.modalHeaderStyle}>
                                <h2 style={styles.modalTitle}>Modifier Service</h2>
                                <button style={styles.closeBtn} onClick={() => setEditingService(null)}>×</button>
                            </div>
                            <form onSubmit={handleSubmitEdit} style={styles.form}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Titre du service</label>
                                    <input
                                        type="text"
                                        style={styles.input}
                                        value={form.titre}
                                        onChange={(e) => setForm((p) => ({ ...p, titre: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Description</label>
                                    <textarea
                                        style={styles.textarea}
                                        value={form.description}
                                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                        rows={4}
                                    />
                                </div>

                                {/* Existing images management */}
                                {editingService.images && editingService.images.length > 0 && (
                                    <div style={styles.existingImagesGrid}>
                                        <p style={styles.labelSmall}>Photos enregistrées ({editingService.images.length}) :</p>
                                        <div style={styles.previewGrid}>
                                            {editingService.images.map((img) => (
                                                <div key={img.id} style={styles.previewThumbnailWrap}>
                                                    <img src={getImageUrl(img.imageUrl)} style={styles.previewThumbnail} alt="existing" />
                                                    <button
                                                        type="button"
                                                        style={styles.removePreviewBtn}
                                                        onClick={() => void handleDeleteExistingImage(img.id)}
                                                        title="Supprimer l'image"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Ajouter des images (Max 4 au total)</label>
                                    <div style={styles.fileInputWrapper}>
                                        <label htmlFor="edit-file-upload" style={styles.fileInputButton}>
                                            <FileUploadOutlinedIcon sx={{ fontSize: 18 }} />
                                            Choisir des photos
                                        </label>
                                        <input
                                            id="edit-file-upload"
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            style={styles.fileInputHidden}
                                            onChange={handleFileChange}
                                        />
                                    </div>

                                    {selectedFiles.length > 0 && (
                                        <div style={styles.previewGrid}>
                                            {selectedFiles.map((file, idx) => (
                                                <div key={idx} style={styles.previewThumbnailWrap}>
                                                    <img src={URL.createObjectURL(file)} style={styles.previewThumbnail} alt="preview" />
                                                    <button
                                                        type="button"
                                                        style={styles.removePreviewBtn}
                                                        onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div style={styles.formActions}>
                                    <button
                                        type="button"
                                        style={styles.cancelBtn}
                                        onClick={() => setEditingService(null)}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        style={styles.submitBtn}
                                        disabled={submitting}
                                    >
                                        {submitting ? "Enregistrement..." : "Enregistrer"}
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>
                )}

                {/* DELETE MODAL */}
                {confirmDeleteService && (
                    <div style={styles.modalOverlay} onClick={() => setConfirmDeleteService(null)}>
                        <section style={styles.confirmCard} onClick={(e) => e.stopPropagation()}>
                            <h2 style={styles.confirmTitle}>Supprimer ce service ?</h2>
                            <p style={styles.confirmText}>
                                Cette action supprimera définitivement le service <strong>"{confirmDeleteService.titre}"</strong> du catalogue.
                            </p>
                            {error && <p style={{ color: SOMAP_RED, fontSize: 12, fontWeight: 700, margin: "8px 0" }}>{error}</p>}
                            <div style={styles.confirmActions}>
                                <button style={styles.cancelBtn} onClick={() => setConfirmDeleteService(null)}>
                                    Annuler
                                </button>
                                <button
                                    style={styles.confirmDeleteButton}
                                    onClick={handleDeleteConfirm}
                                    disabled={deletingId === confirmDeleteService.id}
                                >
                                    {deletingId === confirmDeleteService.id ? "Suppression..." : "Oui, supprimer"}
                                </button>
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
        color: TEXT,
        fontWeight: 700,
    },
    subtitle: {
        marginTop: 6,
        color: MUTED,
        fontSize: 13,
    },
    createButton: {
        border: "none",
        background: SOMAP_BLUE,
        color: "#fff",
        borderRadius: 12,
        height: 42,
        padding: "0 18px",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        transition: "opacity 0.15s ease",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
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
    loadingState: {
        padding: "48px 20px",
        display: "flex",
        justifyContent: "center",
        color: MUTED,
        fontSize: 14,
    },
    emptyState: {
        padding: "48px 20px",
        display: "flex",
        justifyContent: "center",
        color: MUTED,
        fontSize: 14,
        background: "#fff",
        border: "1px solid #e5edf5",
        borderRadius: 16,
    },
    servicesGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(285px, 1fr))",
        gap: 20,
    },
    serviceCard: {
        background: "#fff",
        border: "1px solid #e5edf5",
        borderRadius: 16,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        boxShadow: "0 4px 12px rgba(18,113,184,0.02)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
    },
    cardImage: {
        width: "100%",
        height: "150px",
        objectFit: "cover",
        borderRadius: "12px",
        border: "1px solid #edf2f7",
        background: "#edf3f8",
    },
    cardNoImage: {
        width: "100%",
        height: "150px",
        borderRadius: "12px",
        border: "1px dashed #dfe9f3",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fbfdff",
        color: SOMAP_BLUE,
    },
    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    actionGroup: {
        display: "flex",
        gap: 4,
    },
    actionBtn: {
        border: "none",
        background: "rgba(0,0,0,0.03)",
        width: 28,
        height: 28,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: "#5a6e82",
        transition: "background 0.15s",
    },
    cardBody: {
        display: "flex",
        flexDirection: "column",
        gap: 6,
    },
    serviceTitle: {
        margin: 0,
        fontSize: 16,
        fontWeight: 700,
        color: TEXT,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        maxWidth: "180px",
    },
    serviceDescription: {
        margin: 0,
        fontSize: 13,
        color: MUTED,
        lineHeight: 1.5,
        display: "-webkit-box",
        WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        minHeight: 58,
    },
    cardFooter: {
        borderTop: "1px solid #edf2f7",
        paddingTop: 10,
        display: "flex",
        justifyContent: "flex-end",
    },
    adminBadge: {
        fontSize: 10,
        color: MUTED,
        background: "#edf3f8",
        borderRadius: 999,
        padding: "4px 8px",
        fontWeight: 700,
    },
    modalOverlay: {
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(10,24,44,0.42)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    modalCard: {
        width: "min(480px, 100%)",
        background: "#fff",
        border: "1px solid #dfe9f3",
        borderRadius: 16,
        boxShadow: "0 24px 70px rgba(13,45,94,0.22)",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 20,
        maxHeight: "90vh",
        overflowY: "auto",
    },
    modalHeaderStyle: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    modalTitle: {
        margin: 0,
        fontSize: 18,
        fontWeight: 700,
        color: TEXT,
    },
    closeBtn: {
        border: "none",
        background: "transparent",
        fontSize: 22,
        color: MUTED,
        cursor: "pointer",
        lineHeight: 1,
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: 16,
    },
    formGroup: {
        display: "flex",
        flexDirection: "column",
        gap: 6,
    },
    label: {
        fontSize: 12,
        fontWeight: 700,
        color: TEXT,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    input: {
        height: 40,
        borderRadius: 10,
        border: "1px solid #dfe9f3",
        padding: "0 12px",
        fontSize: 13.5,
        color: TEXT,
        outline: "none",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    textarea: {
        borderRadius: 10,
        border: "1px solid #dfe9f3",
        padding: "10px 12px",
        fontSize: 13.5,
        color: TEXT,
        outline: "none",
        resize: "vertical",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    formActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 8,
    },
    cancelBtn: {
        border: "1px solid #dfe9f3",
        background: "#fff",
        color: TEXT,
        height: 38,
        padding: "0 16px",
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    submitBtn: {
        border: "none",
        background: SOMAP_BLUE,
        color: "#fff",
        height: 38,
        padding: "0 16px",
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        transition: "opacity 0.15s",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    confirmCard: {
        width: "min(400px, 100%)",
        background: "#fff",
        border: "1px solid #dfe9f3",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 24px 70px rgba(13,45,94,0.22)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        alignItems: "center",
        textAlign: "center",
    },
    confirmTitle: {
        margin: 0,
        fontSize: 17,
        fontWeight: 700,
        color: TEXT,
    },
    confirmText: {
        margin: 0,
        fontSize: 13.5,
        color: MUTED,
        lineHeight: 1.5,
    },
    confirmActions: {
        display: "flex",
        gap: 10,
        width: "100%",
        justifyContent: "center",
        marginTop: 12,
    },
    confirmDeleteButton: {
        border: "none",
        background: SOMAP_RED,
        color: "#fff",
        height: 38,
        padding: "0 16px",
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    
    // Upload visual previews
    previewGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 10,
        marginTop: 6,
    },
    previewThumbnailWrap: {
        position: "relative",
        aspectRatio: "1 / 1",
    },
    previewThumbnail: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        borderRadius: 8,
        border: "1px solid #dfe9f3",
    },
    removePreviewBtn: {
        position: "absolute",
        top: -6,
        right: -6,
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: SOMAP_RED,
        color: "#fff",
        border: "none",
        fontSize: 12,
        lineHeight: 1,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 5,
    },
    fileInputWrapper: {
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 6,
    },
    fileInputButton: {
        border: "1px dashed #dfe9f3",
        background: "#fbfdff",
        height: 44,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: SOMAP_BLUE,
        fontWeight: 700,
        cursor: "pointer",
        fontSize: 13,
        gap: 8,
    },
    fileInputHidden: {
        display: "none",
    },
    labelSmall: {
        fontSize: 11,
        color: MUTED,
        fontWeight: 800,
        textTransform: "uppercase",
        margin: "0 0 4px",
    },
    existingImagesGrid: {
        marginTop: 4,
        marginBottom: 8,
    },
};