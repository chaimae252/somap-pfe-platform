import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { SyncProvider } from "@/contexts/SyncContext";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import GlobalChatBot from "@/components/chat/GlobalChatBot";

export default function RootLayout() {
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
                    case "SERVICE":
                        router.push({
                            pathname: "/service/[id]",
                            params: { id: targetId },
                        });
                        break;
                    case "PROJET":
                        router.push("/(tabs)/projets");
                        break;
                    case "DEMANDE":
                        router.push("/(tabs)/demandes");
                        break;
                    default:
                        router.push("/(tabs)/home");
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
                        backgroundColor="#0d2d5e"
                        barStyle="light-content"
                    />
                    <SafeAreaView style={{ flex: 1, backgroundColor: "#0d2d5e" }} edges={["top"]}>
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
