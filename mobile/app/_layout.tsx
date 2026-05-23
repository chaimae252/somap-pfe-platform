import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <StatusBar
                    translucent={false}
                    backgroundColor="#0d2d5e"
                    barStyle="light-content"
                />
                <SafeAreaView style={{ flex: 1, backgroundColor: "#0d2d5e" }} edges={["top"]}>
                    <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="index" />
                        <Stack.Screen name="splash" />
                        <Stack.Screen name="(onboarding)" />
                        <Stack.Screen name="(auth)" />
                        <Stack.Screen name="(tabs)" />
                    </Stack>
                </SafeAreaView>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
