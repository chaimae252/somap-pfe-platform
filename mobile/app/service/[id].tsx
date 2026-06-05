import React, { useCallback, useEffect, useState, useRef } from "react";

import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Animated,
    Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Theme from "../../constants/theme";
import { API_ORIGIN } from "../../services/api";
import { getServiceById } from "../../services/serviceService";
import CommentsSheet from "../../components/comments/CommentsSheet";
import { useAuthStore } from "../../store/authStore";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

const { colors, fonts, spacing, radius, shadows } = Theme;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

/* ---------------- HELPERS ---------------- */

const normalize = (url?: string | null) => {
    if (!url) return "https://via.placeholder.com/400";
    if (url.startsWith("http")) return url;
    return `${API_ORIGIN}${url}`;
};

const getSafeImages = (images?: { imageUrl: string | null }[]) => {
    if (!images || images.length === 0) {
        return ["https://via.placeholder.com/400"];
    }
    return images.map((img) => normalize(img.imageUrl));
};

/* -------------------------------------------------- */

export default function ServiceDetails() {
    const { id, openComments } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const insets = useSafeAreaInsets();

    const [service, setService] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeImg, setActiveImg] = useState(0);
    const [commentsVisible, setCommentsVisible] = useState(false);

    useEffect(() => {
        if (openComments === "true") {
            setCommentsVisible(true);
        }
    }, [openComments]);

    const slideAnim = useRef(new Animated.Value(28)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;

    /* ---------------- FETCH ---------------- */
    const fetchService = useCallback(async () => {
        try {
            const data = await getServiceById(id as string);
            setService(data);
        } catch (error) {
            console.log("DETAILS ERROR:", error);
        } finally {
            setLoading(false);
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 480, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 420, useNativeDriver: true }),
            ]).start();
        }
    }, [fadeAnim, id, slideAnim]);

    useAutoRefresh(fetchService, [fetchService]);

    /* ---------------- IMAGES (MOVED UP) ---------------- */
    const serviceImages = service?.images;

    const images = getSafeImages(serviceImages || []);

    /* ---------------- AUTO LOOP SLIDER ---------------- */
    useEffect(() => {
        if (!images || images.length <= 1) return;

        const interval = setInterval(() => {
            setActiveImg((prev) => (prev + 1) % images.length);
        }, 3000); // ⏱ change every 3s

        return () => clearInterval(interval);
    }, [images.length]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1271b8" />
                <Text style={styles.loadingText}>Chargement…</Text>
            </View>
        );
    }
    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor="#0d2d5e" translucent={false} />

            <TouchableOpacity
                style={styles.fabBack}
                onPress={() => router.back()}
                activeOpacity={0.8}
            >
                <Ionicons name="arrow-back" size={20} color="#1a2e4a" />
            </TouchableOpacity>

            <ScrollView contentContainerStyle={{ paddingBottom: 130 + insets.bottom }}>

                {/* ── HERO + AUTO LOOP GALLERY ── */}
                <View style={styles.heroContainer}>

                    {/* MAIN IMAGE */}
                    <Image
                        source={{ uri: images[activeImg] }}
                        style={styles.heroImage}
                        resizeMode="cover"
                    />


                    {/* gradient */}
                    <LinearGradient
                        colors={["transparent", "rgba(244,247,251,0.92)"]}
                        style={styles.heroGradient}
                    />

                    {/* chip */}
                    <View style={styles.chipWrap}>
                        <View style={styles.chip}>
                            <Ionicons name="construct-outline" size={13} color="#1271b8" />
                            <Text style={styles.chipText}>Service industriel</Text>
                        </View>
                    </View>
                </View>

                {/* ── CONTENT ── */}
                <Animated.View
                    style={[
                        styles.card,
                        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                    ]}
                >
                    <Text style={styles.title}>{service?.titre}</Text>

                    <View style={styles.accentLine} />

                    <Text style={styles.description}>{service?.description}</Text>

                    <View style={styles.simpleBox}>
                        <Text style={styles.simpleTitle}>Nos prestations</Text>

                        <Text style={styles.simpleText}>
                            • Étude et analyse du besoin{"\n"}
                            • Mise en œuvre de solutions adaptées{"\n"}
                            • Exécution selon normes industrielles{"\n"}
                            • Contrôle et suivi qualité
                        </Text>
                    </View>
                </Animated.View>
            </ScrollView>

            {/* ── CTA ── */}
            <View style={[styles.bottomBar, { paddingBottom: 14 + insets.bottom }]}>
                <TouchableOpacity
                    style={styles.ctaSecondary}
                    onPress={() => setCommentsVisible(true)}
                >
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color="#1271b8" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.ctaButton}
                    onPress={() =>
                        router.push({
                            pathname: "/demande/create",
                            params: {
                                serviceId: service?.id,
                            },
                        })
                    }
                >
                    <LinearGradient
                        colors={["#1271b8", "#0d5c9e"]}
                        style={styles.ctaGradient}
                    >
                        <Text style={styles.ctaText}>Faire une demande</Text>
                        <Ionicons name="arrow-forward" size={17} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {commentsVisible && (
                <CommentsSheet
                    serviceId={Number(id)}
                    clientId={user?.id}
                    onClose={() => setCommentsVisible(false)}
                />
            )}

        </SafeAreaView>
    );
}

/* ──────────────── STYLES ──────────────── */

const styles = StyleSheet.create({

    safe: {
        flex: 1,
        backgroundColor: "#F4F7FB",
    },

    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F4F7FB",
        gap: 12,
    },

    loadingText: {
        color: "#7a8fa6",
        fontSize: 14,
        fontFamily: fonts.body,
    },

    /* ── Floating back btn ── */

    fabBack: {
        position: "absolute",
        top: 54,
        left: 18,
        zIndex: 20,
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#ffffffee",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.10,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 6,
    },

    thumb: {
        width: 110,
        height: 80,
        borderRadius: 14,
        backgroundColor: "#d9e3ef",
        marginRight: 10,
        opacity: 0.75,
    },

    topGalleryContainer: {
        flexDirection: "row",
        width: SCREEN_WIDTH,
        height: 310,
    },

    mainImageWrap: {
        flex: 1,
        position: "relative",
    },

    thumbColumn: {
        width: 90,
        backgroundColor: "#F4F7FB",
        paddingHorizontal: 8,
    },

    thumbVertical: {
        width: 70,
        height: 70,
        borderRadius: 12,
        marginBottom: 10,
        backgroundColor: "#d9e3ef",
        opacity: 0.75,
    },

    thumbActive: {
        borderWidth: 2,
        borderColor: "#1271b8",
        opacity: 1,
    },

    heroGradient: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 140,
        backgroundColor: "rgba(0,0,0,0.05)", // 👈 subtle dark layer
    },

    /* ── Hero ── */

    heroWrapper: {
        width: SCREEN_WIDTH,
        height: 310,
        backgroundColor: "#d9e3ef",
    },

    dotRow: {
        position: "absolute",
        bottom: 46,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "center",
        gap: 6,
    },

    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "rgba(18,113,184,0.30)",
    },

    dotActive: {
        width: 20,
        backgroundColor: "#1271b8",
    },

    chipWrap: {
        position: "absolute",
        bottom: 23,
        left: 20,
    },

    chip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: "rgba(18,113,184,0.12)", // soft blue glass effect
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(18,113,184,0.25)",
    },

    chipText: {
        color: "#1271b8", // main blue
        fontSize: 11,
        fontFamily: fonts.bodySemiBold,
        letterSpacing: 0.4,
    },

    simpleBox: {
        marginTop: 18,
        backgroundColor: "#F4F7FB",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#E2EBF4",
    },

    simpleTitle: {
        fontSize: 15,
        color: "#1a2e4a",
        fontFamily: fonts.bodySemiBold,
        marginBottom: 10,
    },

    simpleText: {
        fontSize: 13,
        color: "#5a6e82",
        fontFamily: fonts.body,
        lineHeight: 20,
    },
    /* ── Card ── */

    card: {
        backgroundColor: "#fff",
        marginHorizontal: 14,
        marginTop: -18,
        borderRadius: 24,
        padding: 24,
        shadowColor: "#1a2e4a",
        shadowOpacity: 0.07,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 6 },
        elevation: 5,
    },

    title: {
        fontSize: 26,
        color: "#1a2e4a",
        fontFamily: fonts.condensedBold,
        lineHeight: 32,
        marginBottom: 12,
    },

    accentLine: {
        width: 48,
        height: 3,
        borderRadius: 2,
        backgroundColor: "#1271b8",
        marginBottom: 16,
    },

    description: {
        color: "#5a6e82",
        lineHeight: 24,
        fontSize: 14,
        fontFamily: fonts.body,
        marginBottom: 24,
    },

    /* ── Sections ── */

    section: {
        marginTop: 28,
    },

    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },

    sectionTitle: {
        fontSize: 17,
        color: "#1a2e4a",
        fontFamily: fonts.bodySemiBold,
        marginBottom: 14,
    },

    sectionCount: {
        fontSize: 12,
        color: "#7a8fa6",
        fontFamily: fonts.body,
    },

    /* ── Feature grid (2×2) ── */

    featureGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },

    featureCard: {
        width: "47%",
        backgroundColor: "#F4F7FB",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#E2EBF4",
    },

    featureIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: "#EAF2FB",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
    },

    featureLabel: {
        fontSize: 13,
        color: "#2a3f55",
        fontFamily: fonts.bodySemiBold,
        lineHeight: 18,
    },

    /* ── Bottom CTA ── */

    bottomBar: {
        position: "absolute",
        bottom: 0,
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: "#fffffff5",
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 28,
        borderTopWidth: 1,
        borderColor: "#E2EBF4",
    },

    ctaSecondary: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: "#EAF2FB",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(18,113,184,0.20)",
    },

    ctaButton: {
        flex: 1,
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#1271b8",
        shadowOpacity: 0.28,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },

    ctaGradient: {
        height: 52,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },

    ctaText: {
        color: "#fff",
        fontSize: 15,
        fontFamily: fonts.bodySemiBold,
        letterSpacing: 0.2,
    },

    heroContainer: {
        flexDirection: "row",
        width: SCREEN_WIDTH,
        height: 310,
    },

    heroImage: {
        width: SCREEN_WIDTH,
        height: 310,
    },

    rightStrip: {
        width: SCREEN_WIDTH * 0.25,
        height: 310,
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        paddingVertical: 10,
        overflow: "hidden",
    },

    blurBg: {
        ...StyleSheet.absoluteFillObject,
        width: "100%",
        height: "100%",
    },

    blurOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255,255,255,0.25)",
    },

    sideThumb: {
        width: 55,
        height: 55,
        borderRadius: 12,
        marginVertical: 6,
        borderWidth: 2,
        borderColor: "transparent",
    },

    sideThumbActive: {
        borderColor: "#1271b8",
        transform: [{ scale: 1.05 }],
    },
});
