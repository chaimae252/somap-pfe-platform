import React, { useState } from "react";
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
} from "react-native";

import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import Theme from "../../constants/theme";

const { colors, fonts, spacing, radius, shadows } = Theme;

type Service = {
    id: string;
    title: string;
    description: string;
    image: any;
};

export default function ServicesScreen() {
    const router = useRouter();
    const [search, setSearch] = useState("");

    const services: Service[] = [
        {
            id: "1",
            title: "Traitement de surface",
            description:
                "Solutions complètes de préparation, nettoyage et protection des surfaces métalliques industrielles.",
            image: require("../../assets/traitement-surface.jpg"),
        },

        {
            id: "2",
            title: "Sablage",
            description:
                "Nettoyage industriel des surfaces par projection d’abrasif à grande vitesse.",
            image: require("../../assets/sablage.jpg"),
        },

        {
            id: "3",
            title: "Métallisation",
            description:
                "Protection anticorrosion durable par application de couches métalliques.",
            image: require("../../assets/metallisation.jpg"),
        },

        {
            id: "4",
            title: "Peinture industrielle",
            description:
                "Application de peintures techniques pour industrie et bâtiment.",
            image: require("../../assets/peinture.jpg"),
        },

        {
            id: "5",
            title: "Traitement des eaux",
            description:
                "Installation et maintenance des systèmes de traitement des eaux industrielles.",
            image: require("../../assets/eaux.jpg"),
        },

        {
            id: "6",
            title: "Produits chimiques",
            description:
                "Fourniture de produits chimiques adaptés aux besoins industriels.",
            image: require("../../assets/chimique.jpg"),
        },

        {
            id: "7",
            title: "Travaux polyester",
            description:
                "Fabrication et réparation de cuves et structures en polyester.",
            image: require("../../assets/polyester.png"),
        },
    ];

    const filteredServices = services.filter((item) =>
        item.title.toLowerCase().includes(search.toLowerCase())
    );

    const getServiceColor = (title: string) => {
        const lower = title.toLowerCase();

        if (lower.includes("sablage")) {
            return {
                bg: "rgba(18,113,184,0.10)",
                color: "#1271B8",
                icon: "hammer",
            };
        }

        if (lower.includes("peinture")) {
            return {
                bg: "rgba(19,172,213,0.10)",
                color: "#13ACD5",
                icon: "color-fill",
            };
        }

        if (lower.includes("traitement")) {
            return {
                bg: "rgba(73,198,154,0.12)",
                color: "#2D9C7C",
                icon: "water",
            };
        }

        return {
            bg: "rgba(212,160,23,0.12)",
            color: "#D4A017",
            icon: "construct",
        };
    };

    const renderItem = ({ item }: { item: Service }) => {
        const config = getServiceColor(item.title);

        return (
            <TouchableOpacity
                activeOpacity={0.88}
                style={styles.card}
                onPress={() => router.push(`/service/${item.id}` as any)}
            >
                <Image source={item.image} style={styles.image} />

                <View style={styles.content}>
                    <View
                        style={[
                            styles.badge,
                            {
                                backgroundColor: config.bg,
                            },
                        ]}
                    >
                        <Ionicons
                            name={config.icon as any}
                            size={14}
                            color={config.color}
                        />

                        <Text
                            style={[
                                styles.badgeText,
                                {
                                    color: config.color,
                                },
                            ]}
                        >
                            Service industriel
                        </Text>
                    </View>

                    <Text style={styles.title}>{item.title}</Text>

                    <Text style={styles.description} numberOfLines={3}>
                        {item.description}
                    </Text>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.detailsButton}>
                            <Text style={styles.detailsText}>
                                Voir détails
                            </Text>

                            <Ionicons
                                name="arrow-forward"
                                size={16}
                                color={colors.blue}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* HEADER */}
            <LinearGradient
                colors={["#0d2d5e", "#1271b8", "#2D9C7C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.blob1} />
                <View style={styles.blob2} />

                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.headerLabel}>
                            SOMAP & SERVICE
                        </Text>

                        <Text style={styles.headerTitle}>
                            Nos Services
                        </Text>

                        <Text style={styles.headerSubtitle}>
                            Découvrez notre expertise industrielle
                        </Text>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.notificationButton}
                    >
                        <Ionicons
                            name="notifications-outline"
                            size={22}
                            color="#fff"
                        />

                        <View style={styles.notificationBadge}>
                            <Text style={styles.notificationBadgeText}>
                                3
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* SEARCH */}
            <View style={styles.searchWrapper}>
                <View style={styles.searchContainer}>
                    <Ionicons
                        name="search"
                        size={18}
                        color={colors.textMuted}
                    />

                    <TextInput
                        placeholder="Rechercher un service..."
                        placeholderTextColor={colors.textMuted}
                        value={search}
                        onChangeText={setSearch}
                        style={styles.search}
                    />
                </View>
            </View>

            {/* LIST */}
            <FlatList
                data={filteredServices}
                keyExtractor={(item) => item.id}
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

    notificationButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: "rgba(255,255,255,0.12)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
        alignItems: "center",
        justifyContent: "center",
    },

    notificationBadge: {
        position: "absolute",
        top: 5,
        right: 5,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: "#49C69A",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 4,
    },

    notificationBadgeText: {
        color: "#fff",
        fontSize: 9,
        fontFamily: fonts.bodySemiBold,
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
});