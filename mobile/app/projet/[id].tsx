// app/projet/[id].tsx – Your original header + new minimalist body
import api from "@/services/api";
import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    RefreshControl,
    Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/store/authStore";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

// ================= Types (unchanged) =================
type Projet = {
    id: number;
    titre: string;
    description: string;
    statut: "EN_COURS" | "TERMINE" | "SUSPENDU";
    dateDebut: string;
    dateFin: string | null;
    clientId: number;
    demandeId: number | null;
};

type Demande = {
    id: number;
    objet: string;
    description: string;
    statut: string;
    urgence: string;
    serviceId: number;
    dateCreation: string;
};

type Service = {
    id: number;
    titre: string;
};

// ================= Helper Functions (unchanged) =================
const getStatusInfo = (statut: Projet["statut"]) => {
    switch (statut) {
        case "EN_COURS":
            return { label: "En cours", color: "#2D9C7C", bgLight: "#E6F7F0", icon: "sync-outline" };
        case "TERMINE":
            return { label: "Terminé", color: "#1271B8", bgLight: "#E8F1FA", icon: "checkmark-circle-outline" };
        case "SUSPENDU":
            return { label: "Suspendu", color: "#E53E3E", bgLight: "#FEF1F1", icon: "pause-outline" };
        default:
            return { label: statut, color: "#8A94A6", bgLight: "#F0F2F5", icon: "help-outline" };
    }
};

const getProgress = (statut: Projet["statut"]) => {
    switch (statut) {
        case "EN_COURS": return 60;
        case "TERMINE": return 100;
        case "SUSPENDU": return 25;
        default: return 0;
    }
};

const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Non définie";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

const formatFullDate = (dateString?: string | null) => {
    if (!dateString) return "Non définie";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
};

const getUrgenceColor = (urgence: string) => {
    switch (urgence) {
        case "URGENT": return "#EB5757";
        case "NORMAL": return "#F2C94C";
        case "FAIBLE": return "#49C69A";
        default: return "#8A94A6";
    }
};

const getDemandeStatusBadge = (statut: string) => {
    switch (statut) {
        case "EN_ATTENTE": return { label: "En attente", color: "#FF8C00", bg: "#FFF3E0" };
        case "VALIDEE": return { label: "Validée", color: "#49C69A", bg: "#E6F7F0" };
        case "REJETEE": return { label: "Rejetée", color: "#EB5757", bg: "#FEF1F1" };
        default: return { label: statut, color: "#8A94A6", bg: "#F0F2F5" };
    }
};

// ================= Main Component =================
export default function ProjectDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuthStore();
    const [project, setProject] = useState<Projet | null>(null);
    const [demande, setDemande] = useState<Demande | null>(null);
    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processing, setProcessing] = useState(false);

    const fetchProject = async () => {
        if (!id) return;
        try {
            const response = await api.get(`/projets/${id}`);
            const proj = response.data;
            setProject(proj);
            if (proj.demandeId) {
                const demandeRes = await api.get(`/demandes/${proj.demandeId}`);
                const demandeData = demandeRes.data;
                setDemande(demandeData);
                if (demandeData.serviceId) {
                    const serviceRes = await api.get(`/services/${demandeData.serviceId}`);
                    setService(serviceRes.data);
                }
            }
        } catch (error) {
            console.error("Error fetching project:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchProject(); }, [id]));

    const handleRefresh = () => {
        setRefreshing(true);
        fetchProject();
    };

    const navigateToDemande = () => {
        if (demande) router.push(`/demande/${demande.id}`);
    };

    const generateProjectHTML = () => {
        if (!project) return "";
        const statusLabel = getStatusInfo(project.statut).label;
        const progress = getProgress(project.statut);
        const demandeHtml = demande ? `
            <div style="margin-top:20px; padding-top:20px; border-top:1px solid #ddd;">
                <h3>Demande associée</h3>
                <p><strong>Objet :</strong> ${demande.objet}</p>
                <p><strong>Statut :</strong> ${demande.statut}</p>
                <p><strong>Urgence :</strong> ${demande.urgence}</p>
                ${service ? `<p><strong>Service :</strong> ${service.titre}</p>` : ""}
            </div>
        ` : "";
        return `
            <html>
            <head><style>body{font-family:Helvetica;padding:40px;} h1{color:#1271B8;}</style></head>
            <body>
                <h1>${project.titre}</h1>
                <div>Projet N° ${project.id}</div>
                <p>Statut : ${statusLabel}</p>
                <p>Progression : ${progress}%</p>
                <p>Description : ${project.description}</p>
                <p>Début : ${formatFullDate(project.dateDebut)}</p>
                <p>Fin prévue : ${formatFullDate(project.dateFin)}</p>
                ${demandeHtml}
            </body>
            </html>
        `;
    };

    const handleDownload = async () => {
        if (!project) return;
        setProcessing(true);
        try {
            const { uri } = await Print.printToFileAsync({ html: generateProjectHTML() });
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Enregistrer le projet" });
            } else Alert.alert("Erreur", "Partage indisponible");
        } catch (error) { Alert.alert("Erreur", "Impossible de générer le PDF"); }
        finally { setProcessing(false); }
    };

    const handlePrint = async () => {
        if (!project) return;
        setProcessing(true);
        try { await Print.printAsync({ html: generateProjectHTML() }); }
        catch (error) { Alert.alert("Erreur", "Impossible d'imprimer"); }
        finally { setProcessing(false); }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color="#1271B8" />
            </SafeAreaView>
        );
    }

    if (!project) {
        return (
            <SafeAreaView style={styles.center}>
                <Ionicons name="alert-circle-outline" size={64} color="#EB5757" />
                <Text style={styles.errorText}>Projet introuvable</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Retour</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const status = getStatusInfo(project.statut);
    const progress = getProgress(project.statut);
    const duration = (() => {
        if (!project.dateDebut || !project.dateFin) return "Non définie";
        const diffDays = Math.ceil((new Date(project.dateFin).getTime() - new Date(project.dateDebut).getTime()) / (1000 * 3600 * 24));
        return `${diffDays} jours`;
    })();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* === YOUR ORIGINAL HEADER (kept exactly) === */}
            <LinearGradient
                colors={["#0d2d5e", "#1271b8", "#2D9C7C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.blob1} />
                <View style={styles.blob2} />

                <View style={styles.headerTopRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButtonHeader}>
                        <Ionicons name="arrow-back" size={28} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={handleDownload} style={styles.actionButton} disabled={processing}>
                            <Ionicons name="download-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handlePrint} style={styles.actionButton} disabled={processing}>
                            <Ionicons name="print-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.headerContent}>
    <Text style={styles.headerTitle}>{project.titre}</Text>
    {/* Add the accent line like in ServiceDetails */}
    <View style={styles.titleAccent} />
    <View style={[styles.statusBadge, { backgroundColor: status.bgLight }]}>
        <Ionicons name={status.icon as any} size={14} color={status.color} />
        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
    </View>
</View>
            </LinearGradient>

            {/* === NEW MINIMALIST BODY (cards, grid, etc.) === */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#1271B8" />}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Hero progress card */}
                <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Avancement global</Text>
                        <Text style={styles.progressPercent}>{progress}%</Text>
                    </View>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: status.color }]} />
                    </View>
                    {project.statut === "EN_COURS" && (
                        <View style={styles.noteChip}>
                            <Ionicons name="time-outline" size={14} color="#2D9C7C" />
                            <Text style={styles.noteChipText}>Mise à jour régulière</Text>
                        </View>
                    )}
                </View>

                {/* Metrics grid */}
                <View style={styles.metricsGrid}>
                    <View style={styles.metricCard}>
                        <Ionicons name="calendar-outline" size={22} color="#1271B8" />
                        <Text style={styles.metricLabel}>Début</Text>
                        <Text style={styles.metricValue}>{formatDate(project.dateDebut)}</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <Ionicons name="flag-outline" size={22} color="#1271B8" />
                        <Text style={styles.metricLabel}>Fin prévue</Text>
                        <Text style={styles.metricValue}>{formatDate(project.dateFin)}</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <Ionicons name="hourglass-outline" size={22} color="#1271B8" />
                        <Text style={styles.metricLabel}>Durée</Text>
                        <Text style={styles.metricValue}>{duration}</Text>
                    </View>
                </View>

                {/* Description card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="document-text-outline" size={20} color="#1271B8" />
                        <Text style={styles.cardTitle}>Description</Text>
                    </View>
                    <Text style={styles.descriptionText}>{project.description}</Text>
                </View>

                {/* Linked demande card */}
                {demande && (
                    <TouchableOpacity activeOpacity={0.8} onPress={navigateToDemande} style={styles.linkCard}>
                        <View style={styles.linkCardContent}>
                            <View style={styles.linkIcon}>
                                <Ionicons name="git-branch-outline" size={24} color="#1271B8" />
                            </View>
                            <View style={styles.linkInfo}>
                                <Text style={styles.linkTitle}>Demande associée</Text>
                                <Text style={styles.linkSubtitle}>{demande.objet || "Sans objet"}</Text>
                                <View style={styles.linkBadges}>
                                    <View style={[styles.smallBadge, { backgroundColor: getDemandeStatusBadge(demande.statut).bg }]}>
                                        <Text style={[styles.smallBadgeText, { color: getDemandeStatusBadge(demande.statut).color }]}>
                                            {getDemandeStatusBadge(demande.statut).label}
                                        </Text>
                                    </View>
                                    <View style={[styles.smallBadge, { backgroundColor: getUrgenceColor(demande.urgence) + "20" }]}>
                                        <Text style={[styles.smallBadgeText, { color: getUrgenceColor(demande.urgence) }]}>
                                            {demande.urgence === "URGENT" ? "Urgent" : demande.urgence === "NORMAL" ? "Normal" : "Faible"}
                                        </Text>
                                    </View>
                                    {service && <Text style={styles.serviceLabel}>{service.titre}</Text>}
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#A0AAB8" />
                        </View>
                    </TouchableOpacity>
                )}

                {/* Technical info card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="information-circle-outline" size={20} color="#1271B8" />
                        <Text style={styles.cardTitle}>Informations techniques</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="server-outline" size={16} color="#8A94A6" />
                        <Text style={styles.infoText}>ID Projet : #{project.id}</Text>
                    </View>
                    {project.demandeId && (
                        <View style={styles.infoRow}>
                            <Ionicons name="link-outline" size={16} color="#8A94A6" />
                            <Text style={styles.infoText}>Demande source : #{project.demandeId}</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

// ================= Styles =================
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8F9FC" },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8F9FC" },
    errorText: { fontSize: 16, color: "#EB5757", marginTop: 12, fontWeight: "400" },
    backButton: { marginTop: 20, backgroundColor: "#1271B8", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 40 },
    backButtonText: { color: "#fff", fontWeight: "500", fontSize: 15 },
    scrollContent: { paddingTop: 16, paddingBottom: 40 },

    // ========== YOUR ORIGINAL HEADER STYLES (exactly as you had) ==========
    header: {
        paddingTop: 55,
        paddingHorizontal: 24,
        paddingBottom: 32,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: "hidden",
    },
    blob1: {
        position: "absolute",
        top: -40,
        right: -40,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: "rgba(77,184,232,0.2)",
    },
    blob2: {
        position: "absolute",
        bottom: 20,
        left: -30,
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: "rgba(73,198,154,0.12)",
    },
    headerTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    backButtonHeader: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    headerActions: {
        flexDirection: "row",
        gap: 12,
    },
    actionButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    headerContent: {
        marginTop: 8,
    },
   headerTitle: {
    fontSize: 26,
    fontWeight: "400",           // was 800, now matches condensed bold feel
    fontFamily: "System",        // or "RobotoCondensed-Bold" if you have it
    color: "#fff",
    marginBottom: 8,             // reduced to make space for accent line
    lineHeight: 32,              // matches ServiceDetails
    letterSpacing: -0.3,        // optional, gives condensed look
},
titleAccent: {
    width: 48,                   // same as ServiceDetails accent line
    height: 3,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",  // white line on gradient, or use "#1271b8" for blue
    marginBottom: 12,
    opacity: 0.9,
},
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 30,
        alignSelf: "flex-start",
    },
    statusText: {
        fontSize: 13,
        fontWeight: "600",
    },

    // ========== NEW BODY STYLES (minimalist cards) ==========
    progressCard: {
        backgroundColor: "#FFFFFF",
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 20,
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 2,
    },
    progressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    progressLabel: {
        fontSize: 14,
        fontWeight: "500",
        color: "#5A6B7F",
    },
    progressPercent: {
        fontSize: 22,
        fontWeight: "700",
        color: "#1271B8",
    },
    progressTrack: {
        height: 8,
        backgroundColor: "#EFF3F8",
        borderRadius: 4,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: 4,
    },
    noteChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 12,
        alignSelf: "flex-start",
        backgroundColor: "#E6F7F0",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 30,
    },
    noteChipText: {
        fontSize: 12,
        fontWeight: "500",
        color: "#2D9C7C",
    },

    metricsGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginHorizontal: 16,
        marginBottom: 16,
        gap: 12,
    },
    metricCard: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: 8,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    metricLabel: {
        fontSize: 11,
        fontWeight: "400",
        color: "#8A94A6",
        marginTop: 6,
        marginBottom: 2,
    },
    metricValue: {
        fontSize: 13,
        fontWeight: "500",
        color: "#1B2430",
    },

    card: {
        backgroundColor: "#FFFFFF",
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 18,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "500",
        color: "#1B2430",
    },
    descriptionText: {
        fontSize: 14,
        lineHeight: 22,
        color: "#4A5A72",
        fontWeight: "400",
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 12,
    },
    infoText: {
        fontSize: 14,
        color: "#5A6B7F",
        fontWeight: "400",
    },

    linkCard: {
        backgroundColor: "#FFFFFF",
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 1,
        overflow: "hidden",
    },
    linkCardContent: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        gap: 12,
    },
    linkIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#E8F1FA",
        alignItems: "center",
        justifyContent: "center",
    },
    linkInfo: {
        flex: 1,
    },
    linkTitle: {
        fontSize: 13,
        fontWeight: "500",
        color: "#1271B8",
        marginBottom: 2,
    },
    linkSubtitle: {
        fontSize: 14,
        fontWeight: "500",
        color: "#1B2430",
        marginBottom: 6,
    },
    linkBadges: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
    },
    smallBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
    },
    smallBadgeText: {
        fontSize: 10,
        fontWeight: "500",
    },
    serviceLabel: {
        fontSize: 11,
        fontWeight: "500",
        color: "#1271B8",
        backgroundColor: "rgba(18,113,184,0.08)",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
        overflow: "hidden",
    },
});