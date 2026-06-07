import React, { useEffect, useRef } from "react";

import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    StatusBar,
    Image,
    ImageBackground,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import Colors from "../constants/colors";

import {router, SplashScreen} from "expo-router";
import { getToken, getUser } from "../utils/storage";
import { useAuthStore } from "../store/authStore";

const { width, height } = Dimensions.get("window");

export default function SplashScreenn() {

    const logoScale = useRef(new Animated.Value(0.7)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;

    const titleTY = useRef(new Animated.Value(24)).current;
    const titleOp = useRef(new Animated.Value(0)).current;

    const subOp = useRef(new Animated.Value(0)).current;

    const badgeOp = useRef(new Animated.Value(0)).current;

    const barWidth = useRef(new Animated.Value(0)).current;

    const bottomOp = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.parallel([
                Animated.spring(logoScale, {
                    toValue: 1,
                    tension: 80,
                    friction: 8,
                    useNativeDriver: true,
                }),

                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),

            Animated.delay(100),

            Animated.parallel([
                Animated.timing(titleTY, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),

                Animated.timing(titleOp, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ]),

            Animated.delay(150),

            Animated.parallel([
                Animated.timing(subOp, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),

                Animated.timing(badgeOp, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]),

            Animated.delay(200),

            Animated.parallel([
                Animated.timing(bottomOp, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),

                Animated.timing(barWidth, {
                    toValue: 180 * 1.5,
                    duration: 1800,
                    useNativeDriver: false,
                }),
            ]),
        ]).start(async () => {
            try {
                const token = await getToken();
                const user = await getUser();
                if (token && user) {
                    useAuthStore.getState().setAuth(token, user);
                    router.replace("/(tabs)/home");
                    return;
                }
            } catch (e) {
                console.log("Error restoring session:", e);
            }
            setTimeout(() => {
                router.replace("/onboarding");
            }, 400);
        });
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar
                translucent={false}
                backgroundColor="#0d2d5e"
                barStyle="light-content"
            />

            {/* Background */}
            <ImageBackground
                source={require("../assets/images/splash-bg.png")}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"

            >
                <View
                    style={{
                        ...StyleSheet.absoluteFillObject,
                        backgroundColor: "rgba(255,255,255,0.88)",
                    }}
                />
            </ImageBackground>

            {/* Decorative elements */}
            <View style={[styles.decorRing, styles.ringTL1]} />
            <View style={[styles.decorRing, styles.ringTL2]} />

            <View style={[styles.decorRing, styles.ringBR1]} />
            <View style={[styles.decorRing, styles.ringBR2]} />

            <View style={styles.diamond} />

            {/* Main content */}
            <View style={styles.content}>


                {/* Animated logo */}
                <Animated.View
                    style={[
                        styles.logoWrap,
                        {
                            opacity: logoOpacity,
                            transform: [{ scale: logoScale }],
                        },
                    ]}
                >
                    {/* SMALL ICON FIRST */}
                    <Image
                        source={require("../assets/images/icon_main.png")}
                        style={styles.iconMain}
                    />

                    {/* MAIN LOGO */}
                    <Image
                        source={require("../assets/logo.png")}
                        style={styles.logo}
                    />
                </Animated.View>

                {/* Text block */}
                <Animated.View
                    style={[
                        styles.titleBlock,
                        {
                            opacity: titleOp,
                            transform: [{ translateY: titleTY }],
                        },
                    ]}
                >
                    {/* Brand stripe sits behind the gap between logo and title, not through the text. */}
                    <LinearGradient
                        colors={[
                            "transparent",
                            Colors.navy,
                            Colors.cyan,
                            Colors.green,
                            "transparent",
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.brandStripe}
                    />

                    <View style={styles.titleRow}>
                        <Text
                            style={[
                                styles.titleText,
                                { color: Colors.green },
                            ]}
                        >
                            S
                        </Text>

                        <Text style={[styles.titleText, { color: Colors.navy }]}>
                            OMAP
                        </Text>

                        <Text style={[styles.titleText, { color: Colors.cyan }]}>
                            {" "}
                            &{" "}
                        </Text>

                        <Text style={[styles.titleText, { color: Colors.green }]}>
                            SERVICE
                        </Text>
                    </View>

                    <Animated.Text
                        style={[styles.subtitle, { opacity: subOp }]}
                    >
                        Solutions industrielles intelligentes
                    </Animated.Text>

                    <LinearGradient
                        colors={[Colors.green, Colors.cyan]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.divider}
                    />

                    <Animated.Text
                        style={[styles.tagline, { opacity: subOp }]}
                    >
                        Société marocaine des produits chimiques et services
                    </Animated.Text>

                    <Animated.View
                        style={[styles.badgeRow, { opacity: badgeOp }]}
                    >
                        <View style={[styles.badge, styles.badgeNavy]}>
                            <Text style={[styles.badgeText, { color: Colors.navy }]}>
                                Chimie
                            </Text>
                        </View>

                        <View style={[styles.badge, styles.badgeCyan]}>
                            <Text
                                style={[styles.badgeText, { color: Colors.cyanDark }]}
                            >
                                Eau
                            </Text>
                        </View>

                        <View style={[styles.badge, styles.badgeGreen]}>
                            <Text
                                style={[styles.badgeText, { color: Colors.greenDark }]}
                            >
                                Industrie
                            </Text>
                        </View>
                    </Animated.View>
                </Animated.View>
            </View>

            {/* Bottom */}
            <Animated.View
                style={[styles.bottomSection, { opacity: bottomOp }]}
            >
                <Text style={styles.loadingLabel}>
                    Chargement en cours...
                </Text>

                <View style={styles.barTrack}>
                    <Animated.View
                        style={{
                            width: barWidth,
                            overflow: "hidden",
                            height: 3,
                            borderRadius: 99,
                        }}
                    >
                        <LinearGradient
                            colors={[Colors.navy, Colors.cyan, Colors.green]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ flex: 1 }}
                        />
                    </Animated.View>
                </View>

                <Text style={styles.footer}>
                    Kenitra · Maroc | v1.0.0
                </Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 40,
        paddingBottom: 28,
        paddingHorizontal: 24,
        backgroundColor: "#ffffff",
    },

    decorRing: {
        position: "absolute",
        borderRadius: 999,
        borderWidth: 1.5,
    },

    ringTL1: {
        width: 220,
        height: 220,
        top: -60,
        left: -60,
        borderColor: "rgba(143,189,105,0.15)",
    },

    ringTL2: {
        width: 130,
        height: 130,
        top: -20,
        left: -20,
        borderColor: "rgba(19,172,213,0.10)",
        borderWidth: 1,
    },

    ringBR1: {
        width: 260,
        height: 260,
        bottom: -60,
        right: -60,
        borderColor: "rgba(49,80,127,0.10)",
    },

    ringBR2: {
        width: 150,
        height: 150,
        bottom: -10,
        right: -10,
        borderColor: "rgba(143,189,105,0.10)",
        borderWidth: 1,
    },

    diamond: {
        position: "absolute",
        width: 70,
        height: 70,
        right: -20,
        top: height * 0.42,
        borderWidth: 1,
        borderColor: "rgba(49,80,127,0.10)",
        transform: [{ rotate: "45deg" }],
    },

    brandStripe: {
        position: "absolute",
        top: -18,
        left: -24,
        right: -24,
        height: 3,
        opacity: 0.55,
    },

    content: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        paddingBottom: Math.max(72, height * 0.1),
    },

    logoWrap: {
        alignItems: "center",
        marginBottom: 28,
    },

    logo: {
        width: Math.min(150, width * 0.38),
        height: Math.min(150, width * 0.38),
        resizeMode: "contain",
        marginTop: -64,
    },

    titleBlock: {
        alignItems: "center",
        width: "100%",
        marginTop: 0,
    },

    titleRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        flexWrap: "wrap",
        justifyContent: "center",
        maxWidth: Math.min(340, width - 36),
    },

    titleText: {
        fontSize: Math.min(34, width * 0.085),
        fontWeight: "700",
        lineHeight: Math.min(40, width * 0.1),
        letterSpacing: 1,
    },

    subtitle: {
        fontSize: 11,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: Colors.cyan,
        textAlign: "center",
        marginTop: 4,
    },

    divider: {
        width: 50,
        height: 2,
        borderRadius: 2,
        marginVertical: 12,
    },

    tagline: {
        fontSize: 11,
        color: Colors.textMuted,
        textAlign: "center",
        fontStyle: "italic",
        letterSpacing: 0.4,
        paddingHorizontal: 16,
    },

    badgeRow: {
        flexDirection: "row",
        gap: 8,
        marginTop: 18,
    },

    badge: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 99,
        borderWidth: 1,
    },

    badgeNavy: {
        backgroundColor: "rgba(49,80,127,0.06)",
        borderColor: "rgba(49,80,127,0.25)",
    },

    badgeCyan: {
        backgroundColor: "rgba(19,172,213,0.06)",
        borderColor: "rgba(19,172,213,0.25)",
    },

    badgeGreen: {
        backgroundColor: "rgba(143,189,105,0.08)",
        borderColor: "rgba(143,189,105,0.3)",
    },

    badgeText: {
        fontSize: 9,
        fontWeight: "500",
        letterSpacing: 1.5,
        textTransform: "uppercase",
    },

    bottomSection: {
        alignItems: "center",
        gap: 12,
        paddingBottom: 4,
    },

    loadingLabel: {
        fontSize: 10,
        letterSpacing: 2,
        color: Colors.navy,
        fontWeight: "600",
        textTransform: "uppercase",
        textShadowColor: "rgba(19,172,213,0.25)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
    },

    barTrack: {
        width: 200,
        height: 4,
        backgroundColor: "rgba(19,172,213,0.12)",
        borderRadius: 99,
        overflow: "hidden",
    },

    footer: {
        fontSize: 9,
        letterSpacing: 1.2,
        color: "rgba(49,80,127,0.55)", // navy with transparency = elegant
        textTransform: "uppercase",
    },
    iconMain: {
        width: Math.min(172, width * 0.44),
        height: Math.min(172, width * 0.44),
        resizeMode: "contain",
        marginBottom: -88,
    },
});
