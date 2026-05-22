import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Image,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
} from "react-native";

import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getHomeStats } from "../../services/homeService";
import { getAllServices } from "../../services/serviceService";
import { getNotifications } from "../../services/notificationService";
import { useAuthStore } from "../../store/authStore";
import Theme from "../../constants/theme";
import NotificationButton from "@/components/ui/NotificationButton";

const { colors, fonts, spacing, radius, shadows } = Theme;

/* ---------------- TYPES ---------------- */
type Service = {
    id: number;
    titre: string;
    description: string;
    images: {
        imageUrl: string | null;
    }[];
};

/* ---------------- HELPERS ---------------- */
const normalize = (url?: string | null) => {
    if (!url) return "https://via.placeholder.com/400";
    if (url.startsWith("http")) return url;
    return `http://10.0.2.2:8080${url}`;
};

const getSafeServiceImage = (images?: { imageUrl: string | null }[]) => {
    if (!images || images.length === 0) {
        return "https://via.placeholder.com/400";
    }

    // 1. PRIORITY: official /images/ folder (your real service images)
    const official = images.find(img =>
        img?.imageUrl?.includes("/images/")
    );

    if (official) return normalize(official.imageUrl);

    // 2. fallback: uploads (not ideal but better than nothing)
    const upload = images.find(img =>
        img?.imageUrl?.includes("/uploads/")
    );

    if (upload) return normalize(upload.imageUrl);

    return "https://via.placeholder.com/400";
};

export default function ServicesScreen() {
    const router = useRouter();

    const [search, setSearch] = useState("");
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    const { user } = useAuthStore();

    /* ---------------- FETCH STATS ---------------- */
    useEffect(() => {
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

        fetchStats();
    }, [user]);

    /* ---------------- FETCH SERVICES ---------------- */
    useEffect(() => {
        const fetchServices = async () => {
            try {
                setLoading(true);
                const data = await getAllServices();
                setServices(data);
            } catch (error) {
                console.log("Services error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchServices();
    }, []);

    /* ---------------- FILTER ---------------- */
    const filteredServices = services.filter((item) =>
        item.titre?.toLowerCase().includes(search.toLowerCase())
    );

    /* ---------------- COLORS ---------------- */
    const getServiceColor = (title: string) => {
        const lower = title?.toLowerCase() || "";

        if (lower.includes("sablage")) {
            return { bg: "rgba(18,113,184,0.10)", color: "#1271B8", icon: "hammer" };
        }

        if (lower.includes("peinture")) {
            return { bg: "rgba(19,172,213,0.10)", color: "#13ACD5", icon: "color-fill" };
        }

        if (lower.includes("traitement")) {
            return { bg: "rgba(73,198,154,0.12)", color: "#2D9C7C", icon: "water" };
        }

        return { bg: "rgba(212,160,23,0.12)", color: "#D4A017", icon: "construct" };
    };

    /* ---------------- RENDER CARD ---------------- */
    const renderItem = ({ item }: { item: Service }) => {
        const config = getServiceColor(item.titre);

        const imageUri = getSafeServiceImage(item.images);
        console.log("SERVICE DEBUG:", item.titre, item.images);
        return (
            <TouchableOpacity
                activeOpacity={0.88}
                style={styles.card}
                onPress={() => router.push(`/service/${item.id}` as any)}
            >
                <Image
                    source={{ uri: imageUri }}
                    style={styles.image}
                />

                <View style={styles.content}>
                    <View style={[styles.badge, { backgroundColor: config.bg }]}>
                        <Ionicons name={config.icon as any} size={14} color={config.color} />
                        <Text style={[styles.badgeText, { color: config.color }]}>
                            Service industriel
                        </Text>
                    </View>

                    <Text style={styles.title}>{item.titre}</Text>

                    <Text style={styles.description} numberOfLines={3}>
                        {item.description}
                    </Text>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.detailsButton}>
                            <Text style={styles.detailsText}>Voir détails</Text>
                            <Ionicons name="arrow-forward" size={16} color={colors.blue} />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    /* ---------------- LOADING ---------------- */
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.blue} />
            </View>
        );
    }

    /* ---------------- UI ---------------- */
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={["#0d2d5e", "#1271b8", "#2D9C7C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.headerLabel}>SOMAP & SERVICE</Text>
                        <Text style={styles.headerTitle}>Nos Services</Text>
                        <Text style={styles.headerSubtitle}>
                            Découvrez notre expertise industrielle
                        </Text>
                    </View>

                    <NotificationButton count={stats?.notifications || 0} />
                </View>
            </LinearGradient>

            <View style={styles.searchWrapper}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={18} color={colors.textMuted} />
                    <TextInput
                        placeholder="Rechercher un service..."
                        placeholderTextColor={colors.textMuted}
                        value={search}
                        onChangeText={setSearch}
                        style={styles.search}
                    />
                </View>
            </View>

            <FlatList
                data={filteredServices}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgScreen,
    },

    // HEADER
    header: {
        paddingTop: 30,
        paddingHorizontal: spacing.lg,
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

    headerLabel: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 11,
        letterSpacing: 1,
        fontFamily: fonts.bodyMedium,
        marginBottom: 6,
    },

    headerTitle: {
        color: "#fff",
        fontSize: 30,
        fontFamily: fonts.condensedBold,
        letterSpacing: 0.4,
    },

    headerSubtitle: {
        color: "rgba(255,255,255,0.82)",
        fontSize: 13,
        fontFamily: fonts.body,
        marginTop: 4,
    },

    // SEARCH
    searchWrapper: {
        marginTop: -18,
        paddingHorizontal: spacing.lg,
        zIndex: 10,
    },

    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.bgCard,
        borderRadius: radius.xl,
        paddingHorizontal: 14,
        height: 56,
        borderWidth: 1,
        borderColor: colors.borderLight,
        ...shadows.md,
    },

    search: {
        flex: 1,
        marginLeft: 10,
        color: colors.textPrimary,
        fontFamily: fonts.body,
        fontSize: 14,
    },

    // LIST
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingTop: 24,
        paddingBottom: 120,
    },

    // CARD
    card: {
        backgroundColor: colors.bgCard,
        borderRadius: radius.xl,
        overflow: "hidden",
        marginBottom: 18,
        borderWidth: 1,
        borderColor: colors.borderLight,
        ...shadows.md,
    },

    image: {
        width: "100%",
        height: 190,
    },

    content: {
        padding: 16,
    },

    badge: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: radius.pill,
        marginBottom: 12,
    },

    badgeText: {
        fontSize: 11,
        fontFamily: fonts.bodySemiBold,
    },

    title: {
        fontSize: 20,
        color: colors.textPrimary,
        fontFamily: fonts.condensedBold,
        marginBottom: 8,
        letterSpacing: 0.3,
    },

    description: {
        color: colors.textSecondary,
        fontFamily: fonts.body,
        fontSize: 13,
        lineHeight: 20,
    },

    footer: {
        marginTop: 16,
        flexDirection: "row",
        justifyContent: "flex-end",
    },

    detailsButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },

    detailsText: {
        color: colors.blue,
        fontSize: 13,
        fontFamily: fonts.bodySemiBold,
    },

    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.bgScreen,
    },
});
