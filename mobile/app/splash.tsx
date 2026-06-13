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
import { router } from "expo-router";
import { getToken, getUser } from "../utils/storage";
import { useAuthStore } from "../store/authStore";

const { width, height } = Dimensions.get("window");

export default function SplashScreenn() {
    const logoScale = useRef(new Animated.Value(0.3)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const logoRotate = useRef(new Animated.Value(0)).current;
    const glowScale = useRef(new Animated.Value(0.5)).current;
    const glowOpacity = useRef(new Animated.Value(0)).current;
    
    const bottomOpacity = useRef(new Animated.Value(0)).current;
    const barWidth = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Start animation sequence
        Animated.sequence([
            // Animate background glow first
            Animated.parallel([
                Animated.timing(glowOpacity, {
                    toValue: 0.6,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.spring(glowScale, {
                    toValue: 1.2,
                    tension: 30,
                    friction: 5,
                    useNativeDriver: true,
                }),
            ]),
            // Animate logo scale, rotate, and fade-in
            Animated.parallel([
                Animated.spring(logoScale, {
                    toValue: 1,
                    tension: 40,
                    friction: 6,
                    useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(logoRotate, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ]),
            // Animate bottom loading section
            Animated.parallel([
                Animated.timing(bottomOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(barWidth, {
                    toValue: 220,
                    duration: 2200,
                    useNativeDriver: false,
                }),
            ]),
        ]).start(async () => {
            // Restore user session if it exists, otherwise redirect to onboarding
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
            }, 300);
        });
    }, []);

    const rotation = logoRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ["-10deg", "0deg"],
    });

    return (
        <View style={styles.container}>
            <StatusBar
                translucent={true}
                backgroundColor="transparent"
                barStyle="dark-content"
            />

            {/* Deep Rich Background Image with Soft Frosty Light Gradient Tint */}
            <ImageBackground
                source={require("../assets/images/splash-bg.png")}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
            >
                {/* High-contrast brand light gradient overlay */}
                <LinearGradient
                    colors={["rgba(248, 250, 252, 0.92)", "rgba(241, 245, 249, 0.96)"]}
                    style={StyleSheet.absoluteFill}
                />
            </ImageBackground>

            {/* Glowing Orbs behind the logo */}
            <Animated.View 
                style={[
                    styles.glowOrb, 
                    {
                        opacity: glowOpacity,
                        transform: [{ scale: glowScale }],
                    }
                ]}
            >
                <LinearGradient
                    colors={["rgba(126, 201, 51, 0.12)", "rgba(126, 201, 51, 0.0)"]}
                    style={styles.orbInner}
                />
            </Animated.View>

            <Animated.View 
                style={[
                    styles.glowOrb2, 
                    {
                        opacity: glowOpacity,
                        transform: [{ scale: glowScale }],
                    }
                ]}
            >
                <LinearGradient
                    colors={["rgba(18, 113, 184, 0.15)", "rgba(18, 113, 184, 0.0)"]}
                    style={styles.orbInner}
                />
            </Animated.View>

            {/* Abstract Premium Watermark Vectors */}
            <View style={styles.line1} />
            <View style={styles.line2} />
            <View style={styles.circle1} />
            <View style={styles.circle2} />

            {/* Center Content */}
            <View style={styles.centerContent}>
                <Animated.View
                    style={[
                        styles.glassCard,
                        {
                            opacity: logoOpacity,
                            transform: [
                                { scale: logoScale },
                                { rotate: rotation }
                            ],
                        },
                    ]}
                >
                    {/* Inner gloss gradient shine */}
                    <LinearGradient
                        colors={["rgba(255, 255, 255, 0.98)", "rgba(248, 250, 252, 0.95)"]}
                        style={styles.cardGradient}
                    >
                        <Image
                            source={require("../assets/logo.png")}
                            style={styles.logo}
                        />
                    </LinearGradient>
                </Animated.View>
            </View>

            {/* Bottom Section */}
            <Animated.View
                style={[
                    styles.bottomContent,
                    {
                        opacity: bottomOpacity,
                    },
                ]}
            >
                {/* Glowing Loader */}
                <View style={styles.loaderContainer}>
                    <View style={styles.barTrack}>
                        <Animated.View
                            style={{
                                width: barWidth,
                                height: "100%",
                            }}
                        >
                            <LinearGradient
                                colors={["#1271b8", "#7EC933"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.progressBar}
                            />
                        </Animated.View>
                    </View>
                </View>

                {/* Tags */}
                <Text style={styles.tagline}>CHIMIE · EAU · INDUSTRIE</Text>
                <Text style={styles.footer}>SOCIÉTÉ MAROCAINE DES PRODUITS CHIMIQUES ET SERVICES</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 55,
        paddingHorizontal: 24,
    },
    centerContent: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
    },
    glassCard: {
        width: width * 0.76,
        borderRadius: 28,
        padding: 4,
        backgroundColor: "rgba(255, 255, 255, 0.65)",
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 8,
        borderWidth: 1.5,
        borderColor: "rgba(255, 255, 255, 0.8)",
        overflow: "hidden",
    },
    cardGradient: {
        borderRadius: 24,
        paddingVertical: 25,
        paddingHorizontal: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    logo: {
        width: "100%",
        height: (width * 0.65) * 0.45,
        resizeMode: "contain",
    },
    bottomContent: {
        alignItems: "center",
        width: "100%",
        gap: 12,
        paddingBottom: 15,
        zIndex: 5,
    },
    loaderContainer: {
        shadowColor: "#1271b8",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 2,
    },
    barTrack: {
        width: 220,
        height: 5,
        backgroundColor: "rgba(15, 23, 42, 0.06)",
        borderRadius: 3,
        overflow: "hidden",
        marginBottom: 10,
    },
    progressBar: {
        flex: 1,
        borderRadius: 3,
    },
    tagline: {
        fontSize: 10,
        fontWeight: "800",
        color: "#1271b8",
        letterSpacing: 4,
        textTransform: "uppercase",
        textAlign: "center",
        textShadowColor: "rgba(18, 113, 184, 0.15)",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    footer: {
        fontSize: 8,
        fontWeight: "600",
        color: "#64748b",
        letterSpacing: 0.6,
        textAlign: "center",
        textTransform: "uppercase",
        maxWidth: "90%",
        opacity: 0.8,
    },
    glowOrb: {
        position: "absolute",
        width: 300,
        height: 300,
        borderRadius: 150,
        top: height * 0.22,
        left: width * 0.1,
        zIndex: 0,
    },
    glowOrb2: {
        position: "absolute",
        width: 260,
        height: 260,
        borderRadius: 130,
        top: height * 0.32,
        right: width * 0.05,
        zIndex: 0,
    },
    orbInner: {
        flex: 1,
        borderRadius: 999,
    },
    line1: {
        position: "absolute",
        width: 1,
        height: height * 0.4,
        backgroundColor: "rgba(15, 23, 42, 0.02)",
        left: width * 0.15,
        top: 0,
    },
    line2: {
        position: "absolute",
        width: 1,
        height: height * 0.4,
        backgroundColor: "rgba(15, 23, 42, 0.02)",
        right: width * 0.2,
        bottom: 0,
    },
    circle1: {
        position: "absolute",
        width: 180,
        height: 180,
        borderRadius: 90,
        borderWidth: 1,
        borderColor: "rgba(18, 113, 184, 0.04)",
        top: -60,
        right: -30,
    },
    circle2: {
        position: "absolute",
        width: 220,
        height: 220,
        borderRadius: 110,
        borderWidth: 1,
        borderColor: "rgba(126, 201, 51, 0.03)",
        bottom: -50,
        left: -40,
    },
});
