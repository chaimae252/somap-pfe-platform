import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Modal,
    Animated,
    SafeAreaView,
    StatusBar,
    TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "@/services/api";
import { LinearGradient } from "expo-linear-gradient";
import NotificationButton from "@/components/ui/NotificationButton";
import { getHomeStats } from "@/services/homeService";
import { getNotifications } from "@/services/notificationService";
import { useAuthStore } from "@/store/authStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Demande = {
    id: number;
    objet: string;
    description: string;
    statut: "EN_ATTENTE" | "VALIDEE" | "REJETEE";
    dateCreation: string;
    urgence: "FAIBLE" | "NORMAL" | "URGENT";
    clientId: number;
    serviceId: number;
};

type Service = {
    id: number;
    titre: string;
};

// ================= CUSTOM TOAST =================
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

export default function HomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const [demandes, setDemandes] = useState<Demande[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
        visible: false,
        message: "",
        type: "success",
    });
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [selectedDemandeId, setSelectedDemandeId] = useState<number | null>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            if (!user?.id) return;
            const data = await getHomeStats(user.id);
            const notificationsData = await getNotifications(user.id);
            const unreadNotifications = notificationsData.filter((notification: any) =>
                notification.lu === 0 ||
                notification.lu === "0" ||
                notification.lu === false
            ).length;

            setStats({
                ...data,
                notifications: unreadNotifications,
            });
        } catch (err) {
            console.log("Stats error:", err);
        }
    };

    const fetchServices = async () => {
        try {
            const response = await api.get("/services");
            setServices(response.data);
        } catch (error) {
            console.error("Error fetching services:", error);
        }
    };

    const fetchDemandes = async () => {
        try {
            const clientIdStr = await AsyncStorage.getItem("userId");
            if (!clientIdStr) {
                setLoading(false);
                return;
            }
            const clientId = parseInt(clientIdStr, 10);
            const response = await api.get(`/demandes/client/${clientId}`);
            const filteredDemandes = response.data.filter(
                (demande: Demande) => demande.clientId === clientId
            );
            setDemandes(filteredDemandes);
        } catch (error) {
            console.error(error);
            setToast({ visible: true, message: "Erreur lors du chargement", type: "error" });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchStats();
            fetchServices();
            fetchDemandes();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchServices();
        fetchDemandes();
    };

    const handleDeletePress = (id: number) => {
        setSelectedDemandeId(id);
        setDeleteModalVisible(true);
    };

    const confirmDelete = async () => {
        if (selectedDemandeId === null) return;
        setDeleteModalVisible(false);
        try {
            await api.delete(`/demandes/${selectedDemandeId}`);
            setToast({ visible: true, message: "Demande supprimée avec succès", type: "success" });
            fetchDemandes();
        } catch (error) {
            setToast({ visible: true, message: "Impossible de supprimer", type: "error" });
        } finally {
            setSelectedDemandeId(null);
        }
    };

    const getServiceTitle = (serviceId: number) => {
        const service = services.find(s => s.id === serviceId);
        return service ? service.titre : "Service inconnu";
    };

    const getStatusColor = (statut: string) => {
        switch (statut) {
            case "EN_ATTENTE": return "#FF8C00";
            case "VALIDEE": return "#49C69A";
            case "REJETEE": return "#EB5757";
            default: return "#8A94A6";
        }
    };

    const getUrgenceColor = (urgence: string) => {
        switch (urgence) {
            case "URGENT": return "#EB5757";
            case "NORMAL": return "#F2C94C";
            case "FAIBLE": return "#49C69A";
            default: return "#8A94A6";
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const renderDemande = ({ item }: { item: Demande }) => {
        const serviceName = getServiceTitle(item.serviceId);
        return (
            <View style={styles.card}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push(`/demande/${item.id}` as any)}
                    style={styles.cardContent}
                >
                    <View style={styles.cardHeader}>
                        <View style={styles.titleContainer}>
                            <Text style={styles.objet}>{item.objet || "Sans objet"}</Text>
                            <View style={styles.serviceBadge}>
                                <Ionicons name="layers-outline" size={12} color="#1271B8" />
                                <Text style={styles.serviceText}>{serviceName}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statut) }]}>
                                <Text style={styles.statusText}>
                                    {item.statut === "EN_ATTENTE" ? "En attente" : item.statut === "VALIDEE" ? "Validée" : "Rejetée"}
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.urgenceBadge, { backgroundColor: getUrgenceColor(item.urgence) }]}>
                            <Text style={styles.urgenceText}>
                                {item.urgence === "URGENT" ? "Urgent" : item.urgence === "NORMAL" ? "Normal" : "Faible"}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                    <View style={styles.footer}>
                        <Ionicons name="calendar-outline" size={14} color="#8A94A6" />
                        <Text style={styles.date}>Créée le {formatDate(item.dateCreation)}</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => router.push(`/demande/edit/${item.id}` as any)}>
                        <Ionicons name="pencil-outline" size={20} color="#1271B8" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeletePress(item.id)}>
                        <Ionicons name="trash-outline" size={20} color="#EB5757" />
                    </TouchableOpacity>
                </View>
            </View>
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

            {/* HEADER — matches ServicesScreen style */}
            <LinearGradient
                colors={["#0d2d5e", "#1271b8", "#2D9C7C"] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                {/* Decorative blobs */}
                <View style={styles.blob1} />
                <View style={styles.blob2} />

                <View style={styles.headerTop}>
                    {/* Left: back button + title block */}
                    <View style={styles.headerLeft}>
                        <View>
                            <Text style={styles.headerLabel}>SOMAP & SERVICE</Text>
                            <Text style={styles.headerTitle}>Mes Demandes</Text>
                            <Text style={styles.headerSubtitle}>Gérez vos demandes en cours</Text>
                        </View>
                    </View>

                    {/* Right: notification + add */}
                    <View style={styles.headerRight}>
                        <NotificationButton count={stats?.notifications || 0} />
                        <TouchableOpacity style={styles.addButton} onPress={() => router.push("/demande/create")}>
                            <Ionicons name="add" size={28} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            <FlatList
                data={demandes}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderDemande}
                contentContainerStyle={[styles.listContent, { paddingBottom: 110 + insets.bottom }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={64} color="#BCD4EA" />
                        <Text style={styles.emptyText}>Aucune demande trouvée</Text>
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={() => router.push("/demande/create")}
                        >
                            <Text style={styles.createButtonText}>Créer une demande</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* Delete confirmation modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={deleteModalVisible}
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <LinearGradient colors={["#fff", "#f8f9fc"] as const} style={styles.modalGradient}>
                            <Ionicons name="alert-circle" size={60} color="#EB5757" style={styles.modalIcon} />
                            <Text style={styles.modalTitle}>Confirmation</Text>
                            <Text style={styles.modalMessage}>
                                Voulez-vous vraiment supprimer cette demande ?
                            </Text>
                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setDeleteModalVisible(false)}>
                                    <Text style={styles.cancelButtonText}>Annuler</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.modalButton, styles.deleteButton]} onPress={confirmDelete}>
                                    <LinearGradient
                                        colors={["#EB5757", "#C0392B"] as const}
                                        style={styles.deleteGradient}
                                    >
                                        <Text style={styles.deleteButtonText}>Supprimer</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </View>
                </View>
            </Modal>

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast(prev => ({ ...prev, visible: false }))}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F4F7FB" },

    // ── HEADER (mirrors ServicesScreen) ──────────────────────────
    header: {
        paddingTop: 30,
        paddingHorizontal: 20,
        paddingBottom: 35,
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
    headerLeft: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 4,
        flex: 1,
    },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    backButton: {
        padding: 4,
        marginTop: 18,  // aligns with title vertically
        marginRight: 4,
    },
    addButton: {
        padding: 4,
    },
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
        color: "rgba(255,255,255,0.82)",
        fontSize: 13,
        marginTop: 4,
    },

    // ── LIST & CARDS ──────────────────────────────────────────────
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    listContent: { padding: 16, paddingTop: 20, paddingBottom: 100 },
    card: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 16,
        marginBottom: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: "#E8EEF5",
    },
    cardContent: { flex: 1 },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
    titleContainer: { flex: 1, marginRight: 8 },
    objet: { fontSize: 16, fontWeight: "700", color: "#1B2430", marginBottom: 6 },
    serviceBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "rgba(18,113,184,0.08)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 16,
        alignSelf: "flex-start",
        marginBottom: 6,
    },
    serviceText: { fontSize: 11, fontWeight: "600", color: "#1271B8" },
    statusBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusText: { fontSize: 11, fontWeight: "600", color: "#fff" },
    urgenceBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    urgenceText: { fontSize: 11, fontWeight: "700", color: "#fff" },
    description: { fontSize: 13, color: "#6B7A90", lineHeight: 18, marginBottom: 12 },
    footer: { flexDirection: "row", alignItems: "center", gap: 6 },
    date: { fontSize: 12, color: "#8A94A6" },
    cardActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 20,
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#F0F2F5",
        paddingTop: 12,
    },
    emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 80 },
    emptyText: { fontSize: 16, color: "#8A94A6", marginTop: 12, marginBottom: 20 },
    createButton: { backgroundColor: "#1271B8", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 30 },
    createButtonText: { color: "#fff", fontWeight: "600" },

    // ── TOAST ─────────────────────────────────────────────────────
    toastContainer: { position: "absolute", top: 60, left: 20, right: 20, zIndex: 1000 },
    toastGradient: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 60, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
    toastText: { color: "#fff", fontSize: 15, fontWeight: "600", flex: 1 },

    // ── MODAL ─────────────────────────────────────────────────────
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
    modalContainer: { width: "80%", borderRadius: 28, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10 },
    modalGradient: { padding: 24, alignItems: "center" },
    modalIcon: { marginBottom: 16 },
    modalTitle: { fontSize: 22, fontWeight: "800", color: "#1B2430", marginBottom: 12 },
    modalMessage: { fontSize: 16, color: "#6B7A90", textAlign: "center", marginBottom: 24, lineHeight: 22 },
    modalButtons: { flexDirection: "row", justifyContent: "space-between", gap: 12, width: "100%" },
    modalButton: { flex: 1, borderRadius: 40, overflow: "hidden" },
    cancelButton: { backgroundColor: "#F0F2F5", paddingVertical: 12, alignItems: "center" },
    cancelButtonText: { fontSize: 16, fontWeight: "600", color: "#6B7A90" },
    deleteButton: { overflow: "hidden" },
    deleteGradient: { paddingVertical: 12, alignItems: "center" },
    deleteButtonText: { fontSize: 16, fontWeight: "600", color: "#fff" },
});
