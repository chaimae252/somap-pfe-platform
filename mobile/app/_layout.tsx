import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { SyncProvider } from "@/contexts/SyncContext";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import GlobalChatBot from "@/components/chat/GlobalChatBot";

export default function RootLayout() {
    const segments = useSegments();
    const isSplash = segments.length > 0 && segments[0] === "splash";
    const barBgColor = isSplash ? "#F8FAFC" : "#0d2d5e";
    const barStyle = isSplash ? "dark-content" : "light-content";

    useEffect(() => {
        // Handle foreground notifications
        const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
            console.log("🔔 Foreground push received:", notification);
        });

        // Handle push notification taps (both background and closed states)
        const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data;
            console.log("🔔 Push notification tapped with data:", data);

            if (data?.targetType && data?.targetId) {
                const targetId = String(data.targetId);
                switch (data.targetType) {
                    case "DEMANDE":
                        router.push(`/demande/${targetId}`);
                        break;
                    case "PROJET":
                        router.push(`/projet/${targetId}`);
                        break;
                    case "COMMENTAIRE":
                        router.push(`/service/${targetId}`);
                        break;
                    default:
                        break;
                }
            }
        });

        return () => {
            foregroundSubscription.remove();
            responseSubscription.remove();
        };
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <SyncProvider>
                    <StatusBar
                        translucent={false}
                        backgroundColor={barBgColor}
                        barStyle={barStyle}
                    />
                    <SafeAreaView style={{ flex: 1, backgroundColor: barBgColor }} edges={["top"]}>
                        <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
                            <Stack.Screen name="index" />
                            <Stack.Screen name="splash" />
                            <Stack.Screen name="onboarding" />
                            <Stack.Screen name="(tabs)" />
                        </Stack>
                        <GlobalChatBot />
                    </SafeAreaView>
                </SyncProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
