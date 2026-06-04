import * as Device from "expo-device";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import api from "./api";

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export async function registerForPushNotificationsAsync(userId: number) {
    // Load expo-notifications dynamically to prevent crash during import in Expo Go
    const Notifications = await import("expo-notifications");

    // Configure how notifications are handled when the app is active/open (in foreground)
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        } as any),
    });

    let token = null;

    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== "granted") {
            console.warn("Permission for push notifications not granted.");
            return null;
        }

        if (isExpoGo) {
            console.log("🏃 Running in Expo Go: Skipped EAS remote token registration, but notification permissions are active for local alerts.");
            return null;
        }

        try {
            // Retrieve dynamic projectId configured via EAS
            const projectId =
                Constants?.expoConfig?.extra?.eas?.projectId ??
                Constants?.easConfig?.projectId;

            token = (
                await Notifications.getExpoPushTokenAsync({
                    projectId,
                })
            ).data;
            console.log("🚀 Expo Push Token:", token);

            // Register push token with backend Spring Boot client
            await api.post(`/clients/${userId}/push-token`, { token });
            console.log("🚀 Push token registered successfully with backend!");
        } catch (error) {
            console.error("❌ Error registering Expo push token with backend:", error);
        }
    } else {
        console.log("Physical device required for native push notifications.");
    }

    return token;
}

export async function showLocalNotification(title: string, body: string, data?: any) {
    try {
        const Notifications = await import("expo-notifications");
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data: data ?? {},
                sound: true,
            },
            trigger: null, // show immediately
        });
    } catch (error) {
        console.error("❌ Failed to show local notification:", error);
    }
}

