import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Theme from "../../constants/theme";

const { colors, fonts } = Theme;

type Props = {
    count?: number;
    onPress?: () => void;
};

export default function NotificationButton({ count = 0, onPress }: Props) {
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            style={styles.button}
            onPress={onPress || (() => router.push("/notifications"))}
        >
            <Ionicons name="notifications-outline" size={22} color="#fff" />

            {count > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {count > 99 ? "99+" : count}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: "rgba(255,255,255,0.12)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },

    badge: {
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

    badgeText: {
        color: "#fff",
        fontSize: 9,
        fontFamily: fonts.bodySemiBold,
    },
});