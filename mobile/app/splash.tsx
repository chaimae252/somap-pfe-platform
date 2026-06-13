import React, { useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    StatusBar,
    Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { getToken, getUser } from "../utils/storage";
import { useAuthStore } from "../store/authStore";

const { width } = Dimensions.get("window");

export default function SplashScreenn() {
    const logoScale = useRef(new Animated.Value(0.85)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const logoTranslateY = useRef(new Animated.Value(20)).current;
    const bottomOpacity = useRef(new Animated.Value(0)).current;
    const barWidth = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Start animation sequence
        Animated.sequence([
            // Animate logo spring scale, fade-in, and translation
            Animated.parallel([
                Animated.spring(logoScale, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(logoTranslateY, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]),
            // Animate bottom loading section and progress bar width
            Animated.parallel([
                Animated.timing(bottomOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(barWidth, {
                    toValue: 200,
                    duration: 2000,
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

    return (
        <View style={styles.container}>
            <StatusBar
                translucent={true}
                backgroundColor="transparent"
                barStyle="dark-content"
            />

            {/* Premium soft background gradient */}
            <LinearGradient
                colors={["#eef3fb", "#ffffff"]}
                style={styles.gradient}
            >
                {/* Centered Logo with Spring Animation */}
                <View style={styles.centerContent}>
                    <Animated.View
                        style={[
                            styles.logoContainer,
                            {
                                opacity: logoOpacity,
                                transform: [
                                    { scale: logoScale },
                                    { translateY: logoTranslateY }
                                ],
                            },
                        ]}
                    >
                        <Image
                            source={require("../assets/logo.png")}
                            style={styles.logo}
                        />
                    </Animated.View>
                </View>

                {/* Minimalist Bottom Loading Section */}
                <Animated.View
                    style={[
                        styles.bottomContent,
                        {
                            opacity: bottomOpacity,
                        },
                    ]}
                >
                    {/* Thin Modern Progress Bar */}
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

                    {/* Muted Subtitles & Tagline */}
                    <Text style={styles.tagline}>CHIMIE · EAU · INDUSTRIE</Text>
                    <Text style={styles.footer}>SOCIÉTÉ MAROCAINE DES PRODUITS CHIMIQUES ET SERVICES</Text>
                </Animated.View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ffffff",
    },
    gradient: {
        flex: 1,
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 50,
        paddingHorizontal: 24,
    },
    centerContent: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
    },
    logoContainer: {
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#1271b8",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
        elevation: 3,
    },
    logo: {
        width: width * 0.65,
        height: (width * 0.65) * 0.45,
        resizeMode: "contain",
    },
    bottomContent: {
        alignItems: "center",
        width: "100%",
        gap: 12,
        paddingBottom: 15,
    },
    barTrack: {
        width: 200,
        height: 4,
        backgroundColor: "rgba(18, 113, 184, 0.1)",
        borderRadius: 2,
        overflow: "hidden",
        marginBottom: 10,
    },
    progressBar: {
        flex: 1,
        borderRadius: 2,
    },
    tagline: {
        fontSize: 10,
        fontWeight: "600",
        color: "#6c7a92",
        letterSpacing: 3,
        textTransform: "uppercase",
        textAlign: "center",
    },
    footer: {
        fontSize: 8,
        fontWeight: "500",
        color: "#99b1cc",
        letterSpacing: 0.5,
        textAlign: "center",
        textTransform: "uppercase",
        maxWidth: "90%",
    },
});
