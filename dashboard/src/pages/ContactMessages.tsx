import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import ReplyOutlinedIcon from "@mui/icons-material/ReplyOutlined";
import Layout from "../components/Layout";
import api from "../api/api";

const SOMAP_BLUE = "#1271b8";
const SOMAP_GREEN = "#7EC933";
const SOMAP_RED = "#ad2324";
const SOMAP_GOLD = "#f6b718";
const TEXT = "#1a2e4a";
const MUTED = "#6b7f95";

type ContactMessageItem = {
    id: number;
    name: string;
    email: string;
    subject: string;
    message: string;
    userId?: number;
    createdAt?: string;
    status: "PENDING" | "READ" | "REPLIED";
    adminReply?: string;
    adminId?: number;
    adminNom?: string;
};

type FilterType = "ALL" | "PENDING" | "READ" | "REPLIED";

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

export default function ContactMessages() {
    const [messages, setMessages] = useState<ContactMessageItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<FilterType>("ALL");
    const [replyText, setReplyText] = useState<Record<number, string>>({});
    const [submittingReply, setSubmittingReply] = useState<Record<number, boolean>>({});
    const [confirmDeleteMessage, setConfirmDeleteMessage] = useState<ContactMessageItem | null>(null);
    const [deletingMessageId, setDeletingMessageId] = useState<number | null>(null);


    const loadMessages = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await api.get<ContactMessageItem[]>("/contact/admin/messages");
            setMessages(response.data ?? []);
        } catch {
            setMessages([]);
            setError("Impossible de charger les messages de contact.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadMessages();
    }, []);

    const pendingCount = useMemo(
        () => messages.filter((m) => m.status === "PENDING").length,
        [messages]
    );

    const repliedCount = useMemo(
        () => messages.filter((m) => m.status === "REPLIED").length,
        [messages]
    );

    const markAsRead = async (id: number) => {
        setError("");
        setSuccess("");
        
        // Optimistic update
        setMessages((items) =>
            items.map((m) => (m.id === id ? { ...m, status: "READ" as const } : m))
        );

        try {
            await api.put(`/contact/admin/messages/${id}/read`);
            setSuccess("Message marqué comme lu.");
        } catch {
            setError("Impossible de mettre à jour le message.");
            void loadMessages();
        }
    };

    const handleSendReply = async (id: number, email: string) => {
        const text = replyText[id]?.trim();
        if (!text) return;

        setError("");
        setSuccess("");
        setSubmittingReply((prev) => ({ ...prev, [id]: true }));

        try {
            await api.post(`/contact/admin/messages/${id}/reply`, null, {
                params: { reply: text },
            });
            
            setSuccess(`Réponse envoyée avec succès à ${email}`);
            setReplyText((prev) => ({ ...prev, [id]: "" }));
            
            // Re-fetch message to sync
            void loadMessages();
        } catch {
            setError("Une erreur est survenue lors de l'envoi de l'email.");
        } finally {
            setSubmittingReply((prev) => ({ ...prev, [id]: false }));
        }
    };

    const handleDeleteMessageConfirm = async () => {
        if (!confirmDeleteMessage) return;
        const id = confirmDeleteMessage.id;

        setDeletingMessageId(id);
        setError("");
        setSuccess("");
        
        // Optimistic update
        setMessages((items) => items.filter((m) => m.id !== id));

        try {
            await api.delete(`/contact/admin/messages/${id}`);
            setSuccess("Message de contact supprimé.");
            setConfirmDeleteMessage(null);
        } catch {
            setError("Impossible de supprimer le message.");
            void loadMessages();
        } finally {
            setDeletingMessageId(null);
        }
    };


    const filteredMessages = useMemo(() => {
        const q = search.toLowerCase().trim();
        return messages.filter((m) => {
            const matchSearch =
                !q ||
                m.name.toLowerCase().includes(q) ||
                m.email.toLowerCase().includes(q) ||
                m.subject.toLowerCase().includes(q) ||
                m.message.toLowerCase().includes(q);

            const matchFilter =
                filter === "ALL" ||
                (filter === "PENDING" && m.status === "PENDING") ||
                (filter === "READ" && m.status === "READ") ||
                (filter === "REPLIED" && m.status === "REPLIED");

            return matchSearch && matchFilter;
        });
    }, [messages, search, filter]);

    const getStatusStyle = (status: "PENDING" | "READ" | "REPLIED") => {
        switch (status) {
            case "PENDING":
                return { color: "#8a5a00", background: "#fff7df", border: "rgba(246,183,24,0.30)", label: "En attente" };
            case "READ":
                return { color: MUTED, background: "#f0f4f8", border: "#dfe9f3", label: "Lu" };
            case "REPLIED":
                return { color: "#2f7d32", background: "rgba(126,201,51,0.15)", border: "rgba(126,201,51,0.25)", label: "Répondu" };
        }
    };

    return (
        <Layout>
            <div style={styles.page}>
                {/* Header */}
                <section style={styles.header}>
                    <div>
                        <span style={styles.eyebrow}>SOMAP & SERVICE</span>
                        <h1 style={styles.title}>Messages de contact</h1>
                        <p style={styles.subtitle}>Gérez les demandes directes reçues du formulaire public et répondez-y par email.</p>
                    </div>

                    <div style={styles.headerBadge}>
                        <EmailOutlinedIcon sx={{ fontSize: 18 }} />
                        {loading ? "..." : `${pendingCount} message${pendingCount !== 1 ? "s" : ""} en attente`}
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

                {/* Stats grid */}
                <section style={styles.statsGrid}>
                    <div style={styles.statCard}>
                        <div style={{ ...styles.statIcon, color: SOMAP_BLUE, background: "rgba(18,113,184,0.10)" }}>
                            <EmailOutlinedIcon sx={{ fontSize: 22 }} />
                        </div>
                        <div>
                            <p style={styles.statLabel}>Total messages</p>
                            <strong style={styles.statValue}>{loading ? "-" : messages.length}</strong>
                            <p style={styles.statHelper}>Reçus sur la plateforme</p>
                        </div>
                    </div>

                    <div style={styles.statCard}>
                        <div style={{ ...styles.statIcon, color: SOMAP_GOLD, background: "rgba(246,183,24,0.10)" }}>
                            <EmailOutlinedIcon sx={{ fontSize: 22 }} />
                        </div>
                        <div>
                            <p style={styles.statLabel}>En attente</p>
                            <strong style={styles.statValue}>{loading ? "-" : pendingCount}</strong>
                            <p style={styles.statHelper}>Réponses requises</p>
                        </div>
                    </div>

                    <div style={styles.statCard}>
                        <div style={{ ...styles.statIcon, color: SOMAP_GREEN, background: "rgba(126,201,51,0.10)" }}>
                            <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 22 }} />
                        </div>
                        <div>
                            <p style={styles.statLabel}>Répondus</p>
                            <strong style={styles.statValue}>{loading ? "-" : repliedCount}</strong>
                            <p style={styles.statHelper}>E-mails envoyés</p>
                        </div>
                    </div>
                </section>

                {/* Toolbar */}
                <section style={styles.toolbar}>
                    <div style={styles.searchBox}>
                        <span style={styles.searchIcon}>⌕</span>
                        <input
                            style={styles.searchInput}
                            placeholder="Rechercher par nom, email, sujet..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button style={styles.clearButton} onClick={() => setSearch("")}>×</button>
                        )}
                    </div>

                    <div style={styles.filters}>
                        {(["ALL", "PENDING", "READ", "REPLIED"] as FilterType[]).map((f) => (
                            <button
                                key={f}
                                style={{ ...styles.filterButton, ...(filter === f ? styles.filterButtonActive : {}) }}
                                onClick={() => setFilter(f)}
                            >
                                {f === "ALL" ? "Tous" : f === "PENDING" ? "En attente" : f === "READ" ? "Lus" : "Répondus"}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Messages Container */}
                <section style={styles.listCard}>
                    <div style={styles.listHeader}>
                        <div>
                            <h2 style={styles.sectionTitle}>Boîte de réception des messages</h2>
                            <p style={styles.sectionSubtitle}>
                                {loading
                                    ? "Chargement des messages..."
                                    : `${filteredMessages.length} message${filteredMessages.length !== 1 ? "s" : ""} affiché${filteredMessages.length !== 1 ? "s" : ""}`}
                            </p>
                        </div>
                    </div>

                    <div style={styles.cardsContainer}>
                        {loading ? (
                            <div style={styles.loadingState}>Chargement des messages en cours...</div>
                        ) : filteredMessages.length > 0 ? (
                            filteredMessages.map((m) => {
                                const statusStyle = getStatusStyle(m.status);
                                return (
                                    <div
                                        key={m.id}
                                        style={{
                                            ...styles.messageRow,
                                            borderLeft: m.status === "PENDING" ? `4px solid ${SOMAP_GOLD}` : "4px solid transparent",
                                            background: m.status === "PENDING" ? "#fffcf5" : "#ffffff"
                                        }}
                                    >
                                        <div style={styles.contentArea}>
                                            <div style={styles.metaRow}>
                                                <div>
                                                    <span style={styles.senderName}>{m.name}</span>
                                                    <span style={styles.senderEmail}> &lt;{m.email}&gt;</span>
                                                </div>
                                                <span style={styles.dateLabel}>{formatDate(m.createdAt)}</span>
                                            </div>

                                            <div style={styles.subjectRow}>
                                                <strong style={styles.subjectText}>{m.subject}</strong>
                                                <span
                                                    style={{
                                                        ...styles.statusBadge,
                                                        color: statusStyle.color,
                                                        background: statusStyle.background,
                                                        borderColor: statusStyle.border,
                                                    }}
                                                >
                                                    {statusStyle.label}
                                                </span>
                                            </div>

                                            <p style={styles.messageBody}>{m.message}</p>

                                            {/* Admin Reply History */}
                                            {m.adminReply && (
                                                <div style={styles.replyHistoryBox}>
                                                     <div style={styles.replyHeader}>
                                                         <ReplyOutlinedIcon sx={{ fontSize: 14, color: SOMAP_GREEN }} />
                                                         <strong>Réponse de l'administration :</strong>
                                                         {m.adminNom && (
                                                             <span style={{ fontSize: 11, color: MUTED, fontWeight: 700, marginLeft: 6 }}>
                                                                 (par {m.adminNom})
                                                             </span>
                                                         )}
                                                     </div>
                                                    <p style={styles.replyContent}>{m.adminReply}</p>
                                                </div>
                                            )}

                                            {/* Reply Input Form */}
                                            {m.status !== "REPLIED" && (
                                                <div style={styles.replyForm}>
                                                    <textarea
                                                        style={styles.replyTextarea}
                                                        placeholder="Écrivez votre réponse par email ici..."
                                                        value={replyText[m.id] ?? ""}
                                                        onChange={(e) =>
                                                            setReplyText((prev) => ({ ...prev, [m.id]: e.target.value }))
                                                        }
                                                    />
                                                    <div style={styles.replyFormActions}>
                                                        {m.status === "PENDING" && (
                                                            <button
                                                                style={styles.readButton}
                                                                onClick={() => void markAsRead(m.id)}
                                                            >
                                                                <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 15 }} />
                                                                Marquer comme lu
                                                            </button>
                                                        )}
                                                        <button
                                                            style={styles.sendButton}
                                                            disabled={submittingReply[m.id] || !(replyText[m.id]?.trim())}
                                                            onClick={() => void handleSendReply(m.id, m.email)}
                                                        >
                                                            <SendOutlinedIcon sx={{ fontSize: 14 }} />
                                                            {submittingReply[m.id] ? "Envoi..." : "Envoyer par e-mail"}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div style={styles.actionsPanel}>
                                            <button
                                                style={styles.deleteBtn}
                                                title="Supprimer"
                                                onClick={() => setConfirmDeleteMessage(m)}
                                            >
                                                <DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                                            </button>
                                        </div>

                                    </div>
                                );
                            })
                        ) : (
                            <div style={styles.emptyState}>
                                <div style={styles.emptyIcon}>✉</div>
                                <h3>Aucun message de contact</h3>
                                <p>Il n'y a aucun message correspondant à ce filtre dans votre boîte.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
            {confirmDeleteMessage && (
                <div style={styles.modalOverlay} onClick={() => setConfirmDeleteMessage(null)}>
                    <section style={styles.confirmCard} onClick={(event) => event.stopPropagation()}>
                        <h2 style={styles.confirmTitle}>Supprimer ce message ?</h2>
                        <p style={styles.confirmText}>
                            Cette action supprimera définitivement le message de "{confirmDeleteMessage.name}" ({confirmDeleteMessage.email}) de la liste.
                        </p>
                        <div style={styles.confirmActions}>
                            <button
                                style={styles.cancelButton}
                                onClick={() => setConfirmDeleteMessage(null)}
                                disabled={deletingMessageId === confirmDeleteMessage.id}
                            >
                                Annuler
                            </button>
                            <button
                                style={styles.confirmDeleteButton}
                                onClick={() => void handleDeleteMessageConfirm()}
                                disabled={deletingMessageId === confirmDeleteMessage.id}
                            >
                                {deletingMessageId === confirmDeleteMessage.id ? "Suppression..." : "Oui, supprimer"}
                            </button>
                        </div>
                    </section>
                </div>
            )}
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
        fontWeight: 800,
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
    successBox: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(126,201,51,0.08)",
        border: "1px solid rgba(126,201,51,0.18)",
        color: "#2f7d32",
        borderRadius: 14,
        padding: "12px 14px",
        fontSize: 13,
        fontWeight: 700,
    },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(180px, 1fr))",
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
        boxShadow: "0 4px 12px rgba(18,113,184,0.02)",
    },
    statIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    statLabel: { margin: 0, color: MUTED, fontSize: 12, fontWeight: 600 },
    statValue: { display: "block", color: TEXT, fontSize: 22, lineHeight: 1.1, marginTop: 2, fontWeight: 800 },
    statHelper: { margin: "3px 0 0", color: "#91a1b2", fontSize: 11, fontWeight: 500 },
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
        padding: "0 14px",
        borderRadius: 999,
        fontWeight: 700,
        cursor: "pointer",
        fontSize: 12,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        transition: "all 0.15s ease",
    },
    filterButtonActive: {
        background: "rgba(18,113,184,0.10)",
        color: SOMAP_BLUE,
        borderColor: "rgba(18,113,184,0.22)",
    },
    listCard: {
        background: "#fff",
        border: "1px solid #e5edf5",
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(18,113,184,0.03)",
    },
    listHeader: {
        padding: "16px 20px",
        borderBottom: "1px solid #edf2f7",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    sectionTitle: { margin: 0, color: TEXT, fontSize: 16, fontWeight: 700 },
    sectionSubtitle: { margin: "3px 0 0", color: MUTED, fontSize: 12 },
    cardsContainer: {
        display: "flex",
        flexDirection: "column",
    },
    messageRow: {
        display: "flex",
        alignItems: "flex-start",
        padding: "20px 24px",
        borderBottom: "1px solid #edf3f8",
        gap: 16,
        position: "relative",
    },
    contentArea: {
        flex: 1,
        minWidth: 0,
    },
    metaRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 12,
        marginBottom: 4,
    },
    senderName: {
        fontSize: 14,
        fontWeight: 700,
        color: TEXT,
    },
    senderEmail: {
        fontSize: 12.5,
        color: MUTED,
        fontWeight: 500,
    },
    dateLabel: {
        fontSize: 11.5,
        color: "#96a6b7",
        fontWeight: 700,
    },
    subjectRow: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 8,
    },
    subjectText: {
        fontSize: 13.5,
        color: TEXT,
        fontWeight: 700,
    },
    statusBadge: {
        border: "1px solid",
        borderRadius: 999,
        padding: "2px 8px",
        fontSize: 10.5,
        fontWeight: 800,
    },
    messageBody: {
        fontSize: 13,
        color: "#2d3748",
        lineHeight: 1.5,
        background: "#f8fafc",
        padding: "12px 14px",
        borderRadius: 10,
        border: "1px solid #edf2f7",
        margin: "0 0 14px",
        whiteSpace: "pre-line",
    },
    replyHistoryBox: {
        background: "rgba(126,201,51,0.06)",
        border: "1px solid rgba(126,201,51,0.18)",
        borderRadius: 10,
        padding: "12px 14px",
        marginBottom: 10,
    },
    replyHeader: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12.5,
        color: "#2f7d32",
        marginBottom: 4,
    },
    replyContent: {
        margin: 0,
        fontSize: 12.5,
        color: "#2d3748",
        lineHeight: 1.45,
        whiteSpace: "pre-line",
    },
    replyForm: {
        marginTop: 14,
        display: "flex",
        flexDirection: "column",
        gap: 8,
    },
    replyTextarea: {
        width: "100%",
        height: 86,
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid #dfe9f3",
        outline: "none",
        fontSize: 12.5,
        color: TEXT,
        resize: "vertical",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    replyFormActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
    },
    readButton: {
        border: "1px solid rgba(18,113,184,0.20)",
        background: "#ffffff",
        color: SOMAP_BLUE,
        height: 32,
        padding: "0 12px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
    },
    sendButton: {
        border: "none",
        background: SOMAP_BLUE,
        color: "#ffffff",
        height: 32,
        padding: "0 14px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        transition: "opacity 0.15s",
    },
    actionsPanel: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginLeft: 10,
        flexShrink: 0,
    },
    deleteBtn: {
        border: "none",
        width: 34,
        height: 34,
        borderRadius: 8,
        background: "rgba(173,35,36,0.06)",
        color: SOMAP_RED,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.15s",
    },
    loadingState: {
        padding: "48px 20px",
        textAlign: "center",
        color: MUTED,
        fontSize: 14,
    },
    emptyState: {
        padding: "64px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 8,
    },
    emptyIcon: {
        width: 54,
        height: 54,
        borderRadius: "50%",
        background: "rgba(18,113,184,0.08)",
        color: SOMAP_BLUE,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 8,
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
    cancelButton: {
        border: "1px solid #dfe9f3",
        background: "#fff",
        color: MUTED,
        height: 36,
        padding: "0 14px",
        borderRadius: 8,
        fontWeight: 800,
        cursor: "pointer",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
};
