import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Animated,
    SafeAreaView,
    StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import NotificationButton from "@/components/ui/NotificationButton";
import { getHomeStats } from "@/services/homeService";
import { useAuthStore } from "@/store/authStore";
import { getClientProjects } from "@/services/projectService";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

// ================= Types =================
type Project = {
    id: number;
    titre: string;
    description: string;
    statut: "EN_COURS" | "TERMINE" | "SUSPENDU";
    dateDebut?: string;
    dateFin?: string;
    clientId: number;
    demandeId?: number;
};

// ================= Helper Functions =================
const getStatusInfo = (statut: Project["statut"]) => {
    switch (statut) {
        case "EN_COURS":
            return { label: "En cours", color: "#2D9C7C", bg: "#E6F7F0", icon: "sync-outline" };
        case "TERMINE":
            return { label: "Terminé", color: "#1271B8", bg: "#E8F1FA", icon: "checkmark-circle-outline" };
        case "SUSPENDU":
            return { label: "Suspendu", color: "#E53E3E", bg: "#FEF1F1", icon: "pause-outline" };
        default:
            return { label: statut, color: "#8A94A6", bg: "#F0F2F5", icon: "help-outline" };
    }
};

const getProgress = (statut: Project["statut"]) => {
    switch (statut) {
        case "EN_COURS": return 60;
        case "TERMINE": return 100;
        case "SUSPENDU": return 25;
        default: return 0;
    }
};

const formatDate = (dateString?: string) => {
    if (!dateString) return "Non définie";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

// ================= Custom Toast =================
type ToastType = "success" | "error";

const Toast = ({ visible, message, type, onHide }: {
    visible: boolean;
    message: string;
    type: ToastType;
    onHide: () => void;
}) => {
    const translateY = useRef(new Animated.Value(-100)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 12 }),
                Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();
            const timer = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(translateY, { toValue: -100, duration: 200, useNativeDriver: true }),
                    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
                ]).start(() => onHide());
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible) return null;

    const bgColors = type === "success"
        ? ["#49C69A", "#2D9C7C"] as const
        : ["#EB5757", "#C0392B"] as const;
    const icon = type === "success" ? "checkmark-circle" : "alert-circle";

    return (
        <Animated.View
            style={[styles.toastContainer, { transform: [{ translateY }], opacity: fadeAnim }]}
        >
            <LinearGradient
                colors={bgColors}
                style={styles.toastGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                <Ionicons name={icon} size={24} color="#fff" />
                <Text style={styles.toastText}>{message}</Text>
            </LinearGradient>
        </Animated.View>
    );
};

// ================= Main Component =================
export default function ProjectsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
        visible: false,
        message: "",
        type: "success",
    });

    const fetchStats = useCallback(async () => {
        try {
            if (!user?.id) return;
            const data = await getHomeStats(user.id);
            setStats(data);
        } catch (err) {
            console.log("Stats error:", err);
        }
    }, [user?.id]);

    const fetchProjects = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }
        try {
            const data: Project[] = await getClientProjects(user.id);
            setProjects(data);
        } catch (error) {
            console.error("Failed to fetch projects:", error);
            setToast({ visible: true, message: "Erreur lors du chargement", type: "error" });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    const refreshProjectsScreen = useCallback(() => {
        void fetchStats();
        void fetchProjects();
    }, [fetchProjects, fetchStats]);

    useAutoRefresh(refreshProjectsScreen, [refreshProjectsScreen]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchProjects();
    };

    // Count projects per status
    const counts = {
        total: projects.length,
        enCours: projects.filter(p => p.statut === "EN_COURS").length,
        termine: projects.filter(p => p.statut === "TERMINE").length,
        suspendu: projects.filter(p => p.statut === "SUSPENDU").length,
    };

    const renderProject = ({ item }: { item: Project }) => {
        const status = getStatusInfo(item.statut);
        const progress = getProgress(item.statut);
        const dateLabel = item.statut === "TERMINE"
            ? `Terminé le : ${item.dateFin ? formatDate(item.dateFin) : "Date non définie"}`
            : "En cours";

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push(`/projet/${item.id}` as any)}
                style={styles.card}
            >
                {/* Left coloured stripe */}
                <View style={[styles.stripe, { backgroundColor: status.color }]} />

                <View style={styles.cardInner}>
                    <View style={styles.cardHeader}>
                        <View style={styles.titleSection}>
                            <Text style={styles.objet}>{item.titre}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                                <Ionicons name={status.icon as any} size={12} color={status.color} />
                                <Text style={[styles.statusText, { color: status.color }]}>
                                    {status.label}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.description} numberOfLines={2}>
                        {item.description}
                    </Text>

                    {/* Progress bar */}
                    <View style={styles.progressSection}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressLabel}>Progression</Text>
                            <Text style={styles.progressPercent}>{progress}%</Text>
                        </View>
                        <View style={styles.progressTrack}>
                            <LinearGradient
                                colors={[status.color, status.color + "CC"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.progressFill, { width: `${progress}%` }]}
                            />
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Ionicons name="calendar-outline" size={14} color="#8A94A6" />
                        <Text style={styles.date}>{dateLabel}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#1271B8" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0d2d5e" translucent={false} />

            {/* HEADER with gradient */}
            <LinearGradient
                colors={["#0d2d5e", "#1271b8", "#2D9C7C"] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.blob1} />
                <View style={styles.blob2} />

                <View style={styles.headerTop}>
                    <View style={styles.headerLeft}>
                        <View>
                            <Text style={styles.headerLabel}>SOMAP & SERVICE</Text>
                            <Text style={styles.headerTitle}>Mes Projets</Text>
                            <Text style={styles.headerSubtitle}>
                                {counts.total} projet{counts.total > 1 ? "s" : ""} en suivi
                            </Text>
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <NotificationButton count={stats?.notifications || 0} />
                    </View>
                </View>
            </LinearGradient>

            {/* Stats summary */}
            {projects.length > 0 && (
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{counts.enCours}</Text>
                        <Text style={styles.statLabel}>En cours</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{counts.termine}</Text>
                        <Text style={styles.statLabel}>Terminés</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{counts.suspendu}</Text>
                        <Text style={styles.statLabel}>Suspendus</Text>
                    </View>
                </View>
            )}

            <FlatList
                data={projects}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderProject}
                contentContainerStyle={[styles.listContent, { paddingBottom: 110 + insets.bottom }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1271B8" />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={64} color="#BCD4EA" />
                        <Text style={styles.emptyText}>Aucun projet trouvé</Text>
                        <Text style={styles.emptySubText}>
                            Les projets sont créés automatiquement à partir de vos demandes validées.
                        </Text>
                    </View>
                }
            />

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast(prev => ({ ...prev, visible: false }))}
            />
        </SafeAreaView>
    );
}

// ================= Modernised Styles =================
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8FAFE" },

    // Header
    header: {
        paddingTop: 30,
        paddingHorizontal: 20,
        paddingBottom: 28,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: "hidden",
    },
    blob1: {
        position: "absolute",
        top: -40,
        right: -40,
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: "rgba(77,184,232,0.16)",
    },
    blob2: {
        position: "absolute",
        bottom: 16,
        left: -24,
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: "rgba(73,198,154,0.10)",
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        zIndex: 2,
    },
    headerLeft: { flex: 1 },
    headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
    headerLabel: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 11,
        letterSpacing: 1,
        fontWeight: "500",
        marginBottom: 6,
    },
    headerTitle: {
        color: "#fff",
        fontSize: 30,
        fontWeight: "800",
        letterSpacing: 0.4,
    },
    headerSubtitle: {
        color: "rgba(255,255,255,0.85)",
        fontSize: 13,
        marginTop: 4,
    },

    // Stats row
    statsRow: {
        flexDirection: "row",
        backgroundColor: "#fff",
        marginHorizontal: 16,
        marginTop: -18,
        borderRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        justifyContent: "space-between",
        zIndex: 2,
    },
    statItem: { flex: 1, alignItems: "center" },
    statValue: { fontSize: 20, fontWeight: "800", color: "#1B2430" },
    statLabel: { fontSize: 12, color: "#8A94A6", marginTop: 2 },
    statDivider: { width: 1, backgroundColor: "#E8EEF5", marginHorizontal: 8 },

    // List & Cards
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    listContent: { padding: 16, paddingTop: 20, paddingBottom: 100 },
    card: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderRadius: 20,
        marginBottom: 14,
        shadowColor: "#0D2D5E",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
        overflow: "hidden",
    },
    stripe: {
        width: 6,
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 20,
    },
    cardInner: {
        flex: 1,
        padding: 16,
        paddingLeft: 14,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 10,
    },
    titleSection: { flex: 1, marginRight: 8 },
    objet: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1B2430",
        marginBottom: 6,
        lineHeight: 22,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        alignSelf: "flex-start",
    },
    statusText: { fontSize: 11, fontWeight: "600", marginLeft: 4 },
    description: {
        fontSize: 13,
        color: "#6B7A90",
        lineHeight: 18,
        marginBottom: 12,
    },
    progressSection: { marginBottom: 12 },
    progressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    progressLabel: { fontSize: 11, color: "#8A94A6", fontWeight: "500" },
    progressPercent: { fontSize: 11, fontWeight: "700", color: "#1271B8" },
    progressTrack: {
        height: 6,
        backgroundColor: "#E8EEF5",
        borderRadius: 3,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: 3,
    },
    footer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 4,
    },
    date: { fontSize: 12, color: "#8A94A6" },

    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 80,
        paddingHorizontal: 24,
    },
    emptyText: { fontSize: 16, color: "#8A94A6", marginTop: 12, fontWeight: "600" },
    emptySubText: { fontSize: 13, color: "#A0AABF", textAlign: "center", marginTop: 8 },

    // Toast
    toastContainer: { position: "absolute", top: 60, left: 20, right: 20, zIndex: 1000 },
    toastGradient: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 60,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    toastText: { color: "#fff", fontSize: 15, fontWeight: "600", flex: 1 },
});
