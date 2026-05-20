// app/projet/[id].tsx – Redesigned version
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

// ================= Types =================
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

// ================= Helper Functions =================
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
    return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatFullDate = (dateString?: string | null) => {
    if (!dateString) return "Non définie";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
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

    useFocusEffect(
        useCallback(() => {
            fetchProject();
        }, [id])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        fetchProject();
    };

    const navigateToDemande = () => {
        if (demande) {
            router.push(`/demande/${demande.id}`);
        }
    };

    // Generate HTML content for the project (used for both download and print)
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
            <head>
                <style>
                    body { font-family: 'Helvetica', sans-serif; padding: 40px; }
                    h1 { color: #1271B8; }
                    .project-id { color: #6B7A90; font-size: 14px; margin-bottom: 20px; }
                    .section { margin-bottom: 20px; }
                    .label { font-weight: bold; width: 130px; display: inline-block; }
                    .value { display: inline-block; }
                </style>
            </head>
            <body>
                <h1>${project.titre}</h1>
                <div class="project-id">Projet N° ${project.id}</div>
                <div class="section">
                    <p><span class="label">Statut :</span> <span class="value">${statusLabel}</span></p>
                    <p><span class="label">Progression :</span> <span class="value">${progress}%</span></p>
                    <p><span class="label">Description :</span> <span class="value">${project.description}</span></p>
                    <p><span class="label">Date de début :</span> <span class="value">${formatFullDate(project.dateDebut)}</span></p>
                    <p><span class="label">Date de fin prévue :</span> <span class="value">${formatFullDate(project.dateFin)}</span></p>
                </div>
                ${demandeHtml}
            </body>
            </html>
        `;
    };

    // 1. DOWNLOAD / SHARE PDF
    const handleDownload = async () => {
        if (!project) return;
        setProcessing(true);
        try {
            const html = generateProjectHTML();
            const { uri } = await Print.printToFileAsync({ html });
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: "application/pdf",
                    dialogTitle: "Enregistrer le projet",
                });
            } else {
                Alert.alert("Erreur", "Le partage n'est pas disponible sur cet appareil");
            }
        } catch (error) {
            Alert.alert("Erreur", "Impossible de générer le PDF");
        } finally {
            setProcessing(false);
        }
    };

    // 2. PRINT directly
    const handlePrint = async () => {
        if (!project) return;
        setProcessing(true);
        try {
            const html = generateProjectHTML();
            await Print.printAsync({ html });
        } catch (error) {
            Alert.alert("Erreur", "Impossible d'imprimer");
        } finally {
            setProcessing(false);
        }
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
    const startDate = formatFullDate(project.dateDebut);
    const endDate = formatFullDate(project.dateFin);

    // Calculate duration (simple approximation)
    const calculateDuration = () => {
        if (!project.dateDebut || !project.dateFin) return "Non définie";
        const start = new Date(project.dateDebut);
        const end = new Date(project.dateFin);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return `${diffDays} jours`;
    };
    const duration = calculateDuration();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header – unchanged (original design) */}
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
                    <View style={[styles.statusBadge, { backgroundColor: status.bgLight }]}>
                        <Ionicons name={status.icon as any} size={14} color={status.color} />
                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#1271B8" />}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Unified modern card */}
                <View style={styles.unifiedCard}>
                    {/* Project ID row */}
                    <View style={styles.idRow}>
                        <Ionicons name="pricetag-outline" size={18} color="#8A94A6" />
                        <Text style={styles.idText}>Projet #{project.id}</Text>
                        {project.demandeId && (
                            <View style={styles.badgeLight}>
                                <Text style={styles.badgeLightText}>Lien demande #{project.demandeId}</Text>
                            </View>
                        )}
                    </View>

                    {/* Progress section with larger percentage */}
                    <View style={styles.progressSection}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressLabel}>Avancement global</Text>
                            <Text style={styles.progressBigPercent}>{progress}%</Text>
                        </View>
                        <View style={styles.progressTrackLarge}>
                            <LinearGradient
                                colors={[status.color, status.color + "CC"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.progressFillLarge, { width: `${progress}%` }]}
                            />
                        </View>
                        {project.statut === "EN_COURS" && (
                            <View style={styles.noteChip}>
                                <Ionicons name="time-outline" size={14} color="#2D9C7C" />
                                <Text style={styles.noteChipText}>Mise à jour régulière</Text>
                            </View>
                        )}
                    </View>

                    {/* Metric chips: start, end, duration */}
                    <View style={styles.metricsRow}>
                        <View style={styles.metricItem}>
                            <Ionicons name="calendar-outline" size={20} color="#1271B8" />
                            <Text style={styles.metricLabel}>Début</Text>
                            <Text style={styles.metricValue}>{formatDate(project.dateDebut)}</Text>
                        </View>
                        <View style={styles.metricDivider} />
                        <View style={styles.metricItem}>
                            <Ionicons name="flag-outline" size={20} color="#1271B8" />
                            <Text style={styles.metricLabel}>Fin prévue</Text>
                            <Text style={styles.metricValue}>{formatDate(project.dateFin)}</Text>
                        </View>
                        <View style={styles.metricDivider} />
                        <View style={styles.metricItem}>
                            <Ionicons name="hourglass-outline" size={20} color="#1271B8" />
                            <Text style={styles.metricLabel}>Durée</Text>
                            <Text style={styles.metricValue}>{duration}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Description */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="document-text-outline" size={22} color="#1271B8" />
                            <Text style={styles.sectionTitle}>Description du projet</Text>
                        </View>
                        <Text style={styles.descriptionText}>{project.description}</Text>
                    </View>

                    <View style={styles.divider} />

                    {/* Linked Demande – redesigned card inside main card */}
                    {demande && (
                        <>
                            <TouchableOpacity activeOpacity={0.9} onPress={navigateToDemande} style={styles.demandeCard}>
                                <LinearGradient
                                    colors={["#F8FBFF", "#F2F6FC"]}
                                    style={styles.demandeGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <View style={styles.demandeHeader}>
                                        <View style={styles.demandeIconCircle}>
                                            <Ionicons name="document-text-outline" size={24} color="#1271B8" />
                                        </View>
                                        <View style={styles.demandeTitleContainer}>
                                            <Text style={styles.demandeTitle}>Demande associée</Text>
                                            <Text style={styles.demandeObjet} numberOfLines={1}>
                                                {demande.objet || "Sans objet"}
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#8A94A6" />
                                    </View>
                                    <View style={styles.demandeBadges}>
                                        <View style={[styles.badge, { backgroundColor: getDemandeStatusBadge(demande.statut).bg }]}>
                                            <Text style={[styles.badgeText, { color: getDemandeStatusBadge(demande.statut).color }]}>
                                                {getDemandeStatusBadge(demande.statut).label}
                                            </Text>
                                        </View>
                                        <View style={[styles.badge, { backgroundColor: getUrgenceColor(demande.urgence) + "20" }]}>
                                            <Text style={[styles.badgeText, { color: getUrgenceColor(demande.urgence) }]}>
                                                {demande.urgence === "URGENT" ? "Urgent" : demande.urgence === "NORMAL" ? "Normal" : "Faible"}
                                            </Text>
                                        </View>
                                        {service && (
                                            <View style={styles.serviceChip}>
                                                <Ionicons name="layers-outline" size={12} color="#1271B8" />
                                                <Text style={styles.serviceChipText}>{service.titre}</Text>
                                            </View>
                                        )}
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                            <View style={styles.divider} />
                        </>
                    )}

                    {/* Additional info */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="information-circle-outline" size={22} color="#1271B8" />
                            <Text style={styles.sectionTitle}>Informations techniques</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="server-outline" size={16} color="#8A94A6" />
                            <Text style={styles.infoText}>ID Projet : #{project.id}</Text>
                        </View>
                        {project.demandeId && (
                            <View style={styles.infoItem}>
                                <Ionicons name="link-outline" size={16} color="#8A94A6" />
                                <Text style={styles.infoText}>Demande source : #{project.demandeId}</Text>
                            </View>
                        )}
                    </View>
                </View>
                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

// ================= Redesigned Styles =================
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F4F7FC" },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F4F7FC" },
    errorText: { fontSize: 16, color: "#EB5757", marginTop: 12 },
    backButton: { marginTop: 20, backgroundColor: "#1271B8", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 40 },
    backButtonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
    scrollContent: { paddingBottom: 40 },

    // ========== HEADER (completely unchanged) ==========
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
        fontWeight: "800",
        color: "#fff",
        marginBottom: 12,
        lineHeight: 34,
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

    // ========== NEW UNIFIED CARD ==========
    unifiedCard: {
        backgroundColor: "#fff",
        borderRadius: 32,
        marginHorizontal: 20,
        marginTop: 24,
        padding: 24,
        shadowColor: "#0D2D5E",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 24,
        elevation: 8,
        borderWidth: 1,
        borderColor: "#EFF3F8",
    },
    idRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 24,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F2F5",
    },
    idText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#6B7A90",
    },
    badgeLight: {
        backgroundColor: "#F0F9FF",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeLightText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#1271B8",
    },

    progressSection: {
        marginBottom: 24,
    },
    progressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 12,
    },
    progressLabel: {
        fontSize: 15,
        fontWeight: "500",
        color: "#5A6B7F",
    },
    progressBigPercent: {
        fontSize: 28,
        fontWeight: "800",
        color: "#1271B8",
    },
    progressTrackLarge: {
        height: 12,
        backgroundColor: "#EFF3F8",
        borderRadius: 12,
        overflow: "hidden",
    },
    progressFillLarge: {
        height: "100%",
        borderRadius: 12,
    },
    noteChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 12,
        alignSelf: "flex-start",
        backgroundColor: "#E6F7F0",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 30,
    },
    noteChipText: {
        fontSize: 12,
        fontWeight: "500",
        color: "#2D9C7C",
    },

    metricsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#F8FBFE",
        borderRadius: 24,
        paddingVertical: 16,
        paddingHorizontal: 12,
        marginBottom: 24,
    },
    metricItem: {
        flex: 1,
        alignItems: "center",
        gap: 4,
    },
    metricLabel: {
        fontSize: 12,
        fontWeight: "500",
        color: "#8A94A6",
    },
    metricValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1B2430",
    },
    metricDivider: {
        width: 1,
        height: 30,
        backgroundColor: "#E0E8F0",
    },

    divider: {
        height: 1,
        backgroundColor: "#F0F2F5",
        marginVertical: 20,
    },

    section: {
        marginBottom: 8,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#1B2430",
    },
    descriptionText: {
        fontSize: 15,
        lineHeight: 24,
        color: "#4A5A72",
    },

    // Linked demande card (new design)
    demandeCard: {
        borderRadius: 24,
        overflow: "hidden",
        marginBottom: 8,
    },
    demandeGradient: {
        padding: 18,
        borderWidth: 1,
        borderColor: "#E9F0F8",
        borderRadius: 24,
    },
    demandeHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        marginBottom: 12,
    },
    demandeIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#E8F1FA",
        alignItems: "center",
        justifyContent: "center",
    },
    demandeTitleContainer: {
        flex: 1,
    },
    demandeTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1271B8",
        marginBottom: 2,
    },
    demandeObjet: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1B2430",
    },
    demandeBadges: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginLeft: 62, // align with text after icon
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 30,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: "600",
    },
    serviceChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "rgba(18,113,184,0.08)",
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 30,
    },
    serviceChipText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#1271B8",
    },

    infoItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 12,
    },
    infoText: {
        fontSize: 14,
        color: "#5A6B7F",
    },
});