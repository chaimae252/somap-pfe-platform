import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SectionList,
    StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import Theme from "../../constants/theme";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { getNotifications, markNotificationAsRead } from "../../services/notificationService";
import { useAuthStore } from "@/store/authStore";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

const { colors, fonts, spacing, radius, shadows } = Theme;

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "Toutes" | "Non lues" | "Demandes" | "Projets" | "Commentaires" | "Système";

type Notification = {
    id: string;
    title: string;
    message: string;
    time: string;
    icon: keyof typeof Ionicons.glyphMap;
    accentColor: string;
    accentBg: string;
    tagLabel: string;
    tagColor: string;
    tagBg: string;
    unread: boolean;
    category: Exclude<Category, "Toutes" | "Non lues">;
    targetType?: string;
    targetId?: number | string;
};

const FILTERS: Category[] = ["Toutes", "Non lues", "Demandes", "Projets", "Commentaires", "Système"];

// ─── Type config ──────────────────────────────────────────────────────────────
// Matching is done case-insensitively + trimmed so "demande", "DEMANDE",
// " Demande " all map correctly regardless of what the API sends back.

function getTypeConfig(rawType: string) {
    const type = String(rawType ?? "")
        .trim()
        .toUpperCase();

    console.log("🔥 NORMALIZED TYPE:", type);

    if (type === "DEMANDE") {
        return {
            icon: "document-text" as keyof typeof Ionicons.glyphMap,
            accentColor: "#22c55e",
            accentBg: "rgba(34,197,94,0.14)",
            tagColor: "#15803d",
            tagBg: "rgba(34,197,94,0.14)",
            category: "Demandes" as Exclude<Category, "Toutes" | "Non lues">,
            tagLabel: "Demande",
        };
    }

    if (type === "PROJET") {
        return {
            icon: "stats-chart" as keyof typeof Ionicons.glyphMap,
            accentColor: "#1271b8",
            accentBg: "rgba(18,113,184,0.14)",
            tagColor: "#0d4a8a",
            tagBg: "rgba(18,113,184,0.14)",
            category: "Projets" as Exclude<Category, "Toutes" | "Non lues">,
            tagLabel: "Projet",
        };
    }

    if (type === "COMMENTAIRE") {
        return {
            icon: "chatbubble-ellipses" as keyof typeof Ionicons.glyphMap,
            accentColor: "#5BAF97",
            accentBg: "rgba(91,175,151,0.16)",
            tagColor: "#2F7D68",
            tagBg: "rgba(91,175,151,0.16)",
            category: "Commentaires" as Exclude<Category, "Toutes" | "Non lues">,
            tagLabel: "Commentaire",
        };
    }

    // SYSTEME
    if (type === "SYSTEME" || type === "ADMIN_MESSAGE") {
        return {
            icon: "notifications" as keyof typeof Ionicons.glyphMap,
            accentColor: "#f59e0b",
            accentBg: "rgba(245,158,11,0.14)",
            tagColor: "#854f0b",
            tagBg: "rgba(245,158,11,0.14)",
            category: "Système" as Exclude<Category, "Toutes" | "Non lues">,
            tagLabel: type === "ADMIN_MESSAGE" ? "Admin" : "Système",
        };
    }

    // fallback
    console.log("⚠️ UNKNOWN TYPE:", type);

    return {
        icon: "help-circle" as keyof typeof Ionicons.glyphMap,
        accentColor: "#6b7280",
        accentBg: "rgba(107,114,128,0.14)",
        tagColor: "#4b5563",
        tagBg: "rgba(107,114,128,0.14)",
        category: "Système" as Exclude<Category, "Toutes" | "Non lues">,
        tagLabel: type || "Inconnu",
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByDay(notifications: Notification[]) {
    const today: Notification[] = [];
    const other: Notification[] = [];

    notifications.forEach((n) => {
        if (n.time.includes("Aujourd") || n.time.includes("Il y a")) {
            today.push(n);
        } else {
            other.push(n);
        }
    });

    const sections = [];
    if (today.length) sections.push({ title: "Aujourd'hui", data: today });
    if (other.length) sections.push({ title: "Plus tôt",    data: other });
    return sections;
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function NotifCard({
                       item,
                   }: {
    item: Notification;
}) {
    return (
        <View
            style={[
                styles.card,
                { borderLeftColor: item.accentColor },
            ]}
        >
            <View style={[styles.iconWrap, { backgroundColor: item.accentBg }]}>
                <Ionicons name={item.icon} size={20} color={item.accentColor} />
                {item.unread && <View style={styles.unreadDot} />}
            </View>

            <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                    <Text
                        style={styles.cardTitle}
                    >
                        {item.title}
                    </Text>
                    <Text style={styles.cardTime}>{item.time}</Text>
                </View>

                <Text style={styles.cardMsg} numberOfLines={2}>
                    {item.message}
                </Text>

                <View style={styles.cardFooter}>
                    <View style={[styles.tag, { backgroundColor: item.tagBg }]}>
                        <Text style={[styles.tagTxt, { color: item.tagColor }]}>
                            {item.tagLabel}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
    const [activeFilter, setActiveFilter] = useState<Category>("Toutes");
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [markingAllRead, setMarkingAllRead] = useState(false);

    const router = useRouter();

    // 🔥 GET AUTH USER FROM ZUSTAND
    const user = useAuthStore((state) => state.user);
    const clientId = user?.id;

    const unreadCount = notifications.filter((n) => n.unread).length;

    const filtered = notifications.filter((n) => {
        if (activeFilter === "Toutes")   return true;
        if (activeFilter === "Non lues") return n.unread;
        return n.category === activeFilter;
    });

    const sections = groupByDay(filtered);

    useEffect(() => {
        console.log("🔥 AUTH USER:", user);
        console.log("🔥 CLIENT ID USED:", clientId);
    }, [user, clientId]);

    const loadNotifications = useCallback(async () => {
        if (!clientId) {
            console.log("No clientId found yet");
            setLoading(false);
            return;
        }

        try {
            console.log("🚀 fetching notifications for client:", clientId);

            const data = await getNotifications(clientId);

            console.log("📡 RAW API DATA:", JSON.stringify(data, null, 2));

            const formatted: Notification[] = data.map((n: any) => {
                console.log("📌 RAW NOTIF:", n);

                // normalize type safely
                const rawType = String(n.type ?? "")
                    .trim()
                    .toUpperCase();

                const cfg = getTypeConfig(rawType);

                // lu = 0 => unread
                const isUnread =
                    n.lu === 0 ||
                    n.lu === "0" ||
                    n.lu === false;

                // IMPORTANT FIX
                const rawDate = n.date_envoi ?? n.dateEnvoi;

                return {
                    id: String(n.id),

                    title: n.titre ?? "",
                    message: n.message ?? "",

                    time: rawDate
                        ? new Date(rawDate).toLocaleString("fr-FR")
                        : "Date inconnue",

                    unread: isUnread,

                    category: cfg.category,

                    icon: cfg.icon,
                    accentColor: cfg.accentColor,
                    accentBg: cfg.accentBg,

                    tagLabel: cfg.tagLabel,
                    tagColor: cfg.tagColor,
                    tagBg: cfg.tagBg,
                    targetType: n.targetType ?? n.target_type,
                    targetId: n.targetId ?? n.target_id,
                };
            });

            console.log("✅ FORMATTED:", formatted);
            console.log(`📊 Total: ${formatted.length} | Unread: ${formatted.filter(f => f.unread).length}`);

            setNotifications(formatted);
        } catch (err) {
            console.log("❌ Notification error:", err);
        } finally {
            setLoading(false);
        }
    }, [clientId]);

    useAutoRefresh(loadNotifications, [loadNotifications]);

    const handleNotificationPress = async (item: Notification) => {
        if (item.unread) {
            try {
                await markNotificationAsRead(item.id);
                setNotifications((prev) =>
                    prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
                );
            } catch (err) {
                console.log("Error marking notification as read:", err);
            }
        }

        if (item.targetType === "SERVICE" && item.targetId) {
            router.push({
                pathname: "/service/[id]",
                params: {
                    id: String(item.targetId),
                    openComments: "true",
                },
            });
        }
    };

    const markAllRead = async () => {
        if (markingAllRead) return;

        const unreadIds = notifications
            .filter((n) => n.unread)
            .map((n) => n.id);

        if (unreadIds.length === 0) return;

        const previousNotifications = notifications;

        setMarkingAllRead(true);
        setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));

        try {
            await Promise.all(unreadIds.map((id) => markNotificationAsRead(id)));
        } catch (err) {
            console.log("❌ Mark all notifications read error:", err);
            setNotifications(previousNotifications);
        } finally {
            setMarkingAllRead(false);
        }
    };

    return (
        <SafeAreaView style={styles.root} edges={[]}>
            <StatusBar barStyle="light-content" backgroundColor="#0d2d5e" translucent={false} />

            {/* ── HEADER ──────────────────────────────────────────── */}
            <LinearGradient
                colors={["#0d2d5e", "#1271b8", "#2D9C7C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.blob1} />
                <View style={styles.blob2} />

                {/* Row 1: back — title — tout lire */}
                <View style={styles.headerNav}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => router.back()}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="chevron-back" size={22} color="#fff" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Notifications</Text>

                    {/* Always reserve same width so title stays centred */}
                    <TouchableOpacity
                        style={[
                            styles.toutLireBtn,
                            unreadCount === 0 && { opacity: 0, pointerEvents: "none" } as any,
                            markingAllRead && { opacity: 0.65 },
                        ]}
                        onPress={markAllRead}
                        activeOpacity={0.8}
                        disabled={unreadCount === 0 || markingAllRead}
                    >
                        <Ionicons name="checkmark-done" size={14} color="#fff" />
                        <Text style={styles.toutLireTxt}>Tout lire</Text>
                    </TouchableOpacity>
                </View>

                {/* Row 2: subtitle — unread badge */}
                <View style={styles.headerBottom}>
                    <View>
                        <Text style={styles.headerLabel}>SOMAP & SERVICES</Text>
                        <Text style={styles.headerSubtitle}>
                            Gérez vos notifications et mises à jour
                        </Text>
                    </View>

                    {unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <View style={styles.unreadBadgeDot} />
                            <Text style={styles.unreadBadgeTxt}>{unreadCount} non lues</Text>
                        </View>
                    )}
                </View>
            </LinearGradient>

            {/* ── FILTER PILLS ────────────────────────────────────── */}
            <View style={styles.filtersWrap}>
                <FlatList
                    data={FILTERS}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(f) => f}
                    contentContainerStyle={{ gap: 7, paddingHorizontal: spacing.lg }}
                    renderItem={({ item: f }) => (
                        <TouchableOpacity
                            onPress={() => setActiveFilter(f)}
                            style={[
                                styles.filterPill,
                                activeFilter === f && styles.filterPillActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.filterPillTxt,
                                    activeFilter === f && styles.filterPillTxtActive,
                                ]}
                            >
                                {f}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* ── LIST ────────────────────────────────────────────── */}
            <SectionList
                sections={sections}
                extraData={notifications}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                renderSectionHeader={({ section }) => (
                    <Text style={styles.sectionLabel}>{section.title}</Text>
                )}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        activeOpacity={0.82}
                        onPress={() => void handleNotificationPress(item)}
                    >
                        <NotifCard item={item} />
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    loading ? (
                        <View style={styles.emptyWrap}>
                            <View style={styles.emptyIcon}>
                                <Ionicons name="reload-outline" size={28} color={colors.textHint} />
                            </View>
                            <Text style={styles.emptyTitle}>Chargement...</Text>
                        </View>
                    ) : (
                        <View style={styles.emptyWrap}>
                            <View style={styles.emptyIcon}>
                                <Ionicons name="notifications-off-outline" size={32} color={colors.textHint} />
                            </View>
                            <Text style={styles.emptyTitle}>Aucune notification</Text>
                            <Text style={styles.emptySub}>Vous êtes à jour !</Text>
                        </View>
                    )
                }
            />
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#eef4fb",
    },

    // ── Header ──────────────────────────────────────────────────────
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: 10,
        paddingBottom: 18,
        overflow: "hidden",
        position: "relative",
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
    headerNav: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 2,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.10)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        color: "#fff",
        fontSize: 24,
        fontFamily: fonts.condensedBold,
        letterSpacing: 0.4,
        textAlign: "center",
    },
    toutLireBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "rgba(255,255,255,0.18)",
        borderRadius: radius.pill,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
    },
    toutLireTxt: {
        color: "#fff",
        fontSize: 11,
        fontFamily: fonts.bodySemiBold,
    },
    headerLabel: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 11,
        letterSpacing: 1,
        fontFamily: fonts.bodyMedium,
        marginBottom: 4,
    },
    headerBottom: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginTop: 16,
        zIndex: 2,
    },
    headerSubtitle: {
        color: "rgba(255,255,255,0.75)",
        fontSize: 13,
        fontFamily: fonts.body,
    },
    unreadBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: "rgba(255,255,255,0.15)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
        borderRadius: radius.pill,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    unreadBadgeDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: colors.warning,
    },
    unreadBadgeTxt: {
        color: "#fff",
        fontSize: 11,
        fontFamily: fonts.bodySemiBold,
    },

    // ── Filters ─────────────────────────────────────────────────────
    filtersWrap: {
        paddingTop: 14,
        paddingBottom: 4,
    },
    filterPill: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: radius.pill,
        backgroundColor: colors.bgCard,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    filterPillActive: {
        backgroundColor: colors.blue,
        borderColor: colors.blue,
    },
    filterPillTxt: {
        fontSize: 11,
        fontFamily: fonts.bodySemiBold,
        color: colors.textSecondary,
    },
    filterPillTxtActive: {
        color: "#fff",
    },

    // ── List ────────────────────────────────────────────────────────
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingTop: 8,
        paddingBottom: 110,
    },
    sectionLabel: {
        fontSize: 10,
        fontFamily: fonts.condensedBold,
        color: colors.textMuted,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        marginTop: 8,
        marginBottom: 8,
    },

    // ── Card ────────────────────────────────────────────────────────
    card: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 11,
        backgroundColor: colors.bgCard,
        borderRadius: 16,
        padding: 13,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderLeftWidth: 3,
        overflow: "hidden",
        ...shadows.sm,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        position: "relative",
    },
    unreadDot: {
        position: "absolute",
        top: -2,
        right: -2,
        width: 9,
        height: 9,
        borderRadius: 5,
        backgroundColor: colors.blue,
        borderWidth: 2,
        borderColor: colors.bgCard,
    },
    cardBody: {
        flex: 1,
        minWidth: 0,
    },
    cardTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 6,
    },
    cardTitle: {
        fontSize: 13,
        fontFamily: fonts.bodySemiBold,
        color: colors.textPrimary,
        flex: 1,
    },
    cardTime: {
        fontSize: 10,
        fontFamily: fonts.body,
        color: colors.textHint,
        flexShrink: 0,
    },
    cardMsg: {
        fontSize: 11,
        fontFamily: fonts.body,
        color: colors.textSecondary,
        marginTop: 3,
        lineHeight: 16,
    },
    cardFooter: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 9,
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: radius.pill,
    },
    tagTxt: {
        fontSize: 9,
        fontFamily: fonts.bodySemiBold,
        letterSpacing: 0.3,
    },

    // ── Empty ────────────────────────────────────────────────────────
    emptyWrap: {
        alignItems: "center",
        paddingTop: 60,
        gap: 10,
    },
    emptyIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: colors.bgCard,
        borderWidth: 1,
        borderColor: colors.borderLight,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyTitle: {
        fontSize: 15,
        fontFamily: fonts.condensedBold,
        color: colors.textPrimary,
        letterSpacing: 0.3,
    },
    emptySub: {
        fontSize: 12,
        fontFamily: fonts.body,
        color: colors.textMuted,
    },
});
