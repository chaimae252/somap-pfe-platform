import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import AlternateEmailOutlinedIcon from "@mui/icons-material/AlternateEmailOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import Layout from "../components/Layout";
import api from "../api/api";

const SOMAP_BLUE = "#1271b8";
const SOMAP_GREEN = "#7EC933";
const SOMAP_RED = "#ad2324";
const SOMAP_GOLD = "#f6b718";
const TEXT = "#1a2e4a";
const MUTED = "#6b7f95";

type AdminProfile = {
    id?: number;
    nom?: string;
    email?: string;
};

type AdminUpdateResponse = AdminProfile & {
    token?: string;
    role?: string;
};

type DashboardStats = {
    clients: number;
    demandes: number;
    projets: number;
    services: number;
    notifications?: number;
};

const emptyStats: DashboardStats = {
    clients: 0,
    demandes: 0,
    projets: 0,
    services: 0,
    notifications: 0,
};

function getStoredProfile(): AdminProfile {
    const rawId = localStorage.getItem("userId");
    const id = rawId ? Number(rawId) : undefined;

    return {
        id: Number.isFinite(id) ? id : undefined,
        nom: localStorage.getItem("userName")?.trim() || "Admin SOMAP",
        email: localStorage.getItem("userEmail")?.trim() || undefined,
    };
}

function getInitials(name?: string) {
    const initials = (name || "Admin")
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return initials || "AD";
}

function formatNumber(value?: number) {
    return new Intl.NumberFormat("fr-MA").format(value ?? 0);
}

function formatRole(role?: string | null) {
    if (!role) return "Administrateur";
    return role.toLowerCase().replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
}

function getApiError(error: unknown, fallback: string) {
    if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: string | { message?: string } } }).response?.data === "string"
    ) {
        return (error as { response: { data: string } }).response.data;
    }

    if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === "string"
    ) {
        return (error as { response: { data: { message: string } } }).response.data.message;
    }

    if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { status?: number } }).response?.status === "number"
    ) {
        const status = (error as { response: { status: number } }).response.status;

        if (status === 404 || status === 405) {
            return "Action indisponible côté backend. Redémarrez le backend pour activer cette action.";
        }

        if (status === 401 || status === 403) {
            return "Session expirée ou accès refusé. Reconnectez-vous puis réessayez.";
        }

        return `${fallback} Code serveur: ${status}.`;
    }

    if (
        typeof error === "object" &&
        error !== null &&
        "request" in error
    ) {
        return "Backend indisponible. Vérifiez que le serveur Spring Boot est démarré.";
    }

    return fallback;
}

function clearAdminSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    sessionStorage.clear();
}

function useViewportWidth() {
    const [width, setWidth] = useState(() => window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return width;
}

export default function Profile() {
    const navigate = useNavigate();
    const viewportWidth = useViewportWidth();
    const storedProfile = getStoredProfile();
    const [profile, setProfile] = useState<AdminProfile>(getStoredProfile);
    const [form, setForm] = useState({
        nom: storedProfile.nom || "",
        email: storedProfile.email || "",
    });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [stats, setStats] = useState<DashboardStats>(emptyStats);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [requestingReset, setRequestingReset] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [editing, setEditing] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const role = localStorage.getItem("userRole");
    const hasToken = Boolean(localStorage.getItem("token"));
    const isCompact = viewportWidth < 1100;
    const isNarrow = viewportWidth < 780;

    useEffect(() => {
        const loadProfile = async () => {
            const stored = getStoredProfile();
            setProfile(stored);
            setForm({ nom: stored.nom || "", email: stored.email || "" });
            setLoading(true);
            setError("");
            setSuccess("");

            try {
                const requests: Promise<unknown>[] = [api.get<DashboardStats>("/dashboard/stats")];

                if (stored.id) {
                    requests.push(api.get<AdminProfile>(`/admins/${stored.id}`));
                    requests.push(api.get<number>(`/notifications/unread-count/${stored.id}`));
                }

                const [statsResponse, adminResponse, unreadResponse] = await Promise.all(requests);

                setStats((statsResponse as { data?: DashboardStats }).data ?? emptyStats);

                if (adminResponse && typeof adminResponse === "object" && "data" in adminResponse) {
                    const admin = (adminResponse as { data?: AdminProfile }).data;
                    if (admin) {
                        setProfile({ ...stored, ...admin });
                        setForm({
                            nom: admin.nom || stored.nom || "",
                            email: admin.email || stored.email || "",
                        });
                        if (admin.nom) localStorage.setItem("userName", admin.nom);
                        if (admin.email) localStorage.setItem("userEmail", admin.email);
                    }
                }

                if (unreadResponse && typeof unreadResponse === "object" && "data" in unreadResponse) {
                    setUnreadNotifications((unreadResponse as { data?: number }).data ?? 0);
                }
            } catch {
                setStats(emptyStats);
                setUnreadNotifications(0);
                setError("Impossible de synchroniser toutes les données du profil.");
            } finally {
                setLoading(false);
            }
        };

        void loadProfile();
    }, []);

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(""), 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(""), 6000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleSaveProfile = async () => {
        if (!profile.id) {
            setError("Impossible de modifier ce profil sans identifiant admin.");
            return;
        }

        if (!form.nom.trim() || !form.email.trim()) {
            setError("Le nom et l'email sont obligatoires.");
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const response = await api.put<AdminUpdateResponse>(`/admins/${profile.id}`, {
                nom: form.nom.trim(),
                email: form.email.trim(),
            });
            const updated = response.data;

            setProfile(updated);
            setForm({
                nom: updated.nom || form.nom.trim(),
                email: updated.email || form.email.trim(),
            });
            if (updated.token) localStorage.setItem("token", updated.token);
            if (updated.role) localStorage.setItem("userRole", updated.role);
            if (updated.id) localStorage.setItem("userId", updated.id.toString());
            localStorage.setItem("userName", updated.nom || form.nom.trim());
            localStorage.setItem("userEmail", updated.email || form.email.trim());
            window.dispatchEvent(new Event("somap-admin-profile-updated"));
            setEditing(false);
            setSuccess("Profil mis à jour avec succès.");
        } catch (err) {
            setError(getApiError(err, "Impossible de modifier le profil."));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!profile.id || deleteConfirm !== "SUPPRIMER") return;

        setDeleting(true);
        setError("");
        setSuccess("");

        try {
            await api.delete(`/admins/${profile.id}`);
            clearAdminSession();
            navigate("/");
        } catch (err) {
            setError(getApiError(err, "Impossible de supprimer le compte."));
        } finally {
            setDeleting(false);
        }
    };

    const handleChangePassword = async () => {
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            setError("Tous les champs du mot de passe sont obligatoires.");
            return;
        }

        if (passwordForm.newPassword.length < 4) {
            setError("Le nouveau mot de passe doit contenir au moins 4 caractères.");
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError("La confirmation ne correspond pas au nouveau mot de passe.");
            return;
        }

        setChangingPassword(true);
        setError("");
        setSuccess("");

        try {
            await api.put("/auth/change-password", {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });
            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
            setSuccess("Mot de passe modifié avec succès.");
        } catch (err) {
            setError(getApiError(err, "Impossible de modifier le mot de passe."));
        } finally {
            setChangingPassword(false);
        }
    };

    const handleForgotPassword = async () => {
        setRequestingReset(true);
        setError("");
        setSuccess("");
        try {
            await api.post("/auth/forgot-password-logged-in");
            setSuccess("Un nouveau mot de passe a été généré et envoyé à votre adresse email.");
        } catch (err) {
            setError(getApiError(err, "Impossible de générer le nouveau mot de passe."));
        } finally {
            setRequestingReset(false);
        }
    };

    const accountCards = useMemo(
        () => [
            {
                label: "Nom complet",
                value: profile.nom || "Admin SOMAP",
                helper: "Identité visible dans l'espace administrateur",
                icon: BadgeOutlinedIcon,
                color: SOMAP_BLUE,
            },
            {
                label: "Adresse email",
                value: profile.email || "Non disponible",
                helper: "Utilisée pour l'authentification et les suivis",
                icon: AlternateEmailOutlinedIcon,
                color: SOMAP_GREEN,
            },
            {
                label: "Role",
                value: formatRole(role),
                helper: "Niveau d'accès au tableau de bord",
                icon: AdminPanelSettingsOutlinedIcon,
                color: SOMAP_GOLD,
            },
        ],
        [profile.email, profile.nom, role]
    );


    return (
        <Layout>
            <div style={styles.page}>
                <section style={{ ...styles.header, ...(isCompact ? styles.headerCompact : {}) }}>
                    <div style={{ ...styles.identity, ...(isNarrow ? styles.identityNarrow : {}) }}>
                        <div style={styles.avatarWrap}>
                            <div style={styles.avatar}>{getInitials(profile.nom)}</div>
                            <span style={styles.statusDot} />
                        </div>
                        <div>
                            <span style={styles.eyebrow}>SOMAP & SERVICE</span>
                            <h1 style={styles.title}>{profile.nom || "Profil administrateur"}</h1>
                            <p style={styles.subtitle}>
                                Espace personnel, sécurité de session et aperçu de votre activité administrative.
                            </p>
                        </div>
                    </div>

                    <div style={styles.sessionCard}>
                        <div style={styles.sessionIcon}>
                            <SecurityOutlinedIcon sx={{ fontSize: 24 }} />
                        </div>
                        <div>
                            <span style={styles.sessionLabel}>Session</span>
                            <strong style={styles.sessionState}>{hasToken ? "Connectée" : "Non connectée"}</strong>
                            <p style={styles.sessionText}>
                                {hasToken ? "Jeton actif détecté sur ce navigateur." : "Reconnectez-vous pour protéger l'accès."}
                            </p>
                        </div>
                    </div>
                </section>

                {error && (
                    <section style={styles.errorBox}>
                        <span>{error}</span>
                        <strong>Les informations locales restent affichées.</strong>
                    </section>
                )}

                {success && (
                    <section style={styles.successBox}>
                        <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                        <span>{success}</span>
                    </section>
                )}

                <section style={{ ...styles.contentGrid, ...(isCompact ? styles.contentGridCompact : {}) }}>
                    <div style={styles.mainStack}>
                        <section style={styles.panel}>
                            <div style={styles.panelHeader}>
                                <div>
                                    <span style={styles.panelKicker}>Compte</span>
                                    <h2 style={styles.panelTitle}>Informations administrateur</h2>
                                    <p style={styles.panelSubtitle}>Données chargées depuis votre session et le backend.</p>
                                </div>
                                <AccountCircleOutlinedIcon sx={{ fontSize: 28, color: SOMAP_BLUE }} />
                            </div>

                            <div style={{ ...styles.accountGrid, ...(isNarrow ? styles.gridNarrow : isCompact ? styles.gridCompact : {}) }}>
                                {accountCards.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <article
                                            key={item.label}
                                            style={{
                                                ...styles.infoCard,
                                                ...(item.label === "Adresse email" ? styles.emailInfoCard : {}),
                                            }}
                                        >
                                            <div style={{ ...styles.infoIcon, color: item.color, background: `${item.color}16` }}>
                                                <Icon sx={{ fontSize: 22 }} />
                                            </div>
                                            <div style={styles.infoText}>
                                                <span style={styles.infoLabel}>{item.label}</span>
                                                <strong
                                                    style={{
                                                        ...styles.infoValue,
                                                        ...(item.label === "Adresse email" ? styles.emailValue : {}),
                                                    }}
                                                >
                                                    {item.value}
                                                </strong>
                                                <p style={styles.infoHelper}>{item.helper}</p>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </section>

                        <section style={styles.panel}>
                            <div style={styles.panelHeader}>
                                <div>
                                    <span style={styles.panelKicker}>Modification</span>
                                    <h2 style={styles.panelTitle}>Éditer le profil</h2>
                                    <p style={styles.panelSubtitle}>
                                        Mettez à jour le nom et l'email associés à votre compte administrateur.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    style={editing ? styles.secondaryButton : styles.primaryButton}
                                    onClick={() => {
                                        if (editing) {
                                            setForm({
                                                nom: profile.nom || "",
                                                email: profile.email || "",
                                            });
                                            setEditing(false);
                                            setError("");
                                        } else {
                                            setEditing(true);
                                        }
                                    }}
                                >
                                    {editing ? <CloseOutlinedIcon sx={{ fontSize: 18 }} /> : <EditOutlinedIcon sx={{ fontSize: 18 }} />}
                                    {editing ? "Annuler" : "Modifier"}
                                </button>
                            </div>

                            <div style={{ ...styles.formGrid, ...(isNarrow ? styles.gridNarrow : {}) }}>
                                <label style={styles.field}>
                                    <span style={styles.fieldLabel}>Nom complet</span>
                                    <input
                                        style={styles.input}
                                        value={form.nom}
                                        onChange={(event) => setForm((current) => ({ ...current, nom: event.target.value }))}
                                        disabled={!editing || saving}
                                        placeholder="Nom complet"
                                    />
                                </label>

                                <label style={styles.field}>
                                    <span style={styles.fieldLabel}>Email</span>
                                    <input
                                        style={styles.input}
                                        type="email"
                                        value={form.email}
                                        onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                                        disabled={!editing || saving}
                                        placeholder="admin@somap.com"
                                    />
                                </label>
                            </div>

                            <div style={styles.formFooter}>
                                <p style={styles.formHint}>
                                    Le jeton sécurisé est régénéré automatiquement après modification de l'email.
                                </p>
                                <button
                                    type="button"
                                    style={{
                                        ...styles.saveButton,
                                        ...(!editing || saving ? styles.disabledButton : {}),
                                    }}
                                    disabled={!editing || saving}
                                    onClick={() => void handleSaveProfile()}
                                >
                                    <SaveOutlinedIcon sx={{ fontSize: 18 }} />
                                    {saving ? "Enregistrement..." : "Enregistrer"}
                                </button>
                            </div>
                        </section>

                        <section style={styles.panel}>
                            <div style={styles.panelHeader}>
                                <div>
                                    <span style={styles.panelKicker}>Sécurité</span>
                                    <h2 style={styles.panelTitle}>Modifier le mot de passe</h2>
                                    <p style={styles.panelSubtitle}>
                                        Confirmez votre mot de passe actuel avant d'en définir un nouveau.
                                    </p>
                                </div>
                                <LockResetOutlinedIcon sx={{ fontSize: 28, color: SOMAP_GREEN }} />
                            </div>

                            <div style={{ ...styles.passwordGrid, ...(isNarrow ? styles.gridNarrow : {}) }}>
                                <div style={styles.field}>
                                    <span style={styles.fieldLabel}>Mot de passe actuel</span>
                                    <div style={styles.passwordWrap}>
                                        <input
                                            style={{ ...styles.input, ...styles.passwordInput }}
                                            type={showCurrentPassword ? "text" : "password"}
                                            value={passwordForm.currentPassword}
                                            onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                                            placeholder="Mot de passe actuel"
                                            disabled={changingPassword}
                                        />
                                        <button
                                            type="button"
                                            aria-label={showCurrentPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                            onClick={() => setShowCurrentPassword((value) => !value)}
                                            style={styles.eyeButton}
                                        >
                                            {showCurrentPassword ? (
                                                <VisibilityOffOutlinedIcon sx={{ fontSize: 19 }} />
                                            ) : (
                                                <VisibilityOutlinedIcon sx={{ fontSize: 19 }} />
                                            )}
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        style={styles.forgotPasswordLink}
                                        onClick={() => void handleForgotPassword()}
                                        disabled={requestingReset}
                                    >
                                        {requestingReset ? "Envoi..." : "Mot de passe oublié ?"}
                                    </button>
                                </div>

                                <div style={styles.field}>
                                    <span style={styles.fieldLabel}>Nouveau mot de passe</span>
                                    <div style={styles.passwordWrap}>
                                        <input
                                            style={{ ...styles.input, ...styles.passwordInput }}
                                            type={showNewPassword ? "text" : "password"}
                                            value={passwordForm.newPassword}
                                            onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                                            placeholder="Nouveau mot de passe"
                                            disabled={changingPassword}
                                        />
                                        <button
                                            type="button"
                                            aria-label={showNewPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                            onClick={() => setShowNewPassword((value) => !value)}
                                            style={styles.eyeButton}
                                        >
                                            {showNewPassword ? (
                                                <VisibilityOffOutlinedIcon sx={{ fontSize: 19 }} />
                                            ) : (
                                                <VisibilityOutlinedIcon sx={{ fontSize: 19 }} />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div style={styles.field}>
                                    <span style={styles.fieldLabel}>Confirmation</span>
                                    <div style={styles.passwordWrap}>
                                        <input
                                            style={{ ...styles.input, ...styles.passwordInput }}
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={passwordForm.confirmPassword}
                                            onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                                            placeholder="Confirmer le mot de passe"
                                            disabled={changingPassword}
                                        />
                                        <button
                                            type="button"
                                            aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                            onClick={() => setShowConfirmPassword((value) => !value)}
                                            style={styles.eyeButton}
                                        >
                                            {showConfirmPassword ? (
                                                <VisibilityOffOutlinedIcon sx={{ fontSize: 19 }} />
                                            ) : (
                                                <VisibilityOutlinedIcon sx={{ fontSize: 19 }} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div style={styles.formFooter}>
                                <p style={styles.formHint}>
                                    Après modification, utilisez ce nouveau mot de passe lors de votre prochaine connexion.
                                </p>
                                <button
                                    type="button"
                                    style={{
                                        ...styles.saveButton,
                                        ...(changingPassword ? styles.disabledButton : {}),
                                    }}
                                    disabled={changingPassword}
                                    onClick={() => void handleChangePassword()}
                                >
                                    <LockResetOutlinedIcon sx={{ fontSize: 18 }} />
                                    {changingPassword ? "Modification..." : "Modifier le mot de passe"}
                                </button>
                            </div>
                        </section>


                    </div>

                    <aside style={styles.sideStack}>
                        <section style={styles.profileCard}>
                            <div style={styles.profileAvatar}>{getInitials(profile.nom)}</div>
                            <h2 style={styles.profileName}>{profile.nom || "Admin SOMAP"}</h2>
                            <p style={styles.profileEmail}>{profile.email || "Email non disponible"}</p>
                            <span style={styles.roleBadge}>
                                <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 16 }} />
                                {formatRole(role)}
                            </span>
                        </section>

                        <section style={styles.panel}>
                            <div style={styles.panelHeaderCompact}>
                                <span style={styles.panelKicker}>Navigation</span>
                                <h2 style={styles.panelTitle}>Actions rapides</h2>
                            </div>

                            <div style={styles.actions}>
                                <button style={styles.actionButton} onClick={() => navigate("/dashboard")}>
                                    <DashboardOutlinedIcon sx={{ fontSize: 19 }} />
                                    Ouvrir le tableau de bord
                                </button>
                                <button style={styles.actionButton} onClick={() => navigate("/notifications")}>
                                    <NotificationsNoneOutlinedIcon sx={{ fontSize: 19 }} />
                                    Voir les notifications
                                </button>
                                <button style={styles.actionButton} onClick={() => navigate("/clients")}>
                                    <GroupsOutlinedIcon sx={{ fontSize: 19 }} />
                                    Gérer les clients
                                </button>
                            </div>
                        </section>

                        <section style={styles.dangerPanel}>
                            <div style={styles.dangerHeader}>
                                <div style={styles.dangerIcon}>
                                    <WarningAmberOutlinedIcon sx={{ fontSize: 22 }} />
                                </div>
                                <div>
                                    <span style={styles.dangerKicker}>Zone sensible</span>
                                    <h2 style={styles.dangerTitle}>Supprimer le compte</h2>
                                    <p style={styles.dangerText}>
                                        Cette action supprimera votre compte administrateur et fermera la session.
                                    </p>
                                </div>
                            </div>

                            <input
                                style={styles.confirmInput}
                                value={deleteConfirm}
                                onChange={(event) => setDeleteConfirm(event.target.value)}
                                placeholder="Tapez SUPPRIMER"
                                disabled={deleting}
                            />
                            <button
                                type="button"
                                style={{
                                    ...styles.deleteButton,
                                    ...(deleteConfirm !== "SUPPRIMER" || deleting ? styles.disabledDangerButton : {}),
                                }}
                                disabled={deleteConfirm !== "SUPPRIMER" || deleting}
                                onClick={() => void handleDeleteAccount()}
                            >
                                <DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                                {deleting ? "Suppression..." : "Supprimer mon compte"}
                            </button>
                        </section>
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
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    header: {
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 300px",
        gap: 18,
        alignItems: "stretch",
    },
    headerCompact: {
        gridTemplateColumns: "1fr",
    },
    identity: {
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: 18,
    },
    identityNarrow: {
        alignItems: "flex-start",
        flexDirection: "column",
    },
    avatarWrap: {
        position: "relative",
        flexShrink: 0,
    },
    avatar: {
        width: 82,
        height: 82,
        borderRadius: 20,
        background: `linear-gradient(135deg, ${SOMAP_BLUE}, ${SOMAP_GREEN})`,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 26,
        fontWeight: 800,
        boxShadow: "0 16px 34px rgba(18,113,184,0.22)",
    },
    statusDot: {
        position: "absolute",
        right: -2,
        bottom: -2,
        width: 18,
        height: 18,
        borderRadius: "50%",
        border: "4px solid #fff",
        background: SOMAP_GREEN,
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
        margin: "8px 0 0",
        color: MUTED,
        fontSize: 13,
        maxWidth: 620,
        lineHeight: 1.5,
    },
    sessionCard: {
        border: "1px solid #e5edf5",
        borderRadius: 16,
        background: "#fff",
        padding: 16,
        display: "flex",
        gap: 12,
        alignItems: "center",
        boxShadow: "0 10px 28px rgba(13,45,94,0.06)",
    },
    sessionIcon: {
        width: 46,
        height: 46,
        borderRadius: 14,
        background: "rgba(126,201,51,0.13)",
        color: SOMAP_GREEN,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    sessionLabel: {
        display: "block",
        color: MUTED,
        fontSize: 11,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    sessionState: {
        display: "block",
        color: TEXT,
        fontSize: 18,
        marginTop: 3,
    },
    sessionText: {
        margin: "3px 0 0",
        color: MUTED,
        fontSize: 12,
        lineHeight: 1.4,
    },
    errorBox: {
        border: "1px solid rgba(173,35,36,0.16)",
        borderLeft: `4px solid ${SOMAP_RED}`,
        borderRadius: 14,
        background: "rgba(173,35,36,0.06)",
        color: SOMAP_RED,
        padding: "12px 14px",
        display: "flex",
        justifyContent: "space-between",
        gap: 14,
        fontSize: 13,
    },
    successBox: {
        border: "1px solid rgba(126,201,51,0.22)",
        borderLeft: `4px solid ${SOMAP_GREEN}`,
        borderRadius: 14,
        background: "rgba(126,201,51,0.10)",
        color: "#2f7d32",
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 13,
        fontWeight: 700,
    },
    contentGrid: {
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 330px",
        gap: 18,
        alignItems: "start",
    },
    contentGridCompact: {
        gridTemplateColumns: "1fr",
    },
    mainStack: {
        display: "flex",
        flexDirection: "column",
        gap: 18,
        minWidth: 0,
    },
    sideStack: {
        display: "flex",
        flexDirection: "column",
        gap: 18,
        minWidth: 0,
    },
    panel: {
        border: "1px solid #e5edf5",
        borderRadius: 16,
        background: "#fff",
        padding: 18,
        boxShadow: "0 10px 28px rgba(13,45,94,0.05)",
        minWidth: 0,
    },
    panelHeader: {
        display: "flex",
        justifyContent: "space-between",
        gap: 14,
        alignItems: "flex-start",
        marginBottom: 16,
    },
    panelHeaderCompact: {
        marginBottom: 14,
    },
    panelKicker: {
        display: "block",
        color: SOMAP_BLUE,
        fontSize: 11,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: 0.9,
        marginBottom: 4,
    },
    panelTitle: {
        margin: 0,
        color: TEXT,
        fontSize: 18,
        lineHeight: 1.2,
        fontWeight: 800,
    },
    panelSubtitle: {
        margin: "5px 0 0",
        color: MUTED,
        fontSize: 12.5,
    },
    primaryButton: {
        border: "none",
        borderRadius: 12,
        background: SOMAP_BLUE,
        color: "#fff",
        padding: "10px 13px",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 800,
        fontFamily: "inherit",
        whiteSpace: "nowrap",
    },
    secondaryButton: {
        border: "1px solid #dce7f2",
        borderRadius: 12,
        background: "#fff",
        color: MUTED,
        padding: "9px 13px",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 800,
        fontFamily: "inherit",
        whiteSpace: "nowrap",
    },
    formGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 12,
    },
    passwordGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 12,
    },
    field: {
        display: "flex",
        flexDirection: "column",
        gap: 7,
        minWidth: 0,
    },
    fieldLabel: {
        color: MUTED,
        fontSize: 11,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    forgotPasswordLink: {
        border: "none",
        background: "none",
        color: SOMAP_BLUE,
        cursor: "pointer",
        fontSize: 10.5,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        padding: 0,
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        alignSelf: "flex-start",
        marginTop: 4,
    },
    input: {
        width: "100%",
        border: "1px solid #dce7f2",
        borderRadius: 12,
        background: "#fbfdff",
        color: TEXT,
        padding: "11px 12px",
        outline: "none",
        fontSize: 13.5,
        fontFamily: "inherit",
    },
    formFooter: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginTop: 14,
        flexWrap: "wrap",
    },
    formHint: {
        margin: 0,
        color: "#8a9aad",
        fontSize: 12,
        lineHeight: 1.4,
    },
    saveButton: {
        border: "none",
        borderRadius: 12,
        background: SOMAP_GREEN,
        color: "#fff",
        padding: "10px 13px",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 800,
        fontFamily: "inherit",
        whiteSpace: "nowrap",
    },
    disabledButton: {
        opacity: 0.56,
        cursor: "not-allowed",
    },
    accountGrid: {
        display: "grid",
        gridTemplateColumns: "0.85fr 1.45fr 0.8fr",
        gap: 12,
    },
    gridCompact: {
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
    gridNarrow: {
        gridTemplateColumns: "1fr",
    },
    infoCard: {
        border: "1px solid #edf2f7",
        borderRadius: 14,
        padding: 14,
        display: "flex",
        gap: 12,
        minWidth: 0,
        background: "#fbfdff",
    },
    emailInfoCard: {
        paddingRight: 18,
    },
    infoIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    infoText: {
        minWidth: 0,
    },
    infoLabel: {
        display: "block",
        color: MUTED,
        fontSize: 11,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    infoValue: {
        display: "block",
        marginTop: 4,
        color: TEXT,
        fontSize: 15,
        lineHeight: 1.35,
        overflowWrap: "anywhere",
        wordBreak: "break-word",
        whiteSpace: "normal",
    },
    emailValue: {
        fontSize: 14,
        overflow: "visible",
        overflowWrap: "normal",
        wordBreak: "normal",
        whiteSpace: "nowrap",
    },
    infoHelper: {
        margin: "5px 0 0",
        color: "#8a9aad",
        fontSize: 11.5,
        lineHeight: 1.35,
    },
    metricsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 12,
    },
    metricCard: {
        border: "1px solid #edf2f7",
        borderRadius: 14,
        padding: 14,
        display: "flex",
        gap: 12,
        alignItems: "center",
        background: "#fbfdff",
    },
    metricIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    metricLabel: {
        display: "block",
        color: MUTED,
        fontSize: 12,
        fontWeight: 700,
    },
    metricValue: {
        display: "block",
        color: TEXT,
        fontSize: 24,
        lineHeight: 1.1,
        marginTop: 3,
    },
    profileCard: {
        border: "1px solid #e5edf5",
        borderRadius: 16,
        background: "#fff",
        padding: 22,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        boxShadow: "0 10px 28px rgba(13,45,94,0.05)",
    },
    profileAvatar: {
        width: 76,
        height: 76,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${SOMAP_BLUE}, ${SOMAP_GREEN})`,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 24,
        fontWeight: 800,
        marginBottom: 12,
    },
    profileName: {
        margin: 0,
        color: TEXT,
        fontSize: 20,
        fontWeight: 800,
    },
    profileEmail: {
        margin: "5px 0 14px",
        color: MUTED,
        fontSize: 12.5,
        overflowWrap: "anywhere",
    },
    roleBadge: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        color: SOMAP_GREEN,
        background: "rgba(126,201,51,0.12)",
        border: "1px solid rgba(126,201,51,0.22)",
        borderRadius: 999,
        padding: "7px 11px",
        fontSize: 12,
        fontWeight: 800,
    },
    actions: {
        display: "flex",
        flexDirection: "column",
        gap: 9,
    },
    actionButton: {
        width: "100%",
        border: "1px solid #e7eef6",
        borderRadius: 12,
        background: "#fbfdff",
        color: TEXT,
        padding: "11px 12px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 700,
        fontFamily: "inherit",
        textAlign: "left",
    },
    dangerPanel: {
        border: "1px solid rgba(173,35,36,0.16)",
        borderRadius: 16,
        background: "#fff",
        padding: 18,
        boxShadow: "0 10px 28px rgba(13,45,94,0.05)",
    },
    dangerHeader: {
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 14,
    },
    dangerIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        background: "rgba(173,35,36,0.09)",
        color: SOMAP_RED,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    dangerKicker: {
        display: "block",
        color: SOMAP_RED,
        fontSize: 11,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: 0.9,
        marginBottom: 4,
    },
    dangerTitle: {
        margin: 0,
        color: TEXT,
        fontSize: 17,
        lineHeight: 1.2,
        fontWeight: 800,
    },
    dangerText: {
        margin: "5px 0 0",
        color: MUTED,
        fontSize: 12,
        lineHeight: 1.45,
    },
    confirmInput: {
        width: "100%",
        border: "1px solid rgba(173,35,36,0.18)",
        borderRadius: 12,
        background: "rgba(173,35,36,0.04)",
        color: TEXT,
        padding: "10px 12px",
        outline: "none",
        fontSize: 13,
        fontFamily: "inherit",
        marginBottom: 10,
    },
    deleteButton: {
        width: "100%",
        border: "none",
        borderRadius: 12,
        background: SOMAP_RED,
        color: "#fff",
        padding: "11px 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 800,
        fontFamily: "inherit",
    },
    disabledDangerButton: {
        opacity: 0.52,
        cursor: "not-allowed",
    },
    passwordWrap: {
        position: "relative",
        width: "100%",
        display: "flex",
        alignItems: "center",
    },
    passwordInput: {
        paddingRight: 40,
    },
    eyeButton: {
        position: "absolute",
        right: 12,
        top: "50%",
        transform: "translateY(-50%)",
        border: "none",
        background: "transparent",
        color: MUTED,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        zIndex: 2,
    },
};
